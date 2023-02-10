import * as posedetection from "@tensorflow-models/pose-detection";
import * as scatter from "scatter-gl";

const VIDEO_SIZE = {
  "640 X 480": { width: 640, height: 480 },
  "640 X 360": { width: 640, height: 360 },
  "360 X 270": { width: 360, height: 270 },
};

const BLAZEPOSE_CONFIG = {
  maxPoses: 1,
  type: "full",
  scoreThreshold: 0.65,
  render3D: true,
};

const ANCHOR_POINTS = [
  [0, 0, 0],
  [0, 1, 0],
  [-1, 0, 0],
  [-1, -1, 0],
];

export class Camera {
  constructor() {
    this.video = document.getElementById("video");
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.scatterGLEl = document.querySelector("#scatter-gl-container");
    this.scatterGL = new scatter.ScatterGL(this.scatterGLEl, {
      rotateOnStart: true,
      selectEnabled: false,
      styles: { polyline: { defaultOpacity: 1, deselectedOpacity: 1 } },
    });
    this.scatterGLHasInitialized = false;
    console.log("Camera constructor");
  }

  static async setupCamera(cameraParam) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Browser API navigator.mediaDevices.getUserMedia not available"
      );
    }

    const { targetFPS, sizeOption } = cameraParam;
    // const $size = params.VIDEO_SIZE[sizeOption];
    const $size = VIDEO_SIZE[sizeOption];
    const videoConfig = {
      audio: false,
      video: {
        facingMode: "user",
        // Only setting the video to a specified size for large screen, on
        // mobile devices accept the default size.
        // width: isMobile()
        //     ? params.VIDEO_SIZE['360 X 270'].width
        //     : $size.width,
        // height: isMobile()
        //     ? params.VIDEO_SIZE['360 X 270'].height
        //     : $size.height,
        width: $size.width,
        height: $size.height,
        frameRate: {
          ideal: targetFPS,
        },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(videoConfig);

    const camera = new Camera();
    camera.video.srcObject = stream;

    await new Promise((resolve) => {
      camera.video.onloadedmetadata = () => {
        resolve(video);
      };
    });

    camera.video.play();

    const videoWidth = camera.video.videoWidth;
    const videoHeight = camera.video.videoHeight;
    // Must set below two lines, otherwise video element doesn't show.
    camera.video.width = videoWidth;
    camera.video.height = videoHeight;

    camera.canvas.width = videoWidth;
    camera.canvas.height = videoHeight;
    const canvasContainer = document.querySelector(".canvas-wrapper");
    canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;

    // Because the image from camera is mirrored, need to flip horizontally.
    camera.ctx.translate(camera.video.videoWidth, 0);
    camera.ctx.scale(-1, 1);

    camera.scatterGLEl.style = `width: ${videoWidth}px; height: ${videoHeight}px;`;
    camera.scatterGL.resize();

    camera.scatterGLEl.style.display = BLAZEPOSE_CONFIG.render3D
      ? "inline-block"
      : "none";

    return camera;
  }

  drawCtx() {
    this.ctx.drawImage(
      this.video,
      0,
      0,
      this.video.videoWidth,
      this.video.videoHeight
    );
  }

  clearCtx() {
    this.ctx.clearRect(0, 0, this.video.videoWidth, this.video.videoHeight);
  }

  /**
   * Draw the keypoints and skeleton on the video.
   * @param poses A list of poses to render.
   */
  drawResults(poses) {
    console.log(poses);
    for (const pose of poses) {
      this.drawResult(pose);
    }
  }

  /**
   * Draw the keypoints and skeleton on the video.
   * @param pose A pose with keypoints to render.
   */
  drawResult(pose) {
    if (pose.keypoints != null) {
      this.drawKeypoints(pose.keypoints);
      this.drawSkeleton(pose.keypoints, pose.id);
    }
    if (pose.keypoints3D != null && BLAZEPOSE_CONFIG.render3D) {
      this.drawKeypoints3D(pose.keypoints3D);
    }
  }

  drawKeypoints(keypoints) {
    const keypointInd = posedetection.util.getKeypointIndexBySide(
      posedetection.SupportedModels.BlazePose
    );
    this.ctx.fillStyle = "Red";
    this.ctx.strokeStyle = "White";
    this.ctx.lineWidth = 2;

    for (const i of keypointInd.middle) {
      this.drawKeypoint(keypoints[i]);
    }

    this.ctx.fillStyle = "Green";
    for (const i of keypointInd.left) {
      this.drawKeypoint(keypoints[i]);
    }

    this.ctx.fillStyle = "Orange";
    for (const i of keypointInd.right) {
      this.drawKeypoint(keypoints[i]);
    }
  }

  drawKeypoint(keypoint) {
    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = BLAZEPOSE_CONFIG.scoreThreshold || 0;

    if (score >= scoreThreshold) {
      const circle = new Path2D();
      circle.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
      this.ctx.fill(circle);
      this.ctx.stroke(circle);
    }
  }

  /**
   * Draw the skeleton of a body on the video.
   * @param keypoints A list of keypoints.
   */
  drawSkeleton(keypoints, poseId) {
    // Each poseId is mapped to a color in the color palette.
    const color =
      BLAZEPOSE_CONFIG.enableTracking && poseId != null
        ? COLOR_PALETTE[poseId % 20]
        : "White";
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;

    posedetection.util
      .getAdjacentPairs(posedetection.SupportedModels.BlazePose)
      .forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        // If score is null, just show the keypoint.
        const score1 = kp1.score != null ? kp1.score : 1;
        const score2 = kp2.score != null ? kp2.score : 1;
        const scoreThreshold = BLAZEPOSE_CONFIG.scoreThreshold || 0;

        if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
          this.ctx.beginPath();
          this.ctx.moveTo(kp1.x, kp1.y);
          this.ctx.lineTo(kp2.x, kp2.y);
          this.ctx.stroke();
        }
      });
  }

  drawKeypoints3D(keypoints) {
    const scoreThreshold = BLAZEPOSE_CONFIG.scoreThreshold || 0;
    const pointsData = keypoints.map((keypoint) => [
      -keypoint.x,
      -keypoint.y,
      -keypoint.z,
    ]);

    const dataset = new scatter.ScatterGL.Dataset([
      ...pointsData,
      ...ANCHOR_POINTS,
    ]);

    const keypointInd = posedetection.util.getKeypointIndexBySide(
      posedetection.SupportedModels.BlazePose
    );
    this.scatterGL.setPointColorer((i) => {
      if (keypoints[i] == null || keypoints[i].score < scoreThreshold) {
        // hide anchor points and low-confident points.
        return "#ffffff";
      }
      if (i === 0) {
        return "#ff0000" /* Red */;
      }
      if (keypointInd.left.indexOf(i) > -1) {
        return "#00ff00" /* Green */;
      }
      if (keypointInd.right.indexOf(i) > -1) {
        return "#ffa500" /* Orange */;
      }
    });

    if (!this.scatterGLHasInitialized) {
      this.scatterGL.render(dataset);
    } else {
      this.scatterGL.updateDataset(dataset);
    }
    const connections = posedetection.util.getAdjacentPairs(
      posedetection.SupportedModels.BlazePose
    );
    const sequences = connections.map((pair) => ({ indices: pair }));
    // this.scatterGL.setSequences(sequences);
    // this.scatterGLHasInitialized = true;
  }
}

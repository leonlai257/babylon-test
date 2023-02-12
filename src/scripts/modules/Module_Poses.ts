import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  HemisphericLight,
} from "@babylonjs/core";

import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
// Register WebGL backend.
import "@tensorflow/tfjs-backend-webgl";
import { Camera } from "./Module_CameraTracking";
import { Module } from "../Module";

let detector, camera, stats;
let startInferenceTime,
  numInferences = 0;
let inferenceTimeSum = 0,
  lastPanelUpdate = 0;
let rafId;

export class Poses extends Module {
  // constructor(camera) {
  //   super();
  //   camera = camera;
  // }
  async createPosesDetector() {
    const model = poseDetection.SupportedModels.BlazePose;
    const detectorConfig = {
      runtime: "tfjs",
      enableSmoothing: true,
      modelType: "full",
    };

    return poseDetection.createDetector(model, detectorConfig);
  }

  public beginEstimatePosesStats() {
    startInferenceTime = (performance || Date).now();
  }

  public endEstimatePosesStats() {
    const endInferenceTime = (performance || Date).now();
    inferenceTimeSum += endInferenceTime - startInferenceTime;
    ++numInferences;

    const panelUpdateMilliseconds = 1000;
    if (endInferenceTime - lastPanelUpdate >= panelUpdateMilliseconds) {
      const averageInferenceTime = inferenceTimeSum / numInferences;
      inferenceTimeSum = 0;
      numInferences = 0;
      lastPanelUpdate = endInferenceTime;
    }
  }

  public renderResult = async () => {
    camera = await Camera.setupCamera({
      targetFPS: 60,
      sizeOption: "640 X 480",
    });
    if (camera.video.readyState < 2) {
      await new Promise((resolve) => {
        camera.video.onloadeddata = () => {
          resolve(video);
        };
      });
    }

    let poses = null;

    // Detector can be null if initialization failed (for example when loading
    // from a URL that does not exist).
    if (detector != null) {
      // FPS only counts the time it takes to finish estimatePoses.
      this.beginEstimatePosesStats();

      // Detectors can throw errors, for example when using custom URLs that
      // contain a model that doesn't provide the expected output.
      try {
        poses = await detector.estimatePoses(camera.video, {
          maxPoses: 1,
          flipHorizontal: false,
        });
      } catch (error) {
        detector.dispose();
        detector = null;
        alert(error);
      }

      this.endEstimatePosesStats();
    }

    camera.drawCtx();

    // The null check makes sure the UI is not in the middle of changing to a
    // different model. If during model change, the result is from an old model,
    // which shouldn't be rendered.
    if (poses && poses.length > 0) {
      camera.drawResults(poses);
    }
  };

  public renderPrediction = async () => {
    window.cancelAnimationFrame(rafId);

    if (detector != null) {
      detector.dispose();
    }

    try {
      detector = await this.createPosesDetector();
    } catch (error) {
      detector = null;
      alert(error);
    }

    await this.renderResult();

    rafId = requestAnimationFrame(this.renderPrediction);
  };
}

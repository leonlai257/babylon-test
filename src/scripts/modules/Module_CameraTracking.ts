import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

const VIDEO_SIZE = {
    '640 X 480': { width: 640, height: 480 },
    '1280 X 720': { width: 1280, height: 720 },
};

const BLAZEPOSE_CONFIG = {
    maxPoses: 1,
    type: 'full',
    scoreThreshold: 0.65,
    render3D: true,
};

const ANCHOR_POINTS = [
    [0, 0, 0],
    [0, 1, 0],
    [-1, 0, 0],
    [-1, -1, 0],
];

let detector: poseDetection.PoseDetector;
let camera: TrackingCamera;
let rafId: number;

export class TrackingCamera {
    video: HTMLVideoElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    constructor() {
        this.video = document.getElementById('video') as HTMLVideoElement;
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    }

    async setupCamera({ targetFPS, sizeOption }: {
        targetFPS: number;
        sizeOption: '640 X 480' | '1280 X 720';
    }) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error(
                'Browser API navigator.mediaDevices.getUserMedia not available'
            );
        }

        const $size = VIDEO_SIZE[sizeOption];
        const videoConfig = {
            audio: false,
            video: {
                facingMode: 'user',
                width: $size.width,
                height: $size.height,
                frameRate: {
                    ideal: targetFPS,
                },
            },
        };

        const stream = await navigator.mediaDevices.getUserMedia(videoConfig);

        const camera = new TrackingCamera();
        camera.video.srcObject = stream;

        await new Promise((resolve) => {
            camera.video.onloadedmetadata = () => {
                resolve(this.video);
            };
        });

        camera.video.play();

        const videoWidth = camera.video.videoWidth;
        const videoHeight = camera.video.videoHeight;
        // Must set below two lines, otherwise video element doesn't show. ([0x0] error)
        camera.video.width = videoWidth;
        camera.video.height = videoHeight;

        camera.canvas.width = videoWidth;
        camera.canvas.height = videoHeight;
        const canvasContainer = document.querySelector('.canvas-wrapper') as HTMLElement;
        canvasContainer.style.width = `${videoWidth}px`;
        canvasContainer.style.height = `${videoHeight}px`;

        return camera;
    }
}

async function checkGuiUpdate() {
    const tracking = new TrackingCamera()
    camera = await tracking.setupCamera({ targetFPS: 60, sizeOption: '640 X 480'})

    window.cancelAnimationFrame(rafId);

    if (detector != null) {
        detector.dispose();
    }

    try {
        detector = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, { runtime: 'tfjs', enableSmoothing: true, modelType: 'lite' });
    } catch (error) {
        detector = null;
        alert(error);
    }
}

async function renderPrediction() {
    await checkGuiUpdate();

    rafId = requestAnimationFrame(renderPrediction);

    const poses = await detector.estimatePoses(camera.video, {flipHorizontal: true});
    console.log(poses)
};

export { renderPrediction }
import type { FaceMesh } from '@mediapipe/face_mesh';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import type { VRMManager } from 'babylon-vrm-loader';
import * as Kalidokit from 'kalidokit';
import { ResolveRigger } from './Module_ResolveRigger';
import { calcEyes } from './Module_EyeOpenCalculate';
import { loadVRM } from './Module_VRMController';

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

let poseDetector: poseDetection.PoseDetector;
let poses: poseDetection.Pose[] = [];

let faceDetector: faceLandmarksDetection.FaceLandmarksDetector;
let faces: faceLandmarksDetection.Face[] = [];

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

    async setupCamera({
        targetFPS,
        sizeOption,
    }: {
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
        const canvasContainer = document.querySelector(
            '.canvas-wrapper'
        ) as HTMLElement;
        canvasContainer.style.width = `${videoWidth}px`;
        canvasContainer.style.height = `${videoHeight}px`;

        return camera;
    }
}

async function posePrediction() {
    const tracking = new TrackingCamera();
    camera = await tracking.setupCamera({
        targetFPS: 60,
        sizeOption: '640 X 480',
    });

    window.cancelAnimationFrame(rafId);

    if (poseDetector != null) {
        poseDetector.dispose();
    }

    try {
        poseDetector = await poseDetection.createDetector(
            poseDetection.SupportedModels.BlazePose,
            { runtime: 'tfjs', enableSmoothing: true, modelType: 'lite' }
        );
    } catch (error) {
        poseDetector = null;
        alert(error);
    }

    rafId = requestAnimationFrame(posePrediction);

    poses = await poseDetector.estimatePoses(camera.video, {
        flipHorizontal: true,
    });
}

async function facePrediction() {
    const tracking = new TrackingCamera();
    const control = new PredictionController();

    camera = await tracking.setupCamera({
        targetFPS: 60,
        sizeOption: '640 X 480',
    });

    window.cancelAnimationFrame(rafId);

    if (faceDetector != null) {
        faceDetector.dispose();
    }

    try {
        faceDetector = await faceLandmarksDetection.createDetector(
            faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
            { runtime: 'tfjs' }
        );
    } catch (error) {
        faceDetector = null;
        alert(error);
    }

    rafId = requestAnimationFrame(facePrediction);

    faces = await faceDetector.estimateFaces(camera.video, {
        flipHorizontal: true,
    });

    if (faces) {
        await control.rigFace();
    }
}
class PredictionController {
    vrmManager;
    resolveRigger: ResolveRigger;
    videoElement: HTMLVideoElement;
    constructor() {
        // this.vrmManager = loadVRM('/src/assets/', 'test.vrm');
        this.resolveRigger = new ResolveRigger();
        this.videoElement = document.getElementById(
            'video'
        ) as HTMLVideoElement;
    }

    async rigFace() {
        if (!this.vrmManager) {
            this.vrmManager = await loadVRM('/src/assets/', 'test.vrm');
        }
        if (faces[0] && faces[0].keypoints) {
            let faceLandmarks = faces[0].keypoints;
            let faceRig, eyesRig;
            if (faceLandmarks) {
                faceRig = Kalidokit.Face.solve(faceLandmarks, {
                    runtime: 'tfjs',
                    video: this.videoElement,
                }) as Kalidokit.TFace;

                eyesRig = calcEyes(faceLandmarks, { high: 1, low: 0.8 }); // could test around low being 0.75 to 0.85

                this.vrmManager.morphing('Blink_L', 1.0 - eyesRig.l);
                this.vrmManager.morphing('Blink_R', 1.0 - eyesRig.r);

                /* Loop through faceRig.mouth.shape to find the highest value, then use that key to morph the VRM facial expression */
                const vowelList: string[] = Object.keys(faceRig.mouth.shape);
                let vowel = { shape: 'A', degree: 0 };
                for (let i in vowelList) {
                    if (
                        faceRig.mouth.shape[
                            vowelList[i] as 'A' | 'E' | 'I' | 'O' | 'U'
                        ] > vowel.degree
                    ) {
                        vowel.shape = vowelList[i];
                        vowel.degree =
                            faceRig.mouth.shape[
                                vowelList[i] as 'A' | 'E' | 'I' | 'O' | 'U'
                            ];
                    }
                }
                this.vrmManager.morphing(vowel.shape, vowel.degree);
                this.resolveRigger.rigFace(
                    this.vrmManager,
                    faceRig as Kalidokit.TFace
                );
            }
        }
    }
}

export { posePrediction, facePrediction };

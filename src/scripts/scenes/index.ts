import {
    Engine,
    Scene,
    FreeCamera,
    Vector3,
    MeshBuilder,
    StandardMaterial,
    Color3,
    HemisphericLight,
    SceneLoader,
} from '@babylonjs/core';

import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@mediapipe/pose';
import '@tensorflow/tfjs-backend-webgl';
// import { Camera } from "../modules/Module_camera";

import 'babylon-vrm-loader';
import * as Kalidokit from 'kalidokit';
import { Holistic } from '@mediapipe/holistic';
import { Camera } from '@mediapipe/camera_utils';

let detector, camera, stats;
let startInferenceTime,
    numInferences = 0;
let inferenceTimeSum = 0,
    lastPanelUpdate = 0;
let rafId;

const loadVRM = async (rootUrl, fileName) => {
    const result = await SceneLoader.AppendAsync(rootUrl, fileName);

    const vrmManager = result.metadata.vrmManagers[0];
    // scene.onBeforeRenderObservable.add(() => {
    //   vrmManager.update(scene.getEngine().getDeltaTime());
    // });

    // vrmManager.rootMesh.addRotation(0, -Math.PI/2, 0);

    // // Work with BlendShape(MorphTarget)
    // vrmManager.morphing("Joy", 1.0);
    console.dir(result);
    return result;
};

const createDetector = async () => {
    const model = poseDetection.SupportedModels.BlazePose;
    const detectorConfig = {
        runtime: 'tfjs',
        enableSmoothing: true,
        modelType: 'full',
    };

    return poseDetection.createDetector(model, detectorConfig);
};

function beginEstimatePosesStats() {
    startInferenceTime = (performance || Date).now();
}

function endEstimatePosesStats() {
    const endInferenceTime = (performance || Date).now();
    inferenceTimeSum += endInferenceTime - startInferenceTime;
    ++numInferences;

    const panelUpdateMilliseconds = 1000;
    if (endInferenceTime - lastPanelUpdate >= panelUpdateMilliseconds) {
        const averageInferenceTime = inferenceTimeSum / numInferences;
        inferenceTimeSum = 0;
        numInferences = 0;
        // stats.customFpsPanel.update(
        //   1000.0 / averageInferenceTime,
        //   120 /* maxValue */
        // );
        lastPanelUpdate = endInferenceTime;
    }
}

async function renderResult() {
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
        beginEstimatePosesStats();

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

        endEstimatePosesStats();
    }

    camera.drawCtx();

    // The null check makes sure the UI is not in the middle of changing to a
    // different model. If during model change, the result is from an old model,
    // which shouldn't be rendered.
    if (poses && poses.length > 0) {
        camera.drawResults(poses);
    }
}

async function renderPrediction() {
    window.cancelAnimationFrame(rafId);

    if (detector != null) {
        detector.dispose();
    }

    try {
        detector = await createDetector();
    } catch (error) {
        detector = null;
        alert(error);
    }

    await renderResult();

    rafId = requestAnimationFrame(renderPrediction);
}

const createScene = async (canvas: any) => {
    const engine = new Engine(canvas);
    const scene = new Scene(engine);

    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');
    const canvasCtx = canvasElement.getContext('2d');

    const vrm = await loadVRM('/src/assets/', 'test.vrm');
    const vrmManager = vrm.metadata.vrmManagers[0];

    let holistic = new Holistic({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.4.1633559476/${file}`;
        },
    });

    holistic.onResults((results) => {
        // do something with prediction results
        // landmark names may change depending on TFJS/Mediapipe model version
        let facelm = results.faceLandmarks;
        // let poselm = results.poseLandmarks;
        // let poselm3d = results.ea;
        let rightHandlm = results.rightHandLandmarks;
        let leftHandlm = results.leftHandLandmarks;

        let faceRig, poseRig, rightHandRig, leftHandRig;

        if (facelm) {
            faceRig = Kalidokit.Face.solve(facelm, {
                runtime: 'mediapipe',
                video: videoElement,
            });
            console.log(vrmManager.humanoidBone.head);
            vrmManager.humanoidBone.head.position.x = faceRig.head.normalized.y;
            vrmManager.humanoidBone.head.position.y = faceRig.head.normalized.x;
            vrmManager.humanoidBone.head.position.z = faceRig.head.normalized.z;
        }
        // if (poselm && poselm3d) {
        //   poseRig = Kalidokit.Pose.solve(poselm3d,poselm,{runtime:'mediapipe',video: videoElement})
        // }
        if (rightHandlm) {
            rightHandRig = Kalidokit.Hand.solve(rightHandlm, 'Right');
            console.log(rightHandRig);
            console.log(vrmManager.humanoidBone);
        }
        if (leftHandlm) {
            leftHandRig = Kalidokit.Hand.solve(leftHandlm, 'Left');
        }
    });

    // use Mediapipe's webcam utils to send video to holistic every frame
    const trackingCamera = new Camera(videoElement, {
        onFrame: async () => {
            await holistic.send({ image: videoElement });
        },
        width: 640,
        height: 480,
    });
    trackingCamera.start();

    //   camera = await Camera.setupCamera({ targetFPS: 60, sizeOption: "640 X 480" });

    //   detector = await createDetector();

    //   renderPrediction();

    engine.runRenderLoop(() => {
        scene.render();
    });
};

export { createScene };

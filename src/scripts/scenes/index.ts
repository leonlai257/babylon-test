import {
    ArcRotateCamera,
    Engine,
    PointLight,
    Quaternion,
    Scene,
    SceneLoader,
    Vector3,
} from '@babylonjs/core';

import '@mediapipe/pose';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

import { Camera } from '@mediapipe/camera_utils';
import { Holistic } from '@mediapipe/holistic';
import 'babylon-vrm-loader';
import * as Kalidokit from 'kalidokit';
import type { VRMManager } from 'babylon-vrm-loader';
import { Pose } from '@mediapipe/pose';
import { ResolveRigger } from '../modules/Module_ResolveLandmarks';

// import { TrackingCamera } from '../modules/Module_CameraTracking';

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

    vrmManager.rootMesh.addRotation(0, Math.PI, 0);

    // // Work with BlendShape(MorphTarget)
    // vrmManager.morphing("Joy", 1.0);
    console.dir(result);
    return result;
};

const createScene = async (canvas: any) => {
    const engine = new Engine(canvas);
    const scene = new Scene(engine);

    const arcCamera = new ArcRotateCamera(
        'camera',
        Math.PI / 2,
        Math.PI / 2,
        2,
        new Vector3(0, 1, 1),
        scene
    );
    scene.addCamera(arcCamera);

    const light = new PointLight('pointLight', new Vector3(1, 10, 1), scene);

    const videoElement: HTMLVideoElement = document.getElementById(
        'video'
    ) as HTMLVideoElement;
    const canvasElement = document.getElementById(
        'canvas'
    ) as HTMLCanvasElement;
    const canvasCtx = canvasElement.getContext('2d');

    const vrm = await loadVRM('/src/assets/', 'test.vrm');
    const vrmManager: VRMManager = vrm.metadata.vrmManagers[0];

    const resolveRigger = new ResolveRigger();

    const pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
    });
    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
    });

    pose.onResults((results) => {
        let poselm = results.poseLandmarks;
        let poselm3d = results.poseWorldLandmarks;
        let poseRig;

        if (poselm && poselm3d) {
            poseRig = Kalidokit.Pose.solve(poselm3d, poselm, {
                runtime: 'mediapipe',
                video: videoElement,
            });
            resolveRigger.rigPose(vrmManager, poseRig as Kalidokit.TPose);
        }
    });

    let holistic = new Holistic({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.4.1633559476/${file}`;
        },
    });

    holistic.onResults((results) => {
        let faceLandmarks = results.faceLandmarks;

        let rightHandLandmarks = results.rightHandLandmarks;
        let leftHandLandmarks = results.leftHandLandmarks;

        let faceRig, rightHandRig, leftHandRig;

        if (faceLandmarks) {
            faceRig = Kalidokit.Face.solve(faceLandmarks, {
                runtime: 'mediapipe',
                video: videoElement,
            });
            // eyes = Kalidokit.Face.stabilizeBlink(
            //     { r: faceRig?.eye.r as number, l: faceRig?.eye.l as number }, // left and right eye blendshape values
            //     vrmManager.humanoidBone.head.rotation.y, // head rotation in radians
            //     {
            //         enableWink: true, // disables winking
            //         maxRot: 0.5, // max head rotation in radians before interpolating obscured eyes
            //     }
            // );
            // console.log(eyes);
            // console.log(vrmManager.humanoidBone);
            // console.log(faceRig);

            // console.log(faceRig.eye.l, faceRig.eye.r);

            // vrmManager.morphing('Blink_L', faceRig.eye.l);
            // vrmManager.morphing('Blink_R', faceRig.eye.r);

            /* Loop through faceRig.mouth.shape to find the highest value, then use that key to morph the VRM facial expression */
            const vowelList = Object.keys(faceRig.mouth.shape);
            let vowel = { shape: 'A', degree: 0 };
            for (let i in Object.keys(faceRig.mouth.shape)) {
                if (faceRig.mouth.shape[vowelList[i]] > vowel.degree) {
                    vowel.shape = vowelList[i];
                    vowel.degree = faceRig.mouth.shape[vowelList[i]];
                }
            }
            vrmManager.morphing(vowel.shape, vowel.degree);
            resolveRigger.rigFace(vrmManager, faceRig as Kalidokit.TFace);
        }

        if (leftHandLandmarks) {
            rightHandRig = Kalidokit.Hand.solve(leftHandLandmarks, 'Right');
            resolveRigger.rigRightHand(
                vrmManager,
                rightHandRig as Kalidokit.THand<Kalidokit.Side>
            );
        }
        if (rightHandLandmarks) {
            leftHandRig = Kalidokit.Hand.solve(rightHandLandmarks, 'Left');
            resolveRigger.rigLeftHand(
                vrmManager,
                leftHandRig as Kalidokit.THand<Kalidokit.Side>
            );
        }
    });

    // use Mediapipe's webcam utils to send video to holistic every frame
    const trackingCamera = new Camera(videoElement, {
        onFrame: async () => {
            await holistic.send({ image: videoElement });
            await pose.send({ image: videoElement });
        },
        width: 640,
        height: 480,
    });
    trackingCamera.start();

    // camera = await TrackingCamera.setupCamera({
    //     targetFPS: 60,
    //     sizeOption: '640 X 480',
    // });

    // detector = await createDetector();

    // renderPrediction();

    engine.runRenderLoop(() => {
        scene.render();
    });
};

export { createScene };

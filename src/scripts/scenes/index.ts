import {
    ArcRotateCamera,
    Engine,
    PointLight, Scene,
    SceneLoader,
    Vector3
} from '@babylonjs/core';

import '@mediapipe/pose';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

import { Camera } from '@mediapipe/camera_utils';
import { Holistic } from '@mediapipe/holistic';
import { Pose } from '@mediapipe/pose';
import 'babylon-vrm-loader';
import type { VRMManager } from 'babylon-vrm-loader';
import * as Kalidokit from 'kalidokit';
import { ResolveRigger } from '../modules/Module_ResolveLandmarks';
import { calcEyes } from '../modules/Module_EyeOpenCalculate';
import createWalkAnimationGroup from '../modules/Module_WalkAnimation';


const loadVRM = async (rootUrl, fileName) => {
    const result = await SceneLoader.AppendAsync(rootUrl, fileName);
    const vrmManager = result.metadata.vrmManagers[0];
    vrmManager.rootMesh.addRotation(0, Math.PI, 0);
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

    const walkAnimation = createWalkAnimationGroup(vrmManager, scene);

    // const model = poseDetection.SupportedModels.BlazePose;
    // const detector = await poseDetection.createDetector(model, {
    //     runtime: 'mediapipe',
    //     modelType: 'full'
    // });
    // const poses = detector.estimatePoses(videoElement);
    // console.log(poses)

    // detector = await createDetector();

    // renderPrediction();

    walkAnimation.start(true, 1, 0, 60);

    const pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
    });
    pose.setOptions({
        modelComplexity: 2,
        smoothLandmarks: true,
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

        let faceRig, eyesRig, rightHandRig, leftHandRig;

        if (faceLandmarks) {
            faceRig = Kalidokit.Face.solve(faceLandmarks, {
                runtime: 'mediapipe',
                video: videoElement,
                smoothBlink: true,
                blinkSettings: [0.25, 75],
            }) as Kalidokit.TFace;

            eyesRig = calcEyes(faceLandmarks, { high: 1 , low: 0.8}); // could test around low being 0.75 to 0.85

            vrmManager.morphing('Blink_L', 1.0 - eyesRig.l);
            vrmManager.morphing('Blink_R', 1.0 - eyesRig.r);

            /* Loop through faceRig.mouth.shape to find the highest value, then use that key to morph the VRM facial expression */
            const vowelList = Object.keys(faceRig.mouth.shape);
            let vowel = { shape: 'A', degree: 0 };
            for (let i in vowelList) {
                if (faceRig.mouth.shape[vowelList[i]] > vowel.degree) {
                    vowel.shape = vowelList[i];
                    vowel.degree = faceRig.mouth.shape[vowelList[i]];
                }
            }
            vrmManager.morphing(vowel.shape, vowel.degree);
            resolveRigger.rigFace(vrmManager, faceRig as Kalidokit.TFace);
        }

        // right hand landmarks are mirrored
        if (leftHandLandmarks) {
            rightHandRig = Kalidokit.Hand.solve(leftHandLandmarks, 'Right');
            resolveRigger.rigRightHand(
                vrmManager,
                rightHandRig as Kalidokit.THand<Kalidokit.Side>
            );
        }

        // left hand landmarks are mirrored
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



    engine.runRenderLoop(() => {
        scene.render();
    });
};

export { createScene };

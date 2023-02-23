import {
    ArcRotateCamera,
    Engine,
    PointLight,
    Quaternion,
    Scene,
    SceneLoader,
    KeyboardEventTypes,
    Vector3,
} from '@babylonjs/core';

import '@mediapipe/pose';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

import { Camera } from '@mediapipe/camera_utils';
import { Holistic } from '@mediapipe/holistic';
import { Pose } from '@mediapipe/pose';
import { FaceMesh } from '@mediapipe/face_mesh';
import 'babylon-vrm-loader';
import * as Kalidokit from 'kalidokit';
import { ResolveRigger } from '../modules/Module_ResolveRigger';
import { calcEyes } from '../modules/Module_EyeOpenCalculate';
import { loadVRM } from '../modules/Module_VRMController';
import createWalkAnimationGroup from '../modules/Module_WalkAnimation';
import {
    posePrediction,
    facePrediction,
} from '../modules/Module_CameraTracking';

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

    const videoElement: HTMLVideoElement = document.getElementById(
        'video'
    ) as HTMLVideoElement;

    const light = new PointLight('pointLight', new Vector3(1, 10, 1), scene);

    const vrmManager = await loadVRM('/src/assets/', 'test.vrm');

    const resolveRigger = new ResolveRigger();

    // await posePrediction();
    // await facePrediction();

    const rigAnimationFrame = 15;
    const transformAnimationFrame = 120;

    const walkAnimationRig = createWalkAnimationGroup(
        vrmManager,
        scene,
        'rig',
        rigAnimationFrame
    );

    const step = -0.01;
    const rotationStep = 0.05;
    let toggleWalk = true;
    let previousQuaternion: Quaternion | undefined = undefined;
    let targetQuaternion: Quaternion | undefined = undefined;

    scene.onKeyboardObservable.add((keyInput) => {
        switch (keyInput.type) {
            case KeyboardEventTypes.KEYDOWN:
                console.log('KEY DOWN: ', keyInput.event.key);
                if (keyInput.event.key === 'k' || keyInput.event.key === 'K') {
                    toggleWalk = !toggleWalk;
                }
                break;
            case KeyboardEventTypes.KEYUP:
                console.log('KEY UP: ', keyInput.event.code);
                break;
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        if (toggleWalk) {
            walkAnimationRig.start(true, 1, 0, rigAnimationFrame * 4);

            if (previousQuaternion) {
                targetQuaternion = previousQuaternion;
                previousQuaternion = undefined;
            }

            if (!targetQuaternion) {
                vrmManager.rootMesh.movePOV(0, 0, step);
                vrmManager.rootMesh.addRotation(0, Math.PI / 180, 0);
            }
        } else {
            if (!previousQuaternion) {
                previousQuaternion = vrmManager.rootMesh.rotationQuaternion;
                targetQuaternion = new Quaternion(0, 0, 0, 1);
            }
        }

        if (targetQuaternion) {
            vrmManager.rootMesh.rotationQuaternion = Quaternion.Slerp(
                vrmManager.rootMesh.rotationQuaternion,
                targetQuaternion as Quaternion,
                rotationStep
            );

            if (
                Math.abs(
                    vrmManager.rootMesh.rotationQuaternion!.y -
                        targetQuaternion.y
                ) < 0.05
            ) {
                targetQuaternion = undefined;
                walkAnimationRig.stop();
            }
        }
    });

    // const walkAnimationTransform = createWalkAnimationGroup(
    //     vrmManager,
    //     scene,
    //     'transform',
    //     transformAnimationFrame
    // );
    // walkAnimationTransform.start(true, 1, 0, transformAnimationFrame * 4);

    const mediaPipeConfig = {
        selfieMode: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
    };

    const pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
    });
    pose.setOptions({
        modelComplexity: 2,
        smoothLandmarks: true,
        ...mediaPipeConfig,
    });

    pose.onResults((results) => {
        let poseLandmarks = results.poseLandmarks;
        let poseLandmarks3d = results.poseWorldLandmarks;
        let poseRig;

        if (poseLandmarks && poseLandmarks3d) {
            poseRig = Kalidokit.Pose.solve(poseLandmarks3d, poseLandmarks, {
                runtime: 'mediapipe',
                video: videoElement,
            });
            resolveRigger.rigPose(vrmManager, poseRig as Kalidokit.TPose);
        }
    });

    const faceMesh = new FaceMesh({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
    });

    faceMesh.setOptions({
        enableFaceGeometry: false,
        maxNumFaces: 1,
        ...mediaPipeConfig,
    });

    faceMesh.onResults((results) => {
        let faceLandmarks = results.multiFaceLandmarks[0];
        let faceRig, eyesRig;
        if (faceLandmarks) {
            faceRig = Kalidokit.Face.solve(faceLandmarks, {
                runtime: 'mediapipe',
                video: videoElement,
            }) as Kalidokit.TFace;

            eyesRig = calcEyes(faceLandmarks, { high: 1, low: 0.8 }); // could test around low being 0.75 to 0.85

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
    });

    // let holistic = new Holistic({
    //     locateFile: (file) => {
    //         return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.4.1633559476/${file}`;
    //     },
    // });

    // holistic.onResults((results) => {
    //     let faceLandmarks = results.faceLandmarks;
    //     let rightHandLandmarks = results.rightHandLandmarks;
    //     let leftHandLandmarks = results.leftHandLandmarks;

    //     let faceRig, eyesRig, rightHandRig, leftHandRig;

    //     if (faceLandmarks) {
    //         faceRig = Kalidokit.Face.solve(faceLandmarks, {
    //             runtime: 'mediapipe',
    //             video: videoElement,
    //         }) as Kalidokit.TFace;

    //         eyesRig = calcEyes(faceLandmarks, { high: 1, low: 0.8 }); // could test around low being 0.75 to 0.85

    //         vrmManager.morphing('Blink_L', 1.0 - eyesRig.l);
    //         vrmManager.morphing('Blink_R', 1.0 - eyesRig.r);

    //         /* Loop through faceRig.mouth.shape to find the highest value, then use that key to morph the VRM facial expression */
    //         const vowelList = Object.keys(faceRig.mouth.shape);
    //         let vowel = { shape: 'A', degree: 0 };
    //         for (let i in vowelList) {
    //             if (faceRig.mouth.shape[vowelList[i]] > vowel.degree) {
    //                 vowel.shape = vowelList[i];
    //                 vowel.degree = faceRig.mouth.shape[vowelList[i]];
    //             }
    //         }
    //         vrmManager.morphing(vowel.shape, vowel.degree);
    //         resolveRigger.rigFace(vrmManager, faceRig as Kalidokit.TFace);
    //     }

    //     // right hand landmarks are mirrored
    //     if (leftHandLandmarks) {
    //         rightHandRig = Kalidokit.Hand.solve(leftHandLandmarks, 'Right');
    //         resolveRigger.rigRightHand(
    //             vrmManager,
    //             rightHandRig as Kalidokit.THand<Kalidokit.Side>
    //         );
    //     }

    //     // left hand landmarks are mirrored
    //     if (rightHandLandmarks) {
    //         leftHandRig = Kalidokit.Hand.solve(rightHandLandmarks, 'Left');
    //         resolveRigger.rigLeftHand(
    //             vrmManager,
    //             leftHandRig as Kalidokit.THand<Kalidokit.Side>
    //         );
    //     }
    // });

    // use Mediapipe's webcam utils to send video to holistic every frame
    const trackingCamera = new Camera(videoElement, {
        onFrame: async () => {
            // await holistic.send({ image: videoElement });
            await pose.send({ image: videoElement });
            await faceMesh.send({ image: videoElement });
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

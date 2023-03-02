import { Nullable, Quaternion, Scene } from "@babylonjs/core";
import { Camera } from "@mediapipe/camera_utils";
import { Holistic } from "@mediapipe/holistic";
import { Pose } from "@mediapipe/pose";
import type { VRMManager } from "babylon-vrm-loader";
import * as Kalidokit from "kalidokit";
import { Module } from "../Module";
import { ModuleController } from "../ModuleController";
import { calcEyes, Vector } from "./Module_EyeOpenCalculate";
import createWalkAnimationGroup from "./Module_WalkAnimation";

class RigController extends Module {
  public rigController: Nullable<RigController>;
  private _vrmManager: VRMManager;
  private _scene: Scene;

  constructor(vrmManager: VRMManager, scene: Scene) {
    super();
    this._vrmManager = vrmManager;
  }

  public attach(controller: ModuleController): void {
    super.attach(controller);

    // let motionTrackingController = this.controller?.getModule(MotionTracking);
    // if (motionTrackingController) {
    //   this.onModuleAttached(motionTrackingController);
    // }
  }

  public onModuleAttached(module: Module): void {
    if (module instanceof RigController) {
      this.rigController = module;
      this.createLandmarksDetector(this._vrmManager);
      this.createWalkAnimation(this._vrmManager, this._scene);
    }
  }

  public onModuleDetached(module: Module): void {
    if (module === this.rigController) {
      this.rigController = null;
    }
  }

  private fromEuler(euler: Kalidokit.XYZ) {
    return Quaternion.FromEulerAngles(euler.x, euler.y, euler.z);
  }

  createLandmarksDetector(vrmManager: VRMManager) {
    const videoElement = document.createElement("video") as HTMLVideoElement;
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });
    pose.setOptions({
      modelComplexity: 2,
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
          runtime: "mediapipe",
          video: videoElement,
        });
        this.rigPose(vrmManager, poseRig);
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
          runtime: "mediapipe",
          video: videoElement,
        });

        eyesRig = calcEyes(faceLandmarks as Vector[], { high: 1, low: 0.8 }); // could test around low being 0.75 to 0.85

        vrmManager.morphing("Blink_L", 1.0 - eyesRig.l);
        vrmManager.morphing("Blink_R", 1.0 - eyesRig.r);

        /* Loop through faceRig.mouth.shape to find the highest value, then use that key to morph the VRM facial expression */
        const vowelList = Object.keys(faceRig.mouth.shape);
        let vowel = { shape: "A", degree: 0 };
        for (let i in vowelList) {
          if (faceRig.mouth.shape[vowelList[i]] > vowel.degree) {
            vowel.shape = vowelList[i];
            vowel.degree = faceRig.mouth.shape[vowelList[i]];
          }
        }
        vrmManager.morphing(vowel.shape, vowel.degree);
        this.rigFace(vrmManager, faceRig);
      }

      // right hand landmarks are mirrored
      if (leftHandLandmarks) {
        rightHandRig = Kalidokit.Hand.solve(leftHandLandmarks, "Right");
        this.rigRightHand(vrmManager, rightHandRig);
      }

      // left hand landmarks are mirrored
      if (rightHandLandmarks) {
        leftHandRig = Kalidokit.Hand.solve(rightHandLandmarks, "Left");
        this.rigLeftHand(vrmManager, leftHandRig);
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
  }

  rigFace(vrmManager: VRMManager, faceRig: Kalidokit.TFace) {
    vrmManager.humanoidBone.head.rotationQuaternion = this.fromEuler(
      faceRig.head
    );
  }

  rigPose(vrmManager: VRMManager, poseRig: Kalidokit.TPose) {
    // vrmManager.humanoidBone.spine.rotationQuaternion = this.fromEuler(
    //     poseRig.Spine
    // );
    vrmManager.humanoidBone.rightUpperArm.rotationQuaternion = this.fromEuler(
      poseRig.RightUpperArm
    );
    vrmManager.humanoidBone.rightLowerArm.rotationQuaternion = this.fromEuler(
      poseRig.RightLowerArm
    );
    vrmManager.humanoidBone.leftUpperArm.rotationQuaternion = this.fromEuler(
      poseRig.LeftUpperArm
    );
    vrmManager.humanoidBone.leftLowerArm.rotationQuaternion = this.fromEuler(
      poseRig.LeftLowerArm
    );
  }

  rigRightHand(
    vrmManager: VRMManager,
    rightHandRig: Kalidokit.THand<Kalidokit.Side>
  ) {
    // vrmManager.humanoidBone.rightHand.rotationQuaternion = this.fromEuler(
    //     rightHandRig.RightWrist
    // );
    vrmManager.humanoidBone.rightRingProximal!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightRingProximal);
    vrmManager.humanoidBone.rightRingIntermediate!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightRingIntermediate);
    vrmManager.humanoidBone.rightRingDistal!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightRingDistal);
    vrmManager.humanoidBone.rightIndexProximal!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightIndexProximal);
    vrmManager.humanoidBone.rightIndexIntermediate!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightIndexIntermediate);
    vrmManager.humanoidBone.rightIndexDistal!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightIndexDistal);
    vrmManager.humanoidBone.rightMiddleProximal!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightMiddleProximal);
    vrmManager.humanoidBone.rightMiddleIntermediate!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightMiddleIntermediate);
    vrmManager.humanoidBone.rightMiddleDistal!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightMiddleDistal);
    vrmManager.humanoidBone.rightThumbProximal!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightThumbProximal);
    vrmManager.humanoidBone.rightThumbIntermediate!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightThumbIntermediate);
    vrmManager.humanoidBone.rightThumbDistal!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightThumbDistal);
    vrmManager.humanoidBone.rightLittleProximal!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightLittleProximal);
    vrmManager.humanoidBone.rightLittleIntermediate!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightLittleIntermediate);
    vrmManager.humanoidBone.rightLittleDistal!.rotationQuaternion =
      this.fromEuler(rightHandRig.RightLittleDistal);
  }

  rigLeftHand(
    vrmManager: VRMManager,
    leftHandRig: Kalidokit.THand<Kalidokit.Side>
  ) {
    // Do the same as right hand
    // vrmManager.humanoidBone.leftHand.rotationQuaternion = this.fromEuler(
    //     leftHandRig.LeftWrist
    // );
    vrmManager.humanoidBone.leftRingProximal!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftRingProximal);
    vrmManager.humanoidBone.leftRingIntermediate!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftRingIntermediate);
    vrmManager.humanoidBone.leftRingDistal!.rotationQuaternion = this.fromEuler(
      leftHandRig.LeftRingDistal
    );
    vrmManager.humanoidBone.leftIndexProximal!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftIndexProximal);
    vrmManager.humanoidBone.leftIndexIntermediate!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftIndexIntermediate);
    vrmManager.humanoidBone.leftIndexDistal!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftIndexDistal);
    vrmManager.humanoidBone.leftMiddleProximal!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftMiddleProximal);
    vrmManager.humanoidBone.leftMiddleIntermediate!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftMiddleIntermediate);
    vrmManager.humanoidBone.leftMiddleDistal!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftMiddleDistal);
    vrmManager.humanoidBone.leftThumbProximal!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftThumbProximal);
    vrmManager.humanoidBone.leftThumbIntermediate!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftThumbIntermediate);
    vrmManager.humanoidBone.leftThumbDistal!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftThumbDistal);
    vrmManager.humanoidBone.leftLittleProximal!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftLittleProximal);
    vrmManager.humanoidBone.leftLittleIntermediate!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftLittleIntermediate);
    vrmManager.humanoidBone.leftLittleDistal!.rotationQuaternion =
      this.fromEuler(leftHandRig.LeftLittleDistal);
  }

  createWalkAnimation(vrmManager: VRMManager, scene: Scene) {
    const rigAnimationFrame = 15;
    const transformAnimationFrame = 240;

    const walkAnimationRig = createWalkAnimationGroup(
      vrmManager,
      scene,
      "rig",
      rigAnimationFrame
    );
    const walkAnimationTransform = createWalkAnimationGroup(
      vrmManager,
      scene,
      "transform",
      transformAnimationFrame
    );
    walkAnimationRig.start(true, 1, 0, rigAnimationFrame * 4);
    walkAnimationTransform.start(true, 1, 0, transformAnimationFrame * 4);
  }
}

export { RigController };

import { Quaternion } from '@babylonjs/core';
import type { VRMManager } from 'babylon-vrm-loader';
import type * as Kalidokit from 'kalidokit';

export class ResolveRigger {
    fromEuler(euler: Kalidokit.XYZ) {
        return Quaternion.FromEulerAngles(euler.x, euler.y, euler.z);
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
        vrmManager.humanoidBone.rightUpperArm.rotationQuaternion =
            this.fromEuler(poseRig.RightUpperArm);
        vrmManager.humanoidBone.rightLowerArm.rotationQuaternion =
            this.fromEuler(poseRig.RightLowerArm);
        vrmManager.humanoidBone.leftUpperArm.rotationQuaternion =
            this.fromEuler(poseRig.LeftUpperArm);
        vrmManager.humanoidBone.leftLowerArm.rotationQuaternion =
            this.fromEuler(poseRig.LeftLowerArm);
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
        vrmManager.humanoidBone.leftRingDistal!.rotationQuaternion =
            this.fromEuler(leftHandRig.LeftRingDistal);
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
}

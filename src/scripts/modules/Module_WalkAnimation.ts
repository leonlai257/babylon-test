import * as BABYLON from "@babylonjs/core";

function createAnimation(animation: any): BABYLON.Animation {
    const anim = new BABYLON.Animation(
        animation.name,
        'rotationQuaternion',
        60, // fps
        BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE,
    );
    const keys = [];
    for (const key of animation.keys) {
        keys.push({
            frame: key[0],
            value: BABYLON.Quaternion.RotationYawPitchRoll(key[1], key[2], key[3]),
        });
    }
    anim.setKeys(keys);

    return anim;
}

function createWalkAnimationGroup(vrmManager: any, scene: BABYLON.Scene): BABYLON.AnimationGroup {
    const leftUpperLegAnim = {
        name: 'leftUpperLegAnim',
        keys: [
            [0, 0, 0, 0],
            [15, 0, Math.PI / 10, 0],
            [45, 0, -Math.PI / 15, 0],
            [60, 0, 0, 0],
        ],
    };

    const rightUpperLegAnim = {
        name: 'rightUpperLegAnim',
        keys: [
            [0, 0, 0, 0],
            [15, 0, -Math.PI / 10, 0],
            [45, 0, Math.PI / 15, 0],
            [60, 0, 0, 0],
        ],
    };

    // const leftUpperArmAnim = {
    //     name: 'leftUpperArmAnim',
    //     keys: [
    //         [0, 0, 0, Math.PI / 2.5],
    //         [15, 0, -Math.PI / 6, Math.PI / 2.5],
    //         [45, 0, Math.PI / 4, Math.PI / 2.5],
    //         [60, 0, 0, Math.PI / 2.5],
    //     ],
    // };

    // const rightUpperArmAnim = {
    //     name: 'rightUpperArmAnim',
    //     keys: [
    //         [0, 0, 0, -Math.PI / 2.5],
    //         [15, 0, Math.PI / 4, -Math.PI / 2.5],
    //         [45, 0, -Math.PI / 6, -Math.PI / 2.5],
    //         [60, 0, 0, -Math.PI / 2.5],
    //     ],
    // };
    const animationGroup = new BABYLON.AnimationGroup('Walk', scene);
    animationGroup.loopAnimation = true;
    animationGroup.addTargetedAnimation(
        createAnimation(leftUpperLegAnim),
        vrmManager.humanoidBone.leftUpperLeg,
    );
    animationGroup.addTargetedAnimation(
        createAnimation(rightUpperLegAnim),
        vrmManager.humanoidBone.rightUpperLeg,
    );
    // animationGroup.addTargetedAnimation(
    //     createAnimation(leftUpperArmAnim),
    //     vrmManager.humanoidBone.leftUpperArm,
    // );
    // animationGroup.addTargetedAnimation(
    //     createAnimation(rightUpperArmAnim),
    //     vrmManager.humanoidBone.rightUpperArm,
    // );
    return animationGroup;
}

export default createWalkAnimationGroup;
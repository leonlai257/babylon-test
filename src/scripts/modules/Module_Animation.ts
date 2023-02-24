import * as BABYLON from '@babylonjs/core';

function createRigAnimation(animation: {
    name: string;
    keys: number[][];
}): BABYLON.Animation {
    const anim = new BABYLON.Animation(
        animation.name,
        'rotationQuaternion',
        60, // fps
        BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const keys = [];
    for (const key of animation.keys) {
        keys.push({
            frame: key[0],
            value: BABYLON.Quaternion.RotationYawPitchRoll(
                key[1],
                key[2],
                key[3]
            ),
        });
    }
    anim.setKeys(keys);

    return anim;
}

function createTransformAnimation(animation: {
    name: string;
    keys: number[][];
}): BABYLON.Animation {
    const anim = new BABYLON.Animation(
        animation.name,
        'position',
        60, // fps
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    const keys = [];
    for (const key of animation.keys) {
        keys.push({
            frame: key[0],
            value: new BABYLON.Vector3(key[1], key[2], key[3]),
        });
    }
    anim.setKeys(keys);

    return anim;
}

// function moveInCircle(step: number, angle: number) {
//     const
// }

function createAnimationGroup(
    vrmManager: any,
    scene: BABYLON.Scene,
    name: 'rig' | 'transform',
    frame: number
): BABYLON.AnimationGroup {
    const walkTransformAnim = {
        name: 'WalkTransform',
        keys: [
            [0, 0, 0, 0],
            [frame, -1, 0, 0],
            [frame * 2, 0, 0, 0],
            [frame * 3, 1, 0, 0],
            [frame * 4, 0, 0, 0],
        ],
    };

    const walkRotateAnim = {
        name: 'WalkRotate',
        keys: [
            [0, -Math.PI / 10, 0, 0],
            [(frame * 1) / 4, -Math.PI / 10, 0, 0],
            [(frame * 3) / 4, -Math.PI / 10, 0, 0],
            [frame, 0, 0, 0],
            [(frame * 5) / 4, Math.PI / 10, 0, 0],
            [(frame * 11) / 4, Math.PI / 10, 0, 0],
            [frame * 3, 0, 0, 0],
            [(frame * 13) / 4, -Math.PI / 10, 0, 0],
            [frame * 4, -Math.PI / 10, 0, 0],
        ],
    };

    let step = 0.05;

    const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', {
        diameter: 0.5,
    });

    const leftUpperLegAnim = {
        name: 'leftUpperLegAnim',
        keys: [
            [0, 0, 0, 0],
            [frame, 0, Math.PI / 10, 0],
            [frame * 3, 0, -Math.PI / 15, 0],
            [frame * 4, 0, 0, 0],
        ],
    };

    const rightUpperLegAnim = {
        name: 'rightUpperLegAnim',
        keys: [
            [0, 0, 0, 0],
            [frame, 0, -Math.PI / 10, 0],
            [frame * 3, 0, Math.PI / 15, 0],
            [frame * 4, 0, 0, 0],
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
    const animationGroup = new BABYLON.AnimationGroup(name, scene);
    animationGroup.loopAnimation = true;
    switch (name) {
        case 'rig':
            animationGroup.addTargetedAnimation(
                createRigAnimation(leftUpperLegAnim),
                vrmManager.humanoidBone.leftUpperLeg
            );
            animationGroup.addTargetedAnimation(
                createRigAnimation(rightUpperLegAnim),
                vrmManager.humanoidBone.rightUpperLeg
            );
            // animationGroup.addTargetedAnimation(
            //     createAnimation(leftUpperArmAnim),
            //     vrmManager.humanoidBone.leftUpperArm,
            // );
            // animationGroup.addTargetedAnimation(
            //     createAnimation(rightUpperArmAnim),
            //     vrmManager.humanoidBone.rightUpperArm,
            // );
            break;
        case 'transform':
            animationGroup.addTargetedAnimation(
                createTransformAnimation(walkTransformAnim),
                vrmManager.rootMesh
            );
            animationGroup.addTargetedAnimation(
                createRigAnimation(walkRotateAnim),
                vrmManager.rootMesh
            );
            break;
    }

    return animationGroup;
}

export default createAnimationGroup;

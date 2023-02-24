import { KeyboardEventTypes, Quaternion, type Scene } from '@babylonjs/core';
import type { VRMManager } from 'babylon-vrm-loader';
import createWalkAnimationGroup from './Module_Animation';

function WalkControl(scene: Scene, vrmManager: VRMManager) {
    const rigAnimationFrame = 15;
    const transformAnimationFrame = 120;

    const handAnimationRig = createWalkAnimationGroup(
        vrmManager,
        scene,
        'hand',
        rigAnimationFrame
    );

    const legAnimationRig = createWalkAnimationGroup(
        vrmManager,
        scene,
        'leg',
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
            legAnimationRig.start(true, 1, 0, rigAnimationFrame * 4);

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
                previousQuaternion = vrmManager.rootMesh
                    .rotationQuaternion as Quaternion;
                targetQuaternion = new Quaternion(0, 0, 0, 1);
            }
        }

        if (targetQuaternion) {
            vrmManager.rootMesh.rotationQuaternion = Quaternion.Slerp(
                vrmManager.rootMesh.rotationQuaternion as Quaternion,
                targetQuaternion as Quaternion,
                rotationStep
            );

            if (
                Math.abs(
                    vrmManager.rootMesh.rotationQuaternion!.y -
                        targetQuaternion.y
                ) < 0.02
            ) {
                targetQuaternion = undefined;
                legAnimationRig.stop();
            }
        }
    });
}
export default WalkControl;

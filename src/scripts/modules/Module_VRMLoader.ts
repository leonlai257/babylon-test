import * as BABYLON from "@babylonjs/core";
import { Module } from "../Module";
import "@babylonjs/loaders";
import "@babylonjs/loaders/glTF";
import "babylon-vrm-loader";

export class VRMLoader extends Module {
  async loadVRM(vrmFile, engine) {
    // vrmFile is File object retrieved by <input type="file">.

    const scene = await BABYLON.SceneLoader.LoadAsync(
      "src/assets/vrm/",
      vrmFile,
      engine
    );
    console.dir(scene);
    const vrmManager = scene.metadata.vrmManagers[0];

    // Update secondary animation
    scene.onBeforeRenderObservable.add(() => {
      vrmManager.update(scene.getEngine().getDeltaTime());
    });

    // Model Transformation
    vrmManager.rootMesh.translate(new BABYLON.Vector3(1, 0, 0), 1);

    // Work with HumanoidBone
    vrmManager.humanoidBone.leftUpperArm.addRotation(0, 1, 0);

    // Work with BlendShape(MorphTarget)
    vrmManager.morphing("Joy", 1.0);

    return scene;
  }
}

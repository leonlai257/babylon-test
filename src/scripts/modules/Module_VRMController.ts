import { SceneLoader } from '@babylonjs/core';

export class VRMController {
    async loadVRM(rootUrl: string, fileName: string) {
        const result = await SceneLoader.AppendAsync(rootUrl, fileName);

        const vrmManager = result.metadata.vrmManagers[0];

        // vrmManager.rootMesh.scaling = new Vector3(0.5,0.5,0.5);
        // vrmManager.rootMesh.addRotation(0, Math.PI, 0);

        return vrmManager;
    }
}

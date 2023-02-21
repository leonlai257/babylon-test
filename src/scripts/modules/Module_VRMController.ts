import { SceneLoader } from '@babylonjs/core';

async function loadVRM(rootUrl: string, fileName: string) {
    const result = await SceneLoader.AppendAsync(rootUrl, fileName);
    const vrmManager = result.metadata.vrmManagers[0];
    vrmManager.rootMesh.addRotation(0, Math.PI, 0);
    return vrmManager;
}

export { loadVRM };

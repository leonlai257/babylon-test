import { Vector3 } from "@babylonjs/core";
import type { VRMManager } from "babylon-vrm-loader";

let targetLocationIndex = 0;

function createWalkPath(vrmManager: VRMManager, locationList: {x: number, y: number, z: number}[], idleTime: number) {
    let targetLocation = locationList[targetLocationIndex];
    vrmManager.rootMesh.position = Vector3.Lerp(vrmManager.rootMesh.position, new Vector3(targetLocation.x, 0, targetLocation.z), 0.01)
    vrmManager.rootMesh.lookAt(new Vector3(targetLocation.x, 0, targetLocation.z + Math.abs(targetLocation.x) * 0.4));
    if (Vector3.Distance(vrmManager.rootMesh.position, new Vector3(targetLocation.x, targetLocation.y, targetLocation.z)) < 0.1) {
        targetLocationIndex = targetLocationIndex == 1 ? 0 : 1;
    }
}

export default createWalkPath;
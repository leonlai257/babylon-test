import {
    Engine,
    Scene,
    FreeCamera,
    Vector3,
    MeshBuilder,
    StandardMaterial,
    Color3,
    HemisphericLight,
} from '@babylonjs/core';

import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';
import { Camera } from '../modules/Module_camera';

const createScene = async (canvas: any) => {
    const engine = new Engine(canvas);
    const scene = new Scene(engine);

    // const camera = new FreeCamera('camera1', new Vector3(0, 5, -10), scene);
    // camera.setTarget(Vector3.Zero());
    // camera.attachControl(canvas, true);

    new HemisphericLight('light', Vector3.Up(), scene);

    const box = MeshBuilder.CreateBox('box', { size: 2 }, scene);
    const material = new StandardMaterial('box-material', scene);
    material.diffuseColor = Color3.Blue();
    box.material = material;

    const model = poseDetection.SupportedModels.BlazePose;
    const detectorConfig = {
        runtime: 'tfjs',
        enableSmoothing: true,
        modelType: 'full',
    };
    let detector = await poseDetection.createDetector(model, detectorConfig);

    const camera = await Camera.setupCamera({
        targetFPS: 60,
        sizeOption: '640 X 480',
    });
    console.log(camera);
    // const poses = await detector.estimatePoses(video);

    console.log(detector);

    engine.runRenderLoop(() => {
        scene.render();
    });
};

export { createScene };

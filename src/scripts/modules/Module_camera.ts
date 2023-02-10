import * as posedetection from '@tensorflow-models/pose-detection';
import * as scatter from 'scatter-gl';

const VIDEO_SIZE = {
    '640 X 480': { width: 640, height: 480 },
    '640 X 360': { width: 640, height: 360 },
    '360 X 270': { width: 360, height: 270 },
};

export class Camera {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        console.log('Camera constructor');
    }

    static async setupCamera(cameraParam) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error(
                'Browser API navigator.mediaDevices.getUserMedia not available'
            );
        }

        const { targetFPS, sizeOption } = cameraParam;
        // const $size = params.VIDEO_SIZE[sizeOption];
        const $size = VIDEO_SIZE['640 X 480'];
        const videoConfig = {
            audio: false,
            video: {
                facingMode: 'user',
                // Only setting the video to a specified size for large screen, on
                // mobile devices accept the default size.
                // width: isMobile()
                //     ? params.VIDEO_SIZE['360 X 270'].width
                //     : $size.width,
                // height: isMobile()
                //     ? params.VIDEO_SIZE['360 X 270'].height
                //     : $size.height,
                width: $size.width,
                height: $size.height,
                frameRate: {
                    ideal: targetFPS,
                },
            },
        };

        const stream = await navigator.mediaDevices.getUserMedia(videoConfig);

        const camera = new Camera();
        camera.video.srcObject = stream;

        await new Promise((resolve) => {
            camera.video.onloadedmetadata = () => {
                resolve(video);
            };
        });

        camera.video.play();

        const videoWidth = camera.video.videoWidth;
        const videoHeight = camera.video.videoHeight;
        // Must set below two lines, otherwise video element doesn't show.
        camera.video.width = videoWidth;
        camera.video.height = videoHeight;

        camera.canvas.width = videoWidth;
        camera.canvas.height = videoHeight;
        const canvasContainer = document.querySelector('.canvas-wrapper');
        canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;

        // Because the image from camera is mirrored, need to flip horizontally.
        camera.ctx.translate(camera.video.videoWidth, 0);
        camera.ctx.scale(-1, 1);

        camera.scatterGLEl.style = `width: ${videoWidth}px; height: ${videoHeight}px;`;
        camera.scatterGL.resize();

        camera.scatterGLEl.style.display = params.STATE.modelConfig.render3D
            ? 'inline-block'
            : 'none';

        return camera;
    }
}

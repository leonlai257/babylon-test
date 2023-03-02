import { Camera, float, Vector3 } from '@babylonjs/core';
import { Module } from '../Module';
import { ModuleController } from '../ModuleController';
import { TimelineModule } from './Module_Timeline';

export interface TimeSectionProps {
    startTime: float;
    endTime: float;
    cameraSetting: 'static' | 'semicircle' | 'zoom-in-out';
    player: string;
}

export class TimeSection extends Module {
    public startTime = 0.0;
    public endTime = 10.0;
    public cameraSetting: 'static' | 'semicircle' | 'zoom-in-out' = 'static';
    public player = '';

    constructor(timeSection: TimeSectionProps) {
        super();
        this.startTime = timeSection.startTime;
        this.endTime = timeSection.endTime;
        this.cameraSetting = timeSection.cameraSetting;
        this.player = timeSection.player;
    }

    public attach(controller: ModuleController): void {
        super.attach(controller);
    }

    public detach(): void {
        super.detach();
    }

    public onModuleAttached(module: Module): void {
        super.onModuleAttached(module);
        if (module instanceof TimelineModule) {
            module.cameraPath = this.getCameraPath();
        }
    }

    getCameraPath(): Array<Vector3> {
        switch (this.cameraSetting) {
            case 'static':
                return [new Vector3(0, 0, 0)];
            case 'semicircle':
                return [
                    new Vector3(0, 0, 0),
                    new Vector3(1, 0, 0),
                    new Vector3(0, 0, 0),
                    new Vector3(-1, 0, 0),
                ];
            case 'zoom-in-out':
                return [
                    new Vector3(0, 0, 0),
                    new Vector3(0, 0, 1),
                    new Vector3(0, 0, 0),
                    new Vector3(0, 0, -1),
                ];
            default:
                break;
        }
    }
}

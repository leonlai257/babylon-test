import { Camera, float, int, Scene, Vector3 } from '@babylonjs/core';
import {
    ButtonKey,
    ButtonState,
    InputController,
} from '../../input/InputController';
import { Module } from '../Module';
import { ModuleController } from '../ModuleController';
import { TimeSection, TimeSectionProps } from './Module_TimeSection';
import { Node } from '@/utils/OrderedList';

export class TimelineModule extends Module {
    public timeline: Array<TimeSectionProps> = [
        {
            startTime: 0,
            endTime: 4,
            cameraSetting: 'static',
            player: 'main',
        },
        {
            startTime: 4,
            endTime: 8,
            cameraSetting: 'semicircle',
            player: 'main',
        },
    ];

    public currentTimeSection: TimeSection = null;
    public currentTimeValue: float = 0.0;
    public currentPattern: int = 0;
    public cameraPath: Array<Vector3> = [new Vector3(0, 0, 0)];

    private _isAutoNext: boolean = true;
    private _isTimelinePaused: boolean = false;

    mainSpeakerId = '';

    constructor(timeline?: Array<TimeSectionProps>) {
        super();
        if (timeline) {
            this.timeline = timeline;
        }
    }

    public attach(controller: ModuleController): void {
        super.attach(controller);
    }

    public detach(): void {
        super.detach();
    }

    public async onModuleAttached(module: Module) {
        this.play();
    }

    public async onModuleDetached(module: Module) {
        this.stop();
    }

    public onInputControllerUpdate(module: Module) {
        if (module instanceof InputController) {
            module.buttonStateDictionary.registerObserver(
                ButtonKey.PREV,
                new Node(1, this.onPrevStateUpdate.bind(this))
            );
            module.buttonStateDictionary.registerObserver(
                ButtonKey.NEXT,
                new Node(1, this.onNextStateUpdate.bind(this))
            );
        }
    }

    public onNextStateUpdate(state: ButtonState) {
        if (state === ButtonState.TAP) {
            console.log('next');
            this.next();
        }
    }

    public onPrevStateUpdate(state: ButtonState) {
        if (state === ButtonState.TAP) {
            console.log('prev');
            this.previous();
        }
    }

    public setCurrentTime(time: float): void {
        this.currentTimeValue = time;
    }

    public setAutoNext(): void {
        this._isAutoNext = !this._isAutoNext;
    }

    public play(): void {
        this._isTimelinePaused = false;
        this.currentTimeSection = new TimeSection(
            this.timeline[this.currentPattern]
        );
    }

    public pause(): void {
        this._isTimelinePaused = true;
    }

    public stop(): void {
        this._isTimelinePaused = true;
        this.currentTimeSection.detach();
        this.currentTimeValue = 0.0;
        this.currentPattern = 0;
    }

    public next(): void {
        console.log('next');

        this.currentTimeSection.detach();
        if (this.currentPattern >= this.timeline.length - 1) {
            return this.pause();
        }
        this.currentTimeSection = new TimeSection(
            this.timeline[++this.currentPattern]
        );
        this.currentTimeValue = this.timeline[this.currentPattern].startTime;
    }

    public previous(): void {
        this.currentTimeSection.detach();
        if (this.currentPattern <= 0) {
            this.currentTimeSection = new TimeSection(this.timeline[0]);
        } else {
            this.currentTimeSection = new TimeSection(
                this.timeline[--this.currentPattern]
            );
        }
        this.currentTimeValue = this.timeline[this.currentPattern].startTime;
    }

    public updateContent(): void {}

    public update(deltaTime): void {
        if (!deltaTime) {
            return;
        }
        console.log(this.currentTimeValue);
        console.log(this.currentTimeSection);
        console.log(this.currentPattern);
        if (!this._isTimelinePaused) {
            this.currentTimeValue += deltaTime;
            if (
                this.currentTimeValue >=
                this.timeline[this.currentPattern].endTime
            ) {
                if (this._isAutoNext) {
                    this.next();
                } else {
                    this.pause();
                }
            }
        }
    }
}

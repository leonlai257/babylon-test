import type { Nullable } from '@babylonjs/core';
import { Node } from '../../../utils/OrderedList';
import { ModuleController, ModuleEvent } from './ModuleController';

export class Module {
    public id: string | undefined;
    public controller: Nullable<ModuleController> | undefined;

    public update(deltaTime: number) {}

    public attach(controller: ModuleController) {
        this.controller = controller;
        this.controller?.moduleEventDictionary.registerObserver(
            ModuleEvent.MODULE_ATTACHED,
            new Node(1, this.onModuleAttached.bind(this))
        );
        this.controller?.moduleEventDictionary.registerObserver(
            ModuleEvent.MODULE_DETACHED,
            new Node(1, this.onModuleDetached.bind(this))
        );
    }

    public detach() {
        this.controller?.moduleEventDictionary.removeObserver(
            ModuleEvent.MODULE_ATTACHED,
            this.onModuleAttached.bind(this)
        );
        this.controller?.moduleEventDictionary.removeObserver(
            ModuleEvent.MODULE_DETACHED,
            this.onModuleDetached.bind(this)
        );
        this.controller = null;
    }

    public onModuleAttached(module: Module) {}

    public onModuleDetached(module: Module) {}
}

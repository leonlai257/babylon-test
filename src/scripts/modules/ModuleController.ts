import { AbstractMesh, Mesh, Nullable, TransformNode } from "@babylonjs/core";
import { EventDictionary } from "../../../utils/EventDictionary";
import { Node, OrderedList } from "../../../utils/OrderedList";
import { Module } from "./Module";

export type Constructor<T> = new (...args: any[]) => T;

// TODO - memory leak, after a module listen to event destroyed, reference still remain in dictionary
// All Object/ Entity should inherit from Module Controller to manage the scripts attached to it
// Similiar to unity component based object

// Network part
/**
 * Transform Data
 * Interactable Data
 */

export enum ModuleEvent {
  NODE_UPDATED = 1001,
  MODULE_ATTACHED = 1002,
  MODULE_DETACHED = 1003,
  DEPOSED = 1004,
}

export class ModuleController {
  public moduleList: OrderedList<number, Module>;
  public moduleEventDictionary: EventDictionary<ModuleEvent, any>;

  public node: TransformNode | AbstractMesh;

  constructor() {
    this.moduleList = new OrderedList();
    this.moduleEventDictionary = new EventDictionary();
  }

  public registerNode(node: TransformNode | AbstractMesh) {
    this.node = node;
    this.moduleEventDictionary.send(ModuleEvent.NODE_UPDATED, this.node);
  }

  public attach(node: Node<number, Module>) {
    this.moduleList.insert(node);
    node.value.attach(this);
    this.moduleEventDictionary.send(ModuleEvent.MODULE_ATTACHED, node.value);
  }

  public detach(module: Module) {
    module.detach();
    this.moduleEventDictionary.send(ModuleEvent.MODULE_DETACHED, module);
    this.moduleList.remove(module);
  }

  public getModule<T extends Module>(filter: Constructor<T>): Nullable<T> {
    let result: Nullable<T> = null;
    this.moduleList.forEach((node: Node<number, Module>) => {
      if (node.value instanceof filter) {
        result = node.value;
      }
    });
    return result;
  }

  public getModules<T extends Module>(filter: Constructor<T>) {
    let result: Nullable<T>[] = [];
    this.moduleList.forEach((node: Node<number, Module>) => {
      if (node.value instanceof filter) {
        result.push(node.value);
      }
    });
    return result;
  }

  public update(deltaTime: number) {
    this.moduleList.forEach((node: Node<number, Module>) => {
      node.value.update(deltaTime);
    });
  }

  public depose() {
    this.moduleEventDictionary.send("Deposed", true);
  }
}

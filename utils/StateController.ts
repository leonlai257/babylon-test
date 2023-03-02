import { Nullable } from "@babylonjs/core";
import { equal } from "./Generic";
import { Node, OrderedList } from "./OrderedList";
import { isPrimitive } from "@/utils/Generic";

export type TListener<TState> = (state: TState) => void;
export class StateController<TState> {
  public state: TState;
  // callback must be using arrow function to avoid this reference problem
  public observers: OrderedList<number, TListener<TState>>;

  constructor() {
    // this.state = null;
    this.observers = new OrderedList<number, TListener<TState>>();
  }

  public get() {
    return this.state;
  }

  public set(state: TState, trigger = true) {
    // if value is different from previous result
    if (!equal(this.state, state)) {
      this.state = state;
      if (trigger === true) this.notify();
    }
    return this;
  }

  public notify() {
    this.observers.forEach((node) => {
      node.value(<TState>this.state);
    });
  }

  public clone() {
    let cloneState;

    if (isPrimitive(this.state)) cloneState = this.state;
    else cloneState = Object.assign(Object.create(Object.getPrototypeOf(this.state)), this.state);

    return new StateController<TState>().set(cloneState);
  }

  public registerObserver(observer: Node<number, TListener<TState>>) {
    return this.observers.insert(observer);
  }

  public removeObserver(observer: TListener<TState>) {
    return this.observers.remove(observer);
  }
}

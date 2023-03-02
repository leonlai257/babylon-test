import { equal } from "./Generic";
import { Node, OrderedList } from "./OrderedList";

export type T2Listener<TState1, TState2> = (state1: TState1, state2: TState2) => void;
export type TListener<TState> = (state: TState) => void;
export class StateDictionary<TKey, TState> {
  public states: Map<TKey, TState>;
  public observers: Map<TKey, OrderedList<number, TListener<TState>>>;

  public globalObservers: OrderedList<number, T2Listener<TKey, TState>>;

  constructor() {
    this.states = new Map<TKey, TState>();
    this.observers = new Map<TKey, OrderedList<number, TListener<TState>>>();
    this.globalObservers = new OrderedList<number, T2Listener<TKey, TState>>();
  }

  public get(key: TKey) {
    return this.states.get(key);
  }

  public set(key: TKey, state: TState) {
    let currentState = this.states.get(key);

    // if value is undefined or different from previous result
    if (currentState === undefined || !equal(currentState, state)) {
      this.states.set(key, (currentState = state));
      this.observers.get(key)?.forEach((node) => {
        node.value(<TState>currentState);
      });
      this.globalObservers?.forEach((node) => {
        node.value(key, state);
      });
    }
  }

  public registerObserver(key: TKey, observer: Node<number, TListener<TState>>) {
    let observers = this.observers.get(key);
    if (observers === undefined) observers = new OrderedList<number, TListener<TState>>();
    this.observers.set(key, observers.insert(observer));
    return this.observers;
  }

  public removeObserver(key: TKey, observer: TListener<TState>) {
    let observers = this.observers.get(key);
    if (observers !== undefined) observers.remove(observer);
    if (!observers?.length) this.observers.delete(key);
  }
}

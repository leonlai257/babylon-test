import { equal } from "./Generic";
import { Node, OrderedList } from "./OrderedList";

export type TListener<TEvent> = (event: TEvent) => void;
export class EventDictionary<TKey, TEvent> {
  public observers: Map<TKey, OrderedList<number, TListener<TEvent>>>;

  constructor() {
    this.observers = new Map<TKey, OrderedList<number, TListener<TEvent>>>();
  }

  public send(key: TKey, event: TEvent) {
    this.observers.get(key)?.forEach((node) => {
      node.value(<TEvent>event);
    });
  }

  public registerObserver(key: TKey, observer: Node<number, TListener<TEvent>>) {
    let observers = this.observers.get(key);
    if (observers === undefined) observers = new OrderedList<number, TListener<TEvent>>();
    this.observers.set(key, observers.insert(observer));
    return this.observers;
  }

  public removeObserver(key: TKey, observer: TListener<TEvent>) {
    let observers = this.observers.get(key);
    if (observers !== undefined) observers.remove(observer);
  }
}

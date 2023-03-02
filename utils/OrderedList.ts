import { equal } from "./Generic";

export class OrderedList<TKey extends number | string, TValue extends object> {
  public head: Node<TKey, TValue> | null;
  public length: number;

  constructor() {
    this.head = null;
    this.length = 0;
  }

  public fromArray(array: Node<TKey, TValue>[]) {
    array.forEach((node) => this.insert(node));
    return this;
  }

  [Symbol.iterator]() {
    let current = this.head;
    return {
      next: () => {
        let result: any = {};
        result.value = current;
        result.done = current ? false : true;
        if (current) current = current.next;
        return result;
      },
    };
  }

  public forEach(callback: (state: Node<TKey, TValue>) => void) {
    for (let node of this) {
      callback(node);
    }
  }

  public insert(node: Node<TKey, TValue>) {
    // head > node
    if (this.head === null || this.head.compare(node) > 0) {
      node.next = this.head;
      if (this.head) this.head.prev = node;
      this.head = node;
    } else {
      let current = this.head;
      // while has next node and node > current
      while (current.next != null && current.next.compare(node) < 0) {
        current = current.next;
      }
      node.next = current.next;
      current.next = node;
      node.prev = current;
    }
    this.length += 1;
    return this;
  }

  public remove(value: TValue) {
    let target: Node<TKey, TValue> | null = this.find(value);
    if (target) {
      if (this.head === target) {
        this.head = target.next;
        if (target.next) {
          target.next.prev = null;
        }
      } else {
        if (target.prev) target.prev.next = target.next;
        if (target.next) target.next.prev = target.prev;
      }
      this.length -= 1;
    }
    return this;
  }

  public find(value: TValue) {
    let target: Node<TKey, TValue> | null = null;
    if (this.head !== null) {
      let current = this.head;
      while (current.next != null && !equal(current.value, value)) {
        current = current.next;
      }
      target = current;
    }
    return target;
  }
}

export class Node<TKey extends number | string, TValue extends object> {
  public key: TKey;
  public value: TValue;

  public next: Node<TKey, TValue> | null;
  public prev: Node<TKey, TValue> | null;

  constructor(key: TKey, value: TValue) {
    this.key = key;
    this.value = value;
    this.prev = this.next = null;
  }

  public compare(other: any) {
    if (!(other instanceof Node<TKey, TValue>)) {
      return -1;
    }
    if (this.key < other.key) return -1;
    if (this.key > other.key) return 1;
    return 0;
  }
}

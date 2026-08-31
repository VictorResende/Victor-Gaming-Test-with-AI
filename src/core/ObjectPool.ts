export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private resetFn?: (item: T) => void;

  constructor(factory: () => T, resetFn?: (item: T) => void, initialSize = 20) {
    this.factory = factory;
    this.resetFn = resetFn;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  public get(): T {
    let item: T;
    if (this.pool.length > 0) {
      item = this.pool.pop()!;
    } else {
      item = this.factory();
    }
    if (this.resetFn) {
      this.resetFn(item);
    }
    return item;
  }

  public release(item: T): void {
    if (this.pool.includes(item)) return;
    this.pool.push(item);
  }

  public clear(): void {
    this.pool = [];
  }
}

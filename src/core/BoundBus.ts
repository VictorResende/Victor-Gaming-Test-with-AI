type BusHandler = (...args: any[]) => void;

export interface BusLike {
  on(event: string, fn: BusHandler): unknown;
  off(event: string, fn: BusHandler): unknown;
}

/** Scene-scoped subscriptions that can be removed without `removeAllListeners()`. */
export class BoundBus {
  private bindings: Array<{ event: string; fn: BusHandler }> = [];

  constructor(private readonly bus: BusLike) {}

  public on(event: string, fn: BusHandler): void {
    this.bus.on(event, fn);
    this.bindings.push({ event, fn });
  }

  public offAll(): void {
    this.bindings.forEach(({ event, fn }) => this.bus.off(event, fn));
    this.bindings = [];
  }

  public getBindingCount(): number {
    return this.bindings.length;
  }
}

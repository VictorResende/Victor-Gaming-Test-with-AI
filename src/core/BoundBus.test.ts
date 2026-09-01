import { describe, expect, it } from 'vitest';
import { BoundBus } from './BoundBus';

class MockBus {
  listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  on(event: string, fn: (...args: unknown[]) => void): void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(fn);
    this.listeners.set(event, set);
  }

  off(event: string, fn: (...args: unknown[]) => void): void {
    this.listeners.get(event)?.delete(fn);
  }

  count(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

describe('BoundBus restart harness', () => {
  it('does not stack listeners across five scene recreations', () => {
    const bus = new MockBus();
    for (let i = 0; i < 5; i++) {
      const sceneBus = new BoundBus(bus);
      sceneBus.on('GOLD_CHANGED', () => undefined);
      expect(bus.count('GOLD_CHANGED')).toBe(1);
      sceneBus.offAll();
      expect(bus.count('GOLD_CHANGED')).toBe(0);
    }
  });
});

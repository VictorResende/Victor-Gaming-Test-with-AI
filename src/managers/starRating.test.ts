import { describe, expect, it } from 'vitest';
import { starRating } from './starRating';

describe('starRating', () => {
  it('awards 3 only on a perfect hold', () => {
    expect(starRating(20, 20)).toBe(3);
    expect(starRating(19, 20)).toBe(2);
  });

  it('awards 2 at half lives rounded up', () => {
    expect(starRating(10, 20)).toBe(2);
    expect(starRating(9, 20)).toBe(1);
  });

  it('awards 1 while any life remains, 0 on wipe', () => {
    expect(starRating(1, 20)).toBe(1);
    expect(starRating(0, 20)).toBe(0);
  });
});

/** Victory stars from remaining lives vs starting lives. */
export function starRating(lives: number, initialLives: number): number {
  if (lives === initialLives) return 3;
  if (lives >= Math.ceil(initialLives * 0.5)) return 2;
  if (lives > 0) return 1;
  return 0;
}

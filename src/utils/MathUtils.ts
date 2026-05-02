import Phaser from 'phaser';

export function distBetween(a: Phaser.GameObjects.Sprite, b: Phaser.GameObjects.Sprite): number {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

export function angleBetween(a: Phaser.GameObjects.Sprite, b: Phaser.GameObjects.Sprite): number {
  return Phaser.Math.Angle.Between(a.x, a.y, b.x, b.y);
}

export function clamp(value: number, min: number, max: number): number {
  return Phaser.Math.Clamp(value, min, max);
}

export function randInt(min: number, max: number): number {
  return Phaser.Math.Between(min, max);
}

export function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

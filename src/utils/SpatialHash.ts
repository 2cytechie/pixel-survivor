import Phaser from 'phaser';

/**
 * Spatial hash grid for efficient collision detection
 */
export class SpatialHash {
  private cellSize: number;
  private grid: Map<string, Phaser.GameObjects.Sprite[]>;

  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  private key(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  clear(): void {
    this.grid.clear();
  }

  insert(obj: Phaser.GameObjects.Sprite): void {
    const k = this.key(obj.x, obj.y);
    if (!this.grid.has(k)) {
      this.grid.set(k, []);
    }
    this.grid.get(k)!.push(obj);
  }

  query(x: number, y: number, radius: number): Phaser.GameObjects.Sprite[] {
    const results: Phaser.GameObjects.Sprite[] = [];
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.grid.get(`${cx},${cy}`);
        if (cell) {
          for (const obj of cell) {
            results.push(obj);
          }
        }
      }
    }
    return results;
  }

  queryNearby(x: number, y: number, radius: number): Phaser.GameObjects.Sprite[] {
    const all = this.query(x, y, radius);
    return all.filter(obj => {
      const dx = obj.x - x;
      const dy = obj.y - y;
      return dx * dx + dy * dy <= radius * radius;
    });
  }
}

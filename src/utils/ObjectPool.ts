import Phaser from 'phaser';

/**
 * Object pool for recycling game objects to reduce GC pressure
 */
export class ObjectPool<T extends Phaser.GameObjects.Sprite> {
  private pool: T[] = [];
  private active: T[] = [];
  private createFn: () => T;

  constructor(createFn: () => T, initialSize: number = 0) {
    this.createFn = createFn;
    for (let i = 0; i < initialSize; i++) {
      const obj = this.createFn();
      obj.setActive(false).setVisible(false);
      this.pool.push(obj);
    }
  }

  get(x: number, y: number): T {
    let obj: T;
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.createFn();
    }
    obj.setPosition(x, y).setActive(true).setVisible(true);
    this.active.push(obj);
    return obj;
  }

  release(obj: T): void {
    const idx = this.active.indexOf(obj);
    if (idx !== -1) {
      this.active.splice(idx, 1);
      obj.setActive(false).setVisible(false);
      this.pool.push(obj);
    }
  }

  releaseAll(): void {
    while (this.active.length > 0) {
      const obj = this.active.pop()!;
      obj.setActive(false).setVisible(false);
      this.pool.push(obj);
    }
  }

  getActive(): T[] {
    return this.active;
  }

  get activeCount(): number {
    return this.active.length;
  }
}

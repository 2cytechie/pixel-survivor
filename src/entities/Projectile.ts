import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export class Projectile extends Phaser.GameObjects.Sprite {
  public damage: number;
  public speed: number;
  public range: number;
  public angle: number;
  public startX: number;
  public startY: number;
  public isEnemyProjectile: boolean;
  public hitEnemies: Set<number>;
  public pierce: number;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'projectile') {
    super(scene, x, y, texture);

    this.setScale(GameConfig.PIXEL_SCALE);
    scene.add.existing(this);

    this.damage = 0;
    this.speed = 300;
    this.range = 250;
    this.angle = 0;
    this.startX = x;
    this.startY = y;
    this.isEnemyProjectile = false;
    this.hitEnemies = new Set();
    this.pierce = 0;

    this.setOrigin(0.5, 0.5);
  }

  /**
   * 初始化投射物属性（从对象池取出后调用）
   */
  init(
    x: number,
    y: number,
    damage: number,
    speed: number,
    range: number,
    angle: number,
    isEnemyProjectile: boolean = false,
    pierce: number = 0
  ): void {
    this.setPosition(x, y);
    this.startX = x;
    this.startY = y;
    this.damage = damage;
    this.speed = speed;
    this.range = range;
    this.angle = angle;
    this.isEnemyProjectile = isEnemyProjectile;
    this.pierce = pierce;
    this.hitEnemies.clear();
    this.setActive(true);
    this.setVisible(true);
  }

  update(_time: number, delta: number): void {
    // 按方向移动
    const moveX = Math.cos(this.angle) * this.speed * (delta / 1000);
    const moveY = Math.sin(this.angle) * this.speed * (delta / 1000);
    this.x += moveX;
    this.y += moveY;

    // 检查是否超出射程
    const dx = this.x - this.startX;
    const dy = this.y - this.startY;
    const traveled = Math.sqrt(dx * dx + dy * dy);

    if (traveled >= this.range) {
      this.release();
    }
  }

  /**
   * 回收到对象池
   */
  release(): void {
    this.setActive(false);
    this.setVisible(false);
    // 如果场景有投射物对象池，则回收
    if ((this.scene as any).projectilePool) {
      (this.scene as any).projectilePool.release(this);
    }
  }

  /**
   * 记录命中敌人，返回是否还可以继续穿透
   */
  registerHit(enemyId: number): boolean {
    this.hitEnemies.add(enemyId);
    if (this.pierce > 0) {
      this.pierce--;
      return true; // 还能穿透
    }
    return false; // 不能穿透，应该销毁
  }
}

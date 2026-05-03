import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { EnemyType, EnemyData } from '../config/GameData';
import { distBetween, angleBetween } from '../utils/MathUtils';

export interface OnEnemyKilledCallback {
  (enemy: Enemy): void;
}

export class Enemy extends Phaser.GameObjects.Sprite {
  public enemyType: EnemyType;
  public hp: number;
  public maxHp: number;
  public speed: number;
  public damage: number;
  public expValue: number;
  public behavior: 'chase' | 'dash' | 'ranged';
  public lastAttackTime: number = 0;
  public attackInterval: number = 1000;
  public projectileSpeed: number = 0;
  public uid: number; // unique id for tracking hits

  private static nextUid: number = 1;

  // dash 行为专用
  private isDashing: boolean = false;
  private dashTimer: number = 0;
  private dashDuration: number = 300;
  private dashCooldown: number = 2000;
  private dashSpeedMultiplier: number = 3;
  private dashAngle: number = 0;

  // ranged 行为专用
  private preferredDistance: number = 150;

  constructor(scene: Phaser.Scene, x: number, y: number, data: EnemyData) {
    // Use spritesheet texture and animation key based on enemy type
    const sheetKey = `${data.type}_sheet`;
    const animKey = `${data.type}_move`;
    super(scene, x, y, sheetKey, 0);

    this.setScale(GameConfig.PIXEL_SCALE);
    scene.add.existing(this);

    this.enemyType = data.type;
    this.uid = Enemy.nextUid++;
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.speed = data.speed;
    this.damage = data.damage;
    this.expValue = data.expValue;
    this.behavior = data.behavior;
    this.attackInterval = data.attackInterval ?? 1000;
    this.projectileSpeed = data.projectileSpeed ?? 0;

    this.setOrigin(0.5, 0.5);

    // Play movement animation
    this.play(animKey);
  }

  takeDamage(amount: number, scene: Phaser.Scene): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.kill(scene);
      return true; // 死亡
    }
    return false;
  }

  private kill(scene: Phaser.Scene): void {
    // 调用场景的 onEnemyKilled 回调
    if ((scene as any).onEnemyKilled) {
      (scene as any).onEnemyKilled(this);
    }
    this.destroy();
  }

  update(player: Phaser.GameObjects.Sprite, delta: number): void {
    const now = this.scene.time.now;

    switch (this.behavior) {
      case 'chase':
        this.updateChase(player, delta);
        break;
      case 'dash':
        this.updateDash(player, delta, now);
        break;
      case 'ranged':
        this.updateRanged(player, delta, now);
        break;
    }
  }

  private updateChase(player: Phaser.GameObjects.Sprite, delta: number): void {
    const angle = angleBetween(this, player);
    const moveX = Math.cos(angle) * this.speed * (delta / 1000);
    const moveY = Math.sin(angle) * this.speed * (delta / 1000);
    this.x += moveX;
    this.y += moveY;
  }

  private updateDash(player: Phaser.GameObjects.Sprite, delta: number, now: number): void {
    if (this.isDashing) {
      // 冲刺中
      this.dashTimer -= delta;
      const dashSpeed = this.speed * this.dashSpeedMultiplier;
      const moveX = Math.cos(this.dashAngle) * dashSpeed * (delta / 1000);
      const moveY = Math.sin(this.dashAngle) * dashSpeed * (delta / 1000);
      this.x += moveX;
      this.y += moveY;

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.lastAttackTime = now;
      }
    } else {
      // 正常追踪（较慢）
      const angle = angleBetween(this, player);
      const slowSpeed = this.speed * 0.5;
      const moveX = Math.cos(angle) * slowSpeed * (delta / 1000);
      const moveY = Math.sin(angle) * slowSpeed * (delta / 1000);
      this.x += moveX;
      this.y += moveY;

      // 检查是否可以冲刺
      if (now - this.lastAttackTime >= this.dashCooldown) {
        const dist = distBetween(this, player);
        if (dist < 200) {
          this.startDash(player);
        }
      }
    }
  }

  private startDash(player: Phaser.GameObjects.Sprite): void {
    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashAngle = angleBetween(this, player);
  }

  private updateRanged(player: Phaser.GameObjects.Sprite, delta: number, now: number): void {
    const dist = distBetween(this, player);
    const angle = angleBetween(this, player);

    if (dist > this.preferredDistance + 30) {
      // 太远，靠近
      const moveX = Math.cos(angle) * this.speed * (delta / 1000);
      const moveY = Math.sin(angle) * this.speed * (delta / 1000);
      this.x += moveX;
      this.y += moveY;
    } else if (dist < this.preferredDistance - 30) {
      // 太近，远离
      const moveX = -Math.cos(angle) * this.speed * (delta / 1000);
      const moveY = -Math.sin(angle) * this.speed * (delta / 1000);
      this.x += moveX;
      this.y += moveY;
    }

    // 射击
    if (now - this.lastAttackTime >= this.attackInterval) {
      this.lastAttackTime = now;
      this.shootProjectile(angle);
    }
  }

  private shootProjectile(angle: number): void {
    // 调用场景的 spawnEnemyProjectile 方法
    if ((this.scene as any).spawnEnemyProjectile) {
      (this.scene as any).spawnEnemyProjectile(this.x, this.y, angle, this.damage, this.projectileSpeed);
    }
  }
}

import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export interface PlayerStats {
  hp: number;
  maxHp: number;
  speed: number;
  level: number;
  exp: number;
  expToNext: number;
  pickupRange: number;
  armor: number;
  regen: number;
  critRate: number;
  critDamage: number;
  cooldownReduction: number;
  weaponSlots: number;
}

export class Player extends Phaser.GameObjects.Sprite {
  // 基础属性
  public hp: number;
  public maxHp: number;
  public speed: number;
  public level: number;
  public exp: number;
  public expToNext: number;
  public pickupRange: number;
  public armor: number;
  public regen: number;
  public critRate: number;
  public critDamage: number;
  public cooldownReduction: number;
  public weaponSlots: number;

  // 移动方向（由外部输入设置）
  public vx: number = 0;
  public vy: number = 0;

  // 无敌时间
  public invincibleUntil: number = 0;

  // 回血计时器
  private regenTimer: number = 0;

  // 闪烁计时器
  private hitFlashTimer: number = 0;
  private readonly HIT_FLASH_DURATION: number = 150;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    this.setScale(GameConfig.PIXEL_SCALE);
    scene.add.existing(this);

    // 初始化属性
    this.hp = GameConfig.PLAYER.MAX_HP;
    this.maxHp = GameConfig.PLAYER.MAX_HP;
    this.speed = GameConfig.PLAYER.SPEED;
    this.level = 1;
    this.exp = 0;
    this.expToNext = GameConfig.EXP.BASE_EXP_TO_LEVEL;
    this.pickupRange = GameConfig.PLAYER.PICKUP_RANGE;
    this.armor = 0;
    this.regen = 0;
    this.critRate = 0;
    this.critDamage = 1.5;
    this.cooldownReduction = 0;
    this.weaponSlots = 1;

    // 设置物理体用于碰撞检测
    this.setOrigin(0.5, 0.5);
  }

  update(_time: number, delta: number): void {
    // 应用移动
    if (this.vx !== 0 || this.vy !== 0) {
      // 归一化方向向量
      const len = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (len > 0) {
        const nx = this.vx / len;
        const ny = this.vy / len;
        this.x += nx * this.speed * (delta / 1000);
        this.y += ny * this.speed * (delta / 1000);
      }
    }

    // 回血
    if (this.regen > 0) {
      this.regenTimer += delta;
      if (this.regenTimer >= 1000) {
        this.regenTimer -= 1000;
        this.heal(this.regen);
      }
    }

    // 受伤闪烁恢复
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      if (this.hitFlashTimer <= 0) {
        this.setTexture('player');
      }
    }
  }

  takeDamage(amount: number): void {
    // 检查无敌时间
    const now = this.scene.time.now;
    if (now < this.invincibleUntil) {
      return;
    }

    // 计算护甲减伤
    const actualDamage = Math.max(1, Math.floor(amount * (1 - this.armor)));
    this.hp = Math.max(0, this.hp - actualDamage);

    // 设置无敌时间
    this.invincibleUntil = now + GameConfig.PLAYER.INVINCIBLE_TIME;

    // 受伤闪烁效果
    this.hitFlashTimer = this.HIT_FLASH_DURATION;
    this.setTexture('player_hit');
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addExp(amount: number): boolean {
    this.exp += amount;
    if (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level++;
      // 每级经验需求增长
      this.expToNext = Math.floor(
        GameConfig.EXP.BASE_EXP_TO_LEVEL * Math.pow(GameConfig.EXP.EXP_GROWTH, this.level - 1)
      );
      return true; // 升级了
    }
    return false;
  }

  getStats(): PlayerStats {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      speed: this.speed,
      level: this.level,
      exp: this.exp,
      expToNext: this.expToNext,
      pickupRange: this.pickupRange,
      armor: this.armor,
      regen: this.regen,
      critRate: this.critRate,
      critDamage: this.critDamage,
      cooldownReduction: this.cooldownReduction,
      weaponSlots: this.weaponSlots,
    };
  }
}

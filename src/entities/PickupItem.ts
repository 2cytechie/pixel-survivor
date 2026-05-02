import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { distBetween } from '../utils/MathUtils';

export type PickupType = 'exp' | 'gold' | 'health';

export class PickupItem extends Phaser.GameObjects.Sprite {
  public pickupType: PickupType;
  public value: number;

  // 磁吸状态
  private isMagnetized: boolean = false;
  private magnetSpeed: number = GameConfig.EXP.GEM_MAGNET_SPEED;

  constructor(scene: Phaser.Scene, x: number, y: number, pickupType: PickupType, value: number) {
    // 根据类型选择纹理
    const texture = getTextureForType(pickupType);
    super(scene, x, y, texture);

    this.setScale(GameConfig.PIXEL_SCALE);
    scene.add.existing(this);

    this.pickupType = pickupType;
    this.value = value;

    this.setOrigin(0.5, 0.5);
  }

  /**
   * 初始化拾取物属性（从对象池取出后调用）
   */
  init(x: number, y: number, pickupType: PickupType, value: number): void {
    this.setPosition(x, y);
    this.pickupType = pickupType;
    this.value = value;
    this.isMagnetized = false;
    this.setTexture(getTextureForType(pickupType));
    this.setActive(true);
    this.setVisible(true);
  }

  update(_time: number, delta: number, player: Phaser.GameObjects.Sprite, pickupRange: number): boolean {
    const dist = distBetween(this, player);

    // 检查是否在拾取范围内
    if (dist <= pickupRange) {
      this.isMagnetized = true;
    }

    // 磁吸状态：加速飞向玩家
    if (this.isMagnetized) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const speed = this.magnetSpeed * (delta / 1000);
      this.x += Math.cos(angle) * speed;
      this.y += Math.sin(angle) * speed;

      // 磁吸后距离很近时直接拾取
      if (dist < 10) {
        this.onPickedUp(player);
        return true; // 表示已被拾取
      }
    }

    return false;
  }

  private onPickedUp(player: Phaser.GameObjects.Sprite): void {
    // 调用场景的 onPickupCollected 回调
    if ((this.scene as any).onPickupCollected) {
      (this.scene as any).onPickupCollected(this, player);
    }
    this.release();
  }

  /**
   * 回收到对象池
   */
  release(): void {
    this.setActive(false);
    this.setVisible(false);
    if ((this.scene as any).pickupPool) {
      (this.scene as any).pickupPool.release(this);
    }
  }
}

function getTextureForType(type: PickupType): string {
  switch (type) {
    case 'exp':
      return 'pickup_exp';
    case 'gold':
      return 'pickup_gold';
    case 'health':
      return 'pickup_health';
    default:
      return 'pickup_exp';
  }
}

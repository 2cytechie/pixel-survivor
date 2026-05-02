import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';

export type FloatingTextType = 'damage' | 'crit' | 'exp' | 'heal';

export class FloatingText extends Phaser.GameObjects.Text {
  public duration: number;
  public elapsed: number = 0;

  // 上浮速度
  private readonly FLOAT_SPEED: number = -60;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, type: FloatingTextType) {
    const style = getStyleForType(type);
    super(scene, x, y, text, style);

    scene.add.existing(this);

    this.duration = GameConfig.VISUAL.DAMAGE_TEXT_DURATION;
    this.setOrigin(0.5, 0.5);

    // 添加初始偏移，避免多个文字重叠
    this.x += Phaser.Math.Between(-10, 10);
    this.y += Phaser.Math.Between(-5, 5);

    // 设置深度确保文字在最上层
    this.setDepth(1000);
  }

  update(_time: number, delta: number): void {
    this.elapsed += delta;

    // 上浮
    this.y += this.FLOAT_SPEED * (delta / 1000);

    // 淡出
    const progress = this.elapsed / this.duration;
    if (progress > 0.5) {
      const alpha = 1 - (progress - 0.5) / 0.5;
      this.setAlpha(Math.max(0, alpha));
    }

    // 到时间后销毁
    if (this.elapsed >= this.duration) {
      this.destroy();
    }
  }
}

function getStyleForType(type: FloatingTextType): Phaser.Types.GameObjects.Text.TextStyle {
  switch (type) {
    case 'damage':
      return {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 2,
      };
    case 'crit':
      return {
        fontSize: '18px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3,
      };
    case 'exp':
      return {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#4488ff',
        stroke: '#000000',
        strokeThickness: 2,
      };
    case 'heal':
      return {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#44ff44',
        stroke: '#000000',
        strokeThickness: 2,
      };
    default:
      return {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      };
  }
}

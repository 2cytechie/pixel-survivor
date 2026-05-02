import Phaser from 'phaser';
import { PixelAssets } from '../assets/PixelAssets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // 显示加载文字
    const loadingText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      '加载中...',
      {
        fontSize: '16px',
        fontFamily: '"Courier New", monospace',
        color: '#888888',
      }
    ).setOrigin(0.5);

    // 生成所有像素素材
    const assets = new PixelAssets(this);
    assets.generateAll();

    // 加载完成后跳转到主菜单
    this.time.delayedCall(500, () => {
      loadingText.destroy();
      this.scene.start('MenuScene');
    });
  }
}

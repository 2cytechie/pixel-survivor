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

    // 注册动画
    this.createAnimations();

    // 加载完成后跳转到主菜单
    this.time.delayedCall(500, () => {
      loadingText.destroy();
      this.scene.start('MenuScene');
    });
  }

  private createAnimations(): void {
    // ── Player animations ──
    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('player_sheet', { start: 0, end: 0 }),
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('player_sheet', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    // ── Enemy animations ──
    // Slime: bouncy squish
    this.anims.create({
      key: 'slime_move',
      frames: this.anims.generateFrameNumbers('slime_sheet', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });

    // Zombie: shambling walk
    this.anims.create({
      key: 'zombie_move',
      frames: this.anims.generateFrameNumbers('zombie_sheet', { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
    });

    // Ghost: floating bob
    this.anims.create({
      key: 'ghost_move',
      frames: this.anims.generateFrameNumbers('ghost_sheet', { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });

    // Skeleton Mage: robe sway
    this.anims.create({
      key: 'skeleton_mage_move',
      frames: this.anims.generateFrameNumbers('skeleton_mage_sheet', { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });

    // Boss Slime: big squish
    this.anims.create({
      key: 'boss_slime_move',
      frames: this.anims.generateFrameNumbers('boss_slime_sheet', { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });
  }
}

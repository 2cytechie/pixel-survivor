import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private decorations: Phaser.GameObjects.Sprite[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    // 背景
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // 装饰性浮动像素方块
    for (let i = 0; i < 20; i++) {
      const size = Phaser.Math.Between(4, 12);
      const color = Phaser.Math.RND.pick([
        0x4488ff, 0x44ff88, 0xff8844, 0xff44aa, 0xffff44, 0xaa44ff
      ]);
      const g = this.add.graphics();
      g.fillStyle(color, 0.3);
      g.fillRect(0, 0, size, size);
      g.generateTexture(`deco_${i}`, size, size);
      g.destroy();

      const sprite = this.add.sprite(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        `deco_${i}`
      ).setAlpha(0.4);

      this.decorations.push(sprite);
    }

    // 标题
    this.add.text(w / 2, h * 0.25, '像素幸存者', {
      fontSize: '36px',
      fontFamily: '"Courier New", monospace',
      color: '#ffcc44',
      stroke: '#886622',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // 副标题
    this.add.text(w / 2, h * 0.35, 'PIXEL SURVIVOR', {
      fontSize: '14px',
      fontFamily: '"Courier New", monospace',
      color: '#888888',
    }).setOrigin(0.5);

    // 版本号
    this.add.text(w / 2, h * 0.42, 'v1.0', {
      fontSize: '10px',
      fontFamily: '"Courier New", monospace',
      color: '#555555',
    }).setOrigin(0.5);

    // 开始游戏按钮
    this.createButton(w / 2, h * 0.58, '开始游戏', () => {
      this.scene.start('GameScene');
    });

    // 操作说明
    const instructions = [
      'WASD / 方向键 移动',
      '自动攻击敌人',
      '收集经验升级变强',
    ];
    instructions.forEach((text, i) => {
      this.add.text(w / 2, h * 0.72 + i * 20, text, {
        fontSize: '11px',
        fontFamily: '"Courier New", monospace',
        color: '#666666',
      }).setOrigin(0.5);
    });

    // 装饰动画 tween
    this.decorations.forEach((sprite, i) => {
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 30,
        alpha: 0.1,
        duration: 2000 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 100,
      });
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    // 按钮背景
    const bg = this.add.graphics();
    bg.fillStyle(0x334466, 0.9);
    bg.fillRoundedRect(x - 80, y - 16, 160, 32, 6);
    bg.fillStyle(0x446688, 0.7);
    bg.fillRoundedRect(x - 78, y - 14, 156, 28, 4);
    bg.setInteractive(
      new Phaser.Geom.Rectangle(x - 80, y - 16, 160, 32),
      Phaser.Geom.Rectangle.Contains
    );

    const label = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: '"Courier New", monospace',
      color: '#44aaff',
    }).setOrigin(0.5);

    // Hover 效果
    bg.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x446688, 0.9);
      bg.fillRoundedRect(x - 80, y - 16, 160, 32, 6);
      bg.fillStyle(0x5588aa, 0.7);
      bg.fillRoundedRect(x - 78, y - 14, 156, 28, 4);
      label.setColor('#88ccff');
    });

    bg.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x334466, 0.9);
      bg.fillRoundedRect(x - 80, y - 16, 160, 32, 6);
      bg.fillStyle(0x446688, 0.7);
      bg.fillRoundedRect(x - 78, y - 14, 156, 28, 4);
      label.setColor('#44aaff');
    });

    bg.on('pointerdown', callback);
  }
}

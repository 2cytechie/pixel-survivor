import Phaser from 'phaser';
import { formatTime } from '../utils/MathUtils';
import { GameMode, CharacterType, GAME_MODES, CHARACTERS } from '../config/GameData';

interface ResultData {
  won: boolean;
  time: number;
  kills: number;
  level: number;
  gold: number;
  mode?: GameMode;
  character?: CharacterType;
  bossKills?: number;
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  create(data: ResultData): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Title
    const titleColor = data.won ? '#ffcc44' : '#ff4444';
    const titleText = data.won ? '胜 利 !' : '游戏结束';

    this.add.text(w / 2, h * 0.15, titleText, {
      fontSize: '32px',
      fontFamily: '"Courier New", monospace',
      color: titleColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    const subtitle = data.won ? '你成功存活到了最后!' : '你被怪物击败了...';
    this.add.text(w / 2, h * 0.25, subtitle, {
      fontSize: '12px',
      fontFamily: '"Courier New", monospace',
      color: '#888888',
    }).setOrigin(0.5);

    // Mode & Character info
    const modeName = data.mode ? GAME_MODES[data.mode].name : '经典模式';
    const charName = data.character ? CHARACTERS[data.character].name : '战士';
    this.add.text(w / 2, h * 0.30, `${modeName} | ${charName}`, {
      fontSize: '11px',
      fontFamily: '"Courier New", monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Stats panel background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1a1a3e, 0.9);
    panelBg.fillRoundedRect(w / 2 - 120, h * 0.32, 240, 180, 8);
    panelBg.fillStyle(0x2a2a5e, 0.6);
    panelBg.fillRoundedRect(w / 2 - 118, h * 0.32 + 2, 236, 176, 6);

    // Stats
    const stats = [
      { label: '存活时间', value: formatTime(data.time), color: '#ffffff' },
      { label: '击杀数', value: data.kills.toString(), color: '#ff8888' },
      { label: '达到等级', value: `Lv.${data.level}`, color: '#ffcc44' },
      { label: '获得金币', value: data.gold.toString(), color: '#ffcc44' },
      { label: 'BOSS击杀', value: (data.bossKills || 0).toString(), color: '#ff8844' },
    ];

    stats.forEach((stat, i) => {
      const y = h * 0.38 + i * 36;

      this.add.text(w / 2 - 80, y, stat.label, {
        fontSize: '13px',
        fontFamily: '"Courier New", monospace',
        color: '#aaaaaa',
      }).setOrigin(0, 0.5);

      this.add.text(w / 2 + 80, y, stat.value, {
        fontSize: '14px',
        fontFamily: '"Courier New", monospace',
        color: stat.color,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);

      // Separator line
      if (i < stats.length - 1) {
        const line = this.add.graphics();
        line.fillStyle(0x444466, 0.5);
        line.fillRect(w / 2 - 100, y + 18, 200, 1);
      }
    });

    // Buttons
    this.createButton(w / 2, h * 0.72, '再来一局', '#44aaff', () => {
      this.scene.start('GameScene');
    });

    this.createButton(w / 2, h * 0.82, '返回主菜单', '#888888', () => {
      this.scene.start('MenuScene');
    });

    // Decorative particles
    for (let i = 0; i < 10; i++) {
      const color = data.won
        ? Phaser.Math.RND.pick([0xffcc44, 0xffee88, 0xffaa22])
        : Phaser.Math.RND.pick([0xff4444, 0xff8888, 0xcc2222]);

      const g = this.add.graphics();
      g.fillStyle(color, 0.5);
      g.fillRect(0, 0, 4, 4);
      g.generateTexture(`result_deco_${i}`, 4, 4);
      g.destroy();

      const particle = this.add.sprite(
        Phaser.Math.Between(w * 0.2, w * 0.8),
        Phaser.Math.Between(h * 0.1, h * 0.9),
        `result_deco_${i}`
      ).setAlpha(0.3);

      this.tweens.add({
        targets: particle,
        y: particle.y - 40,
        alpha: 0,
        duration: 2000 + i * 300,
        yoyo: true,
        repeat: -1,
        delay: i * 150,
      });
    }
  }

  private createButton(x: number, y: number, text: string, color: string, callback: () => void): void {
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
      fontSize: '14px',
      fontFamily: '"Courier New", monospace',
      color: color,
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x446688, 0.9);
      bg.fillRoundedRect(x - 80, y - 16, 160, 32, 6);
      bg.fillStyle(0x5588aa, 0.7);
      bg.fillRoundedRect(x - 78, y - 14, 156, 28, 4);
    });

    bg.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x334466, 0.9);
      bg.fillRoundedRect(x - 80, y - 16, 160, 32, 6);
      bg.fillStyle(0x446688, 0.7);
      bg.fillRoundedRect(x - 78, y - 14, 156, 28, 4);
    });

    bg.on('pointerdown', callback);
  }
}

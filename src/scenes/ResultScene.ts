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

interface SpacingConfig {
  xl: number;
  l: number;
  m: number;
  s: number;
  xs: number;
}

interface FontConfig {
  h1: number;
  h2: number;
  body: number;
  caption: number;
}

interface ResultUIConfig {
  isDesktop: boolean;
  spacing: SpacingConfig;
  font: FontConfig;
  btnWidth: number;
  btnHeight: number;
  panelWidth: number;
  panelHeight: number;
}

const COLORS = {
  title: '#ffcc44',
  subtitle: '#ffffff',
  body: '#aaaaaa',
  caption: '#888888',
  btnPrimary: '#44aaff',
  btnSecondary: '#888888',
  panelBg: 0x1a1a3e,
  panelBgInner: 0x2a2a5e,
  separator: 0x444466,
} as const;

export class ResultScene extends Phaser.Scene {
  private cfg!: ResultUIConfig;

  constructor() {
    super({ key: 'ResultScene' });
  }

  private initConfig(): void {
    const isDesktop = this.sys.game.device.os.desktop;
    this.cfg = {
      isDesktop,
      spacing: {
        xl: isDesktop ? 40 : 30,
        l: isDesktop ? 30 : 20,
        m: isDesktop ? 20 : 16,
        s: isDesktop ? 12 : 8,
        xs: isDesktop ? 6 : 4,
      },
      font: {
        h1: isDesktop ? 40 : 30,
        h2: isDesktop ? 24 : 18,
        body: isDesktop ? 14 : 11,
        caption: isDesktop ? 12 : 10,
      },
      btnWidth: isDesktop ? 200 : 160,
      btnHeight: isDesktop ? 40 : 34,
      panelWidth: isDesktop ? 320 : 260,
      panelHeight: isDesktop ? 220 : 190,
    };
  }

  create(data: ResultData): void {
    this.initConfig();
    const w = this.scale.width;
    const h = this.scale.height;
    const c = this.cfg;

    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Title
    const titleColor = data.won ? COLORS.title : '#ff4444';
    const titleText = data.won ? '胜 利 !' : '游戏结束';

    // Calculate total content height for vertical centering
    // H1 title + S gap + subtitle + S gap + info + XL gap + panel + XL gap + button1 + L gap + button2
    const titleBlockH = c.font.h1 + c.spacing.s + c.font.caption + c.spacing.s + c.font.caption;
    const btnBlockH = c.btnHeight + c.spacing.l + c.btnHeight;
    const totalContentH = titleBlockH + c.spacing.xl + c.panelHeight + c.spacing.xl + btnBlockH;
    const contentTop = (h - totalContentH) / 2;

    // Title
    const titleY = contentTop + c.font.h1 / 2;
    this.add.text(w / 2, titleY, titleText, {
      fontSize: `${c.font.h1}px`,
      fontFamily: '"Courier New", monospace',
      color: titleColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    const subtitle = data.won ? '你成功存活到了最后!' : '你被怪物击败了...';
    const subtitleY = titleY + c.font.h1 / 2 + c.spacing.s + c.font.caption / 2;
    this.add.text(w / 2, subtitleY, subtitle, {
      fontSize: `${c.font.caption}px`,
      fontFamily: '"Courier New", monospace',
      color: COLORS.caption,
    }).setOrigin(0.5);

    // Mode & Character info
    const modeName = data.mode ? GAME_MODES[data.mode].name : '经典模式';
    const charName = data.character ? CHARACTERS[data.character].name : '战士';
    const infoY = subtitleY + c.font.caption / 2 + c.spacing.s + c.font.caption / 2;
    this.add.text(w / 2, infoY, `${modeName} | ${charName}`, {
      fontSize: `${c.font.caption}px`,
      fontFamily: '"Courier New", monospace',
      color: COLORS.body,
    }).setOrigin(0.5);

    // Stats panel background
    const panelTop = contentTop + titleBlockH + c.spacing.xl;
    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.panelBg, 0.9);
    panelBg.fillRoundedRect(w / 2 - c.panelWidth / 2, panelTop, c.panelWidth, c.panelHeight, 8);
    panelBg.fillStyle(COLORS.panelBgInner, 0.6);
    panelBg.fillRoundedRect(w / 2 - c.panelWidth / 2 + 2, panelTop + 2, c.panelWidth - 4, c.panelHeight - 4, 6);

    // Stats
    const stats = [
      { label: '存活时间', value: formatTime(data.time), color: COLORS.subtitle },
      { label: '击杀数', value: data.kills.toString(), color: '#ff8888' },
      { label: '达到等级', value: `Lv.${data.level}`, color: COLORS.title },
      { label: '获得金币', value: data.gold.toString(), color: COLORS.title },
      { label: 'BOSS击杀', value: (data.bossKills || 0).toString(), color: '#ff8844' },
    ];

    const statStartY = panelTop + c.spacing.m;
    const statGap = (c.panelHeight - c.spacing.m * 2) / stats.length;

    stats.forEach((stat, i) => {
      const y = statStartY + i * statGap + statGap / 2;

      this.add.text(w / 2 - c.panelWidth / 2 + c.spacing.m, y, stat.label, {
        fontSize: `${c.font.body}px`,
        fontFamily: '"Courier New", monospace',
        color: COLORS.body,
      }).setOrigin(0, 0.5);

      this.add.text(w / 2 + c.panelWidth / 2 - c.spacing.m, y, stat.value, {
        fontSize: `${c.font.body}px`,
        fontFamily: '"Courier New", monospace',
        color: stat.color,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);

      // Separator line
      if (i < stats.length - 1) {
        const line = this.add.graphics();
        line.fillStyle(COLORS.separator, 0.5);
        line.fillRect(w / 2 - c.panelWidth / 2 + c.spacing.m, y + statGap / 2, c.panelWidth - c.spacing.m * 2, 1);
      }
    });

    // Buttons
    const btn1Y = panelTop + c.panelHeight + c.spacing.xl + c.btnHeight / 2;
    const btn2Y = btn1Y + c.btnHeight / 2 + c.spacing.l + c.btnHeight / 2;
    this.createButton(w / 2, btn1Y, '再来一局', COLORS.btnPrimary, () => {
      this.scene.start('GameScene');
    });

    this.createButton(w / 2, btn2Y, '返回主菜单', COLORS.btnSecondary, () => {
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
    const c = this.cfg;
    const bw = c.btnWidth;
    const bh = c.btnHeight;
    const bg = this.add.graphics();
    bg.fillStyle(0x334466, 0.9);
    bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 6);
    bg.fillStyle(0x446688, 0.7);
    bg.fillRoundedRect(x - bw / 2 + 2, y - bh / 2 + 2, bw - 4, bh - 4, 4);
    bg.setInteractive(
      new Phaser.Geom.Rectangle(x - bw / 2, y - bh / 2, bw, bh),
      Phaser.Geom.Rectangle.Contains
    );

    const label = this.add.text(x, y, text, {
      fontSize: `${c.font.body}px`,
      fontFamily: '"Courier New", monospace',
      color: color,
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x446688, 0.9);
      bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 6);
      bg.fillStyle(0x5588aa, 0.7);
      bg.fillRoundedRect(x - bw / 2 + 2, y - bh / 2 + 2, bw - 4, bh - 4, 4);
    });

    bg.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x334466, 0.9);
      bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 6);
      bg.fillStyle(0x446688, 0.7);
      bg.fillRoundedRect(x - bw / 2 + 2, y - bh / 2 + 2, bw - 4, bh - 4, 4);
    });

    bg.on('pointerdown', callback);
  }
}

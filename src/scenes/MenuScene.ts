import Phaser from 'phaser';
import {
  GameMode, GameModeData, GAME_MODES, GAME_MODE_TYPES,
  CharacterType, CharacterData, CHARACTERS, CHARACTER_TYPES,
  ACHIEVEMENTS,
} from '../config/GameData';
import { AchievementManager } from '../systems/AchievementManager';

// ─── UI Config ───────────────────────────────────────────
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
  h3: number;
  body: number;
  caption: number;
}

interface UIConfig {
  isDesktop: boolean;
  spacing: SpacingConfig;
  font: FontConfig;
  btnWidth: number;
  btnHeight: number;
  modeCardW: number;
  modeCardH: number;
  charCardW: number;
  charCardH: number;
  cardGap: number;
  previewScale: number;
}

// ─── Colors ──────────────────────────────────────────────
const COLORS = {
  title: '#ffcc44',
  subtitle: '#ffffff',
  body: '#aaaaaa',
  caption: '#888888',
  btnPrimary: 0x44aaff,
  btnSecondary: 0x888888,
  btnAccent: 0x44ff44,
  cardBg: 0x1a1a3e,
  cardBgSelected: 0x3a3a7e,
  panelBg: 0x2a2a5e,
} as const;

export class MenuScene extends Phaser.Scene {
  private decorations: Phaser.GameObjects.Sprite[] = [];
  private achievementMgr: AchievementManager = new AchievementManager();

  // UI state
  private currentScreen: 'main' | 'mode_select' | 'char_select' | 'achievements' = 'main';
  private selectedMode: GameMode = 'classic';
  private selectedChar: CharacterType = 'warrior';

  // UI containers (arrays of GameObjects for cleanup)
  private uiElements: Phaser.GameObjects.GameObject[] = [];

  // UI Config
  private cfg!: UIConfig;

  constructor() {
    super({ key: 'MenuScene' });
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
        h3: isDesktop ? 16 : 13,
        body: isDesktop ? 14 : 11,
        caption: isDesktop ? 12 : 10,
      },
      btnWidth: isDesktop ? 200 : 160,
      btnHeight: isDesktop ? 40 : 34,
      modeCardW: isDesktop ? 180 : 130,
      modeCardH: isDesktop ? 120 : 100,
      charCardW: isDesktop ? 220 : 160,
      charCardH: isDesktop ? 200 : 170,
      cardGap: isDesktop ? 20 : 12,
      previewScale: isDesktop ? 3 : 2.2,
    };
  }

  create(): void {
    this.achievementMgr.load();
    this.currentScreen = 'main';
    this.selectedMode = 'classic';
    this.selectedChar = 'warrior';
    this.initConfig();

    const w = this.scale.width;
    const h = this.scale.height;
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Decorative floating pixels
    this.decorations = [];
    for (let i = 0; i < 20; i++) {
      const size = Phaser.Math.Between(4, 12);
      const color = Phaser.Math.RND.pick([0x4488ff, 0x44ff88, 0xff8844, 0xff44aa, 0xffff44, 0xaa44ff]);
      const g = this.add.graphics();
      g.fillStyle(color, 0.3);
      g.fillRect(0, 0, size, size);
      g.generateTexture(`deco_${i}`, size, size);
      g.destroy();
      const sprite = this.add.sprite(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), `deco_${i}`).setAlpha(0.4);
      this.decorations.push(sprite);
      this.tweens.add({
        targets: sprite, y: sprite.y - 30, alpha: 0.1,
        duration: 2000 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 100,
      });
    }

    this.showMainScreen();
  }

  // ─── Clear UI ────────────────────────────────────────────
  private clearUI(): void {
    for (const el of this.uiElements) {
      el.destroy();
    }
    this.uiElements = [];
  }

  // ─── Main Screen ─────────────────────────────────────────
  private showMainScreen(): void {
    this.clearUI();
    this.currentScreen = 'main';
    const w = this.scale.width;
    const h = this.scale.height;
    const c = this.cfg;

    // Calculate total content height for vertical centering
    // Title + subtitle + XL gap + button1 + L gap + button2 + L gap + records
    const titleBlockH = c.font.h1 + c.spacing.s + c.font.caption;
    const btnBlockH = c.btnHeight + c.spacing.l + c.btnHeight;
    const recordsH = c.font.caption;
    const totalContentH = titleBlockH + c.spacing.xl + btnBlockH + c.spacing.l + recordsH;
    const contentTop = (h - totalContentH) / 2;

    // Title
    const titleY = contentTop + c.font.h1 / 2;
    this.addText(w / 2, titleY, '像素幸存者', COLORS.title, c.font.h1)
      .setOrigin(0.5)
      .setDepth(10)
      .setStroke('#886622', 4);

    // Subtitle
    const subtitleY = contentTop + c.font.h1 + c.spacing.s + c.font.caption / 2;
    this.addText(w / 2, subtitleY, 'PIXEL SURVIVOR', COLORS.caption, c.font.caption)
      .setOrigin(0.5)
      .setDepth(10);

    // Buttons
    const btn1Y = contentTop + titleBlockH + c.spacing.xl + c.btnHeight / 2;
    const btn2Y = btn1Y + c.btnHeight / 2 + c.spacing.l + c.btnHeight / 2;
    this.createButton(w / 2, btn1Y, '开始游戏', COLORS.btnPrimary, () => this.showModeSelect());
    this.createButton(w / 2, btn2Y, '成就 [' + this.achievementMgr.getUnlockedCount() + '/' + this.achievementMgr.getTotalCount() + ']', COLORS.title, () => this.showAchievements());

    // Best records
    const rec = this.achievementMgr.getRecords();
    const recordsY = btn2Y + c.btnHeight / 2 + c.spacing.l + recordsH / 2;
    this.addText(w / 2, recordsY, `最高存活: ${this.fmtTime(rec.bestTime)}  |  最多击杀: ${rec.bestKills}  |  最高等级: Lv.${rec.bestLevel}`, COLORS.caption, c.font.caption)
      .setOrigin(0.5);
  }

  // ─── Mode Select ─────────────────────────────────────────
  private showModeSelect(): void {
    this.clearUI();
    this.currentScreen = 'mode_select';
    const w = this.scale.width;
    const h = this.scale.height;
    const c = this.cfg;

    const modes = GAME_MODE_TYPES;
    const cardW = c.modeCardW;
    const cardH = c.modeCardH;
    const totalCardsW = modes.length * cardW + (modes.length - 1) * c.cardGap;
    const startX = (w - totalCardsW) / 2 + cardW / 2;

    // Calculate total content height for vertical centering
    // H2 title + XL gap + cards + XL gap + button1 + L gap + button2
    const titleBlockH = c.font.h2;
    const btnBlockH = c.btnHeight + c.spacing.l + c.btnHeight;
    const totalContentH = titleBlockH + c.spacing.xl + cardH + c.spacing.xl + btnBlockH;
    const contentTop = (h - totalContentH) / 2;

    // Title
    const titleY = contentTop + c.font.h2 / 2;
    this.addText(w / 2, titleY, '选择模式', COLORS.subtitle, c.font.h2).setOrigin(0.5);

    // Cards
    const cardY = contentTop + titleBlockH + c.spacing.xl + cardH / 2;

    modes.forEach((modeKey, i) => {
      const mode = GAME_MODES[modeKey];
      const cx = startX + i * (cardW + c.cardGap);
      const cy = cardY;
      const isSelected = modeKey === this.selectedMode;

      // Card bg
      const bg = this.add.graphics().setDepth(20);
      bg.fillStyle(isSelected ? COLORS.cardBgSelected : COLORS.cardBg, 0.95);
      bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      if (isSelected) {
        bg.lineStyle(2, mode.iconColor, 0.8);
        bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      }
      this.uiElements.push(bg);

      // Card content from top
      const contentTopY = cy - cardH / 2;
      let currentY = contentTopY + c.spacing.s;

      // Mode name (H3)
      this.addText(cx, currentY + c.font.h3 / 2, mode.name, '#' + mode.iconColor.toString(16).padStart(6, '0'), c.font.h3)
        .setOrigin(0.5);
      currentY += c.font.h3 + c.spacing.s;

      // Description
      this.addText(cx, currentY + c.font.caption / 2, mode.description, COLORS.body, c.font.caption)
        .setOrigin(0.5);
      currentY += c.font.caption + c.spacing.s;

      // Time limit
      const timeStr = mode.timeLimit > 0 ? this.fmtTime(mode.timeLimit) : '无限';
      this.addText(cx, currentY + c.font.caption / 2, `时间: ${timeStr}`, COLORS.caption, c.font.caption)
        .setOrigin(0.5);
      currentY += c.font.caption + c.spacing.xs;

      // Difficulty
      const diffStr = mode.enemyHpMult > 1 ? `难度: x${mode.enemyHpMult}` : '难度: 普通';
      this.addText(cx, currentY + c.font.caption / 2, diffStr, COLORS.caption, c.font.caption)
        .setOrigin(0.5);

      // Click area
      const hitArea = this.add.rectangle(cx, cy, cardW, cardH, 0xffffff, 0.01)
        .setInteractive({ useHandCursor: true }).setDepth(21);
      hitArea.on('pointerdown', () => {
        this.selectedMode = modeKey;
        this.showModeSelect();
      });
      this.uiElements.push(hitArea);
    });

    // Buttons
    const btn1Y = cardY + cardH / 2 + c.spacing.xl + c.btnHeight / 2;
    const btn2Y = btn1Y + c.btnHeight / 2 + c.spacing.l + c.btnHeight / 2;
    this.createButton(w / 2, btn1Y, '选择角色 →', COLORS.btnPrimary, () => this.showCharSelect());
    this.createButton(w / 2, btn2Y, '← 返回', COLORS.btnSecondary, () => this.showMainScreen());
  }

  // ─── Character Select ────────────────────────────────────
  private showCharSelect(): void {
    this.clearUI();
    this.currentScreen = 'char_select';
    const w = this.scale.width;
    const h = this.scale.height;
    const c = this.cfg;

    const chars = CHARACTER_TYPES;
    const cardW = c.charCardW;
    const cardH = c.charCardH;
    const totalCardsW = chars.length * cardW + (chars.length - 1) * c.cardGap;
    const startX = (w - totalCardsW) / 2 + cardW / 2;

    // Calculate total content height
    const titleBlockH = c.font.h2;
    const btnBlockH = c.btnHeight + c.spacing.l + c.btnHeight;
    const totalContentH = titleBlockH + c.spacing.xl + cardH + c.spacing.xl + btnBlockH;
    const contentTop = (h - totalContentH) / 2;

    // Title
    const titleY = contentTop + c.font.h2 / 2;
    this.addText(w / 2, titleY, '选择角色', COLORS.subtitle, c.font.h2).setOrigin(0.5);

    // Cards
    const cardY = contentTop + titleBlockH + c.spacing.xl + cardH / 2;

    chars.forEach((charKey, i) => {
      const char = CHARACTERS[charKey];
      const cx = startX + i * (cardW + c.cardGap);
      const cy = cardY;
      const isSelected = charKey === this.selectedChar;

      // Card bg
      const bg = this.add.graphics().setDepth(20);
      bg.fillStyle(isSelected ? COLORS.cardBgSelected : COLORS.cardBg, 0.95);
      bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      if (isSelected) {
        bg.lineStyle(2, char.iconColor, 0.8);
        bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      }
      this.uiElements.push(bg);

      // Card content from top
      const contentTopY = cy - cardH / 2;
      let currentY = contentTopY + c.spacing.s;

      // Character preview sprite
      const preview = this.add.sprite(cx, currentY + 24, 'player_sheet', 0).setDepth(21).setScale(c.previewScale);
      preview.setTint(char.bodyColor);
      this.uiElements.push(preview);
      currentY += 48 + c.spacing.s;

      // Name (H3)
      this.addText(cx, currentY + c.font.h3 / 2, char.name, '#' + char.iconColor.toString(16).padStart(6, '0'), c.font.h3)
        .setOrigin(0.5);
      currentY += c.font.h3 + c.spacing.xs;

      // Description
      this.addText(cx, currentY + c.font.caption / 2, char.description, COLORS.body, c.font.caption)
        .setOrigin(0.5);
      currentY += c.font.caption + c.spacing.s;

      // Stats
      this.addText(cx, currentY + c.font.caption / 2, `HP:${char.maxHp}  速度:${char.speed}`, COLORS.caption, c.font.caption)
        .setOrigin(0.5);
      currentY += c.font.caption + c.spacing.xs;

      this.addText(cx, currentY + c.font.caption / 2, `护甲:${Math.floor(char.armor * 100)}%  暴击:${Math.floor(char.critRate * 100)}%`, COLORS.caption, c.font.caption)
        .setOrigin(0.5);
      currentY += c.font.caption + c.spacing.xs;

      // Weapon
      const weaponNames: Record<string, string> = { spinning_blade: '旋转飞刀', energy_bullet: '能量弹', lightning_chain: '闪电链', fire_bottle: '火焰瓶' };
      this.addText(cx, currentY + c.font.caption / 2, `初始武器: ${weaponNames[char.startWeapon] || char.startWeapon}`, '#88ccff', c.font.caption)
        .setOrigin(0.5);

      // Click area
      const hitArea = this.add.rectangle(cx, cy, cardW, cardH, 0xffffff, 0.01)
        .setInteractive({ useHandCursor: true }).setDepth(22);
      hitArea.on('pointerdown', () => {
        this.selectedChar = charKey;
        this.showCharSelect();
      });
      this.uiElements.push(hitArea);
    });

    // Buttons
    const btn1Y = cardY + cardH / 2 + c.spacing.xl + c.btnHeight / 2;
    const btn2Y = btn1Y + c.btnHeight / 2 + c.spacing.l + c.btnHeight / 2;
    const modeName = GAME_MODES[this.selectedMode].name;
    this.createButton(w / 2, btn1Y, `开始! (${modeName})`, COLORS.btnAccent, () => this.startGame());
    this.createButton(w / 2, btn2Y, '← 返回', COLORS.btnSecondary, () => this.showModeSelect());
  }

  // ─── Achievements Screen ─────────────────────────────────
  private showAchievements(): void {
    this.clearUI();
    this.currentScreen = 'achievements';
    const w = this.scale.width;
    const h = this.scale.height;
    const c = this.cfg;

    const count = this.achievementMgr.getUnlockedCount();
    const total = this.achievementMgr.getTotalCount();

    // Calculate list height
    const achs = this.achievementMgr.getUnlockedCount() > 0
      ? this.achievementMgr.getAllUnlocked()
      : [];
    const maxShow = Math.min(achs.length, 6);
    const listItemH = c.font.body + c.spacing.s;
    const listH = achs.length === 0
      ? c.font.body * 2 + c.spacing.m
      : maxShow * listItemH + (achs.length > maxShow ? c.font.caption + c.spacing.s : 0);

    // Calculate total content height
    const titleBlockH = c.font.h2 + c.spacing.xs + c.font.caption;
    const btnBlockH = c.btnHeight;
    const totalContentH = titleBlockH + c.spacing.xl + listH + c.spacing.xl + btnBlockH;
    const contentTop = (h - totalContentH) / 2;

    // Title
    const titleY = contentTop + c.font.h2 / 2;
    this.addText(w / 2, titleY, '成就', COLORS.title, c.font.h2).setOrigin(0.5);

    // Counter
    const counterY = titleY + c.font.h2 / 2 + c.spacing.xs + c.font.caption / 2;
    this.addText(w / 2, counterY, `${count} / ${total}`, COLORS.body, c.font.caption).setOrigin(0.5);

    // List
    const listTop = contentTop + titleBlockH + c.spacing.xl;

    if (achs.length === 0) {
      this.addText(w / 2, listTop + c.font.body, '还没有解锁任何成就', COLORS.caption, c.font.body).setOrigin(0.5);
      this.addText(w / 2, listTop + c.font.body * 2 + c.spacing.m, '去游戏中挑战吧!', COLORS.caption, c.font.body).setOrigin(0.5);
    } else {
      for (let i = 0; i < maxShow; i++) {
        const achData = ACHIEVEMENTS.find(a => a.id === achs[i].id);
        if (!achData) continue;
        const y = listTop + i * listItemH + c.font.body / 2;
        this.addText(w / 2 - 120, y, '★', '#' + achData.iconColor.toString(16).padStart(6, '0'), c.font.h3)
          .setOrigin(0.5);
        this.addText(w / 2 - 100, y, achData.name, COLORS.subtitle, c.font.body)
          .setOrigin(0, 0.5);
        this.addText(w / 2 + 120, y, achData.description, COLORS.caption, c.font.caption)
          .setOrigin(1, 0.5);
      }
      if (achs.length > maxShow) {
        const moreY = listTop + maxShow * listItemH + c.font.caption / 2;
        this.addText(w / 2, moreY, `...还有 ${achs.length - maxShow} 个成就`, COLORS.caption, c.font.caption)
          .setOrigin(0.5);
      }
    }

    // Back button
    const btnY = contentTop + titleBlockH + c.spacing.xl + listH + c.spacing.xl + c.btnHeight / 2;
    this.createButton(w / 2, btnY, '← 返回', COLORS.btnSecondary, () => this.showMainScreen());
  }

  // ─── Start Game ──────────────────────────────────────────
  private startGame(): void {
    this.scene.start('GameScene', {
      mode: this.selectedMode,
      character: this.selectedChar,
    });
  }

  // ─── UI Helpers ──────────────────────────────────────────
  private addText(x: number, y: number, text: string, color: string, size: number): Phaser.GameObjects.Text {
    const t = this.add.text(x, y, text, {
      fontSize: `${size}px`, fontFamily: '"Courier New", monospace', color,
    }).setDepth(20);
    this.uiElements.push(t);
    return t;
  }

  private createButton(x: number, y: number, text: string, color: number | string, callback: () => void): void {
    const c = this.cfg;
    const colorStr = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color;
    const bw = c.btnWidth;
    const bh = c.btnHeight;

    const bg = this.add.graphics().setDepth(20);
    bg.fillStyle(0x334466, 0.9);
    bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 6);
    bg.fillStyle(0x446688, 0.7);
    bg.fillRoundedRect(x - bw / 2 + 2, y - bh / 2 + 2, bw - 4, bh - 4, 4);
    this.uiElements.push(bg);

    const label = this.add.text(x, y, text, {
      fontSize: `${c.font.body}px`, fontFamily: '"Courier New", monospace', color: colorStr,
    }).setOrigin(0.5).setDepth(21);
    this.uiElements.push(label);

    const hitArea = this.add.rectangle(x, y, bw, bh, 0xffffff, 0)
      .setInteractive({ useHandCursor: true }).setDepth(22);
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x446688, 0.9);
      bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 6);
      bg.fillStyle(0x5588aa, 0.7);
      bg.fillRoundedRect(x - bw / 2 + 2, y - bh / 2 + 2, bw - 4, bh - 4, 4);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x334466, 0.9);
      bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 6);
      bg.fillStyle(0x446688, 0.7);
      bg.fillRoundedRect(x - bw / 2 + 2, y - bh / 2 + 2, bw - 4, bh - 4, 4);
    });
    hitArea.on('pointerdown', callback);
    this.uiElements.push(hitArea);
  }

  private fmtTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

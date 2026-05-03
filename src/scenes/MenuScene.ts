import Phaser from 'phaser';
import {
  GameMode, GameModeData, GAME_MODES, GAME_MODE_TYPES,
  CharacterType, CharacterData, CHARACTERS, CHARACTER_TYPES,
  ACHIEVEMENTS,
} from '../config/GameData';
import { AchievementManager } from '../systems/AchievementManager';

export class MenuScene extends Phaser.Scene {
  private decorations: Phaser.GameObjects.Sprite[] = [];
  private achievementMgr: AchievementManager = new AchievementManager();

  // UI state
  private currentScreen: 'main' | 'mode_select' | 'char_select' | 'achievements' = 'main';
  private selectedMode: GameMode = 'classic';
  private selectedChar: CharacterType = 'warrior';

  // UI containers (arrays of GameObjects for cleanup)
  private uiElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.achievementMgr.load();
    this.currentScreen = 'main';
    this.selectedMode = 'classic';
    this.selectedChar = 'warrior';

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

    // Title (always visible)
    this.add.text(w / 2, 35, '像素幸存者', {
      fontSize: '32px', fontFamily: '"Courier New", monospace', color: '#ffcc44',
      stroke: '#886622', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(w / 2, 62, 'PIXEL SURVIVOR', {
      fontSize: '12px', fontFamily: '"Courier New", monospace', color: '#888888',
    }).setOrigin(0.5).setDepth(10);

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

    const startY = 110;
    const btnGap = 55;

    this.createMenuButton(w / 2, startY, '开始游戏', 0x44aaff, () => this.showModeSelect());
    this.createMenuButton(w / 2, startY + btnGap, '成就 [' + this.achievementMgr.getUnlockedCount() + '/' + this.achievementMgr.getTotalCount() + ']', 0xffcc44, () => this.showAchievements());

    // Best records
    const rec = this.achievementMgr.getRecords();
    const recordsY = startY + btnGap * 2 + 20;
    this.addText(w / 2, recordsY, `最高存活: ${this.fmtTime(rec.bestTime)}  |  最多击杀: ${rec.bestKills}  |  最高等级: Lv.${rec.bestLevel}`, '#666666', 10).setOrigin(0.5);
  }

  // ─── Mode Select ─────────────────────────────────────────
  private showModeSelect(): void {
    this.clearUI();
    this.currentScreen = 'mode_select';
    const w = this.scale.width;
    const h = this.scale.height;

    this.addText(w / 2, 95, '选择模式', '#ffffff', 18);

    const modes = GAME_MODE_TYPES;
    const cardW = 160;
    const cardH = 100;
    const gap = 15;
    const totalW = modes.length * cardW + (modes.length - 1) * gap;
    const startX = (w - totalW) / 2 + cardW / 2;
    const cardY = 170;

    modes.forEach((modeKey, i) => {
      const mode = GAME_MODES[modeKey];
      const cx = startX + i * (cardW + gap);
      const cy = cardY;
      const isSelected = modeKey === this.selectedMode;

      // Card bg
      const bg = this.add.graphics().setDepth(20);
      bg.fillStyle(isSelected ? 0x3a3a7e : 0x1a1a3e, 0.95);
      bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      if (isSelected) {
        bg.lineStyle(2, mode.iconColor, 0.8);
        bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      }
      this.uiElements.push(bg);

      // Mode name
      this.addText(cx, cy - 30, mode.name, '#' + mode.iconColor.toString(16).padStart(6, '0'), 13);
      // Description
      this.addText(cx, cy - 8, mode.description, '#aaaaaa', 9);
      // Time limit
      const timeStr = mode.timeLimit > 0 ? this.fmtTime(mode.timeLimit) : '无限';
      this.addText(cx, cy + 15, `时间: ${timeStr}`, '#888888', 9);
      // Difficulty hint
      const diffStr = mode.enemyHpMult > 1 ? `难度: x${mode.enemyHpMult}` : '难度: 普通';
      this.addText(cx, cy + 30, diffStr, '#888888', 9);

      // Click area
      const hitArea = this.add.rectangle(cx, cy, cardW, cardH, 0xffffff, 0.01)
        .setInteractive({ useHandCursor: true }).setDepth(21);
      hitArea.on('pointerdown', () => {
        this.selectedMode = modeKey;
        this.showModeSelect();
      });
      this.uiElements.push(hitArea);
    });

    // Confirm button
    this.createMenuButton(w / 2, 290, '选择角色 →', 0x44aaff, () => this.showCharSelect());
    // Back button
    this.createMenuButton(w / 2, 340, '← 返回', 0x888888, () => this.showMainScreen());
  }

  // ─── Character Select ────────────────────────────────────
  private showCharSelect(): void {
    this.clearUI();
    this.currentScreen = 'char_select';
    const w = this.scale.width;
    const h = this.scale.height;

    this.addText(w / 2, 95, '选择角色', '#ffffff', 18);

    const chars = CHARACTER_TYPES;
    const cardW = 200;
    const cardH = 150;
    const gap = 20;
    const totalW = chars.length * cardW + (chars.length - 1) * gap;
    const startX = (w - totalW) / 2 + cardW / 2;
    const cardY = 195;

    chars.forEach((charKey, i) => {
      const char = CHARACTERS[charKey];
      const cx = startX + i * (cardW + gap);
      const cy = cardY;
      const isSelected = charKey === this.selectedChar;

      // Card bg
      const bg = this.add.graphics().setDepth(20);
      bg.fillStyle(isSelected ? 0x3a3a7e : 0x1a1a3e, 0.95);
      bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      if (isSelected) {
        bg.lineStyle(2, char.iconColor, 0.8);
        bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      }
      this.uiElements.push(bg);

      // Character icon (colored square)
      const icon = this.add.graphics().setDepth(21);
      icon.fillStyle(char.iconColor, 0.8);
      icon.fillRoundedRect(cx - 15, cy - 55, 30, 30, 4);
      this.uiElements.push(icon);

      // Name
      this.addText(cx, cy - 15, char.name, '#' + char.iconColor.toString(16).padStart(6, '0'), 14);
      // Description
      this.addText(cx, cy + 5, char.description, '#aaaaaa', 9);
      // Stats
      this.addText(cx, cy + 25, `HP:${char.maxHp}  速度:${char.speed}`, '#888888', 9);
      this.addText(cx, cy + 40, `护甲:${Math.floor(char.armor * 100)}%  暴击:${Math.floor(char.critRate * 100)}%`, '#888888', 9);
      // Weapon
      const weaponNames: Record<string, string> = { spinning_blade: '旋转飞刀', energy_bullet: '能量弹', lightning_chain: '闪电链', fire_bottle: '火焰瓶' };
      this.addText(cx, cy + 55, `初始武器: ${weaponNames[char.startWeapon] || char.startWeapon}`, '#88ccff', 9);

      // Click area
      const hitArea = this.add.rectangle(cx, cy, cardW, cardH, 0xffffff, 0.01)
        .setInteractive({ useHandCursor: true }).setDepth(22);
      hitArea.on('pointerdown', () => {
        this.selectedChar = charKey;
        this.showCharSelect();
      });
      this.uiElements.push(hitArea);
    });

    // Start button
    const modeName = GAME_MODES[this.selectedMode].name;
    this.createMenuButton(w / 2, 310, `开始! (${modeName})`, 0x44ff44, () => this.startGame());
    // Back button
    this.createMenuButton(w / 2, 360, '← 返回', 0x888888, () => this.showModeSelect());
  }

  // ─── Achievements Screen ─────────────────────────────────
  private showAchievements(): void {
    this.clearUI();
    this.currentScreen = 'achievements';
    const w = this.scale.width;
    const h = this.scale.height;

    this.addText(w / 2, 95, '成就', '#ffcc44', 18);

    const count = this.achievementMgr.getUnlockedCount();
    const total = this.achievementMgr.getTotalCount();
    this.addText(w / 2, 118, `${count} / ${total}`, '#aaaaaa', 12);

    // Achievement list (scrollable area)
    const listY = 145;
    const achs = this.achievementMgr.getUnlockedCount() > 0
      ? this.achievementMgr.getAllUnlocked()
      : [];

    if (achs.length === 0) {
      this.addText(w / 2, listY + 60, '还没有解锁任何成就', '#666666', 11);
      this.addText(w / 2, listY + 80, '去游戏中挑战吧!', '#666666', 11);
    } else {
      // Show unlocked achievements
      const maxShow = Math.min(achs.length, 6);
      for (let i = 0; i < maxShow; i++) {
        const achData = ACHIEVEMENTS.find(a => a.id === achs[i].id);
        if (!achData) continue;
        const y = listY + 10 + i * 28;
        this.addText(w / 2 - 120, y, '★', '#' + achData.iconColor.toString(16).padStart(6, '0'), 14);
        this.addText(w / 2 - 100, y, achData.name, '#ffffff', 11);
        this.addText(w / 2 + 120, y, achData.description, '#888888', 9).setOrigin(1, 0);
      }
      if (achs.length > maxShow) {
        this.addText(w / 2, listY + 10 + maxShow * 28 + 10, `...还有 ${achs.length - maxShow} 个成就`, '#666666', 10);
      }
    }

    // Back button
    this.createMenuButton(w / 2, 370, '← 返回', 0x888888, () => this.showMainScreen());
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

  private createMenuButton(x: number, y: number, text: string, color: number | string, callback: () => void): void {
    const colorStr = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color;
    const bg = this.add.graphics().setDepth(20);
    const bw = 180;
    const bh = 32;
    bg.fillStyle(0x334466, 0.9);
    bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 6);
    bg.fillStyle(0x446688, 0.7);
    bg.fillRoundedRect(x - bw / 2 + 2, y - bh / 2 + 2, bw - 4, bh - 4, 4);
    this.uiElements.push(bg);

    const label = this.add.text(x, y, text, {
      fontSize: '14px', fontFamily: '"Courier New", monospace', color: colorStr,
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

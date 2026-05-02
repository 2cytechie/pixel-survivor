import Phaser from 'phaser';

/**
 * Procedurally generates all pixel art textures at runtime.
 * No external sprite files needed.
 */
export class PixelAssets {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateAll(): void {
    this.generatePlayer();
    this.generateEnemies();
    this.generateProjectiles();
    this.generatePickups();
    this.generateEffects();
    this.generateUI();
    this.generateBackground();
  }

  private gen(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
    const g = this.scene.add.graphics();
    g.setVisible(false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ─── Player ────────────────────────────────────────────
  private generatePlayer(): void {
    this.gen('player', 16, 16, g => {
      g.fillStyle(0x888888); g.fillRect(4, 1, 8, 3); g.fillRect(3, 3, 10, 1);
      g.fillStyle(0xffcc88); g.fillRect(5, 2, 6, 4);
      g.fillStyle(0x222222); g.fillRect(6, 3, 1, 1); g.fillRect(9, 3, 1, 1);
      g.fillStyle(0x4488cc); g.fillRect(4, 4, 8, 8);
      g.fillStyle(0x666688); g.fillRect(5, 12, 2, 3); g.fillRect(9, 12, 2, 3);
      g.fillStyle(0xcccccc); g.fillRect(13, 3, 2, 8);
      g.fillStyle(0xffcc44); g.fillRect(12, 10, 4, 1);
    });
    this.gen('player_hit', 16, 16, g => {
      g.fillStyle(0xcc4444); g.fillRect(4, 1, 8, 3); g.fillRect(3, 3, 10, 1);
      g.fillStyle(0xffaaaa); g.fillRect(5, 2, 6, 4);
      g.fillStyle(0x882222); g.fillRect(6, 3, 1, 1); g.fillRect(9, 3, 1, 1);
      g.fillStyle(0xff4444); g.fillRect(4, 4, 8, 8);
      g.fillStyle(0x884444); g.fillRect(5, 12, 2, 3); g.fillRect(9, 12, 2, 3);
      g.fillStyle(0xff8888); g.fillRect(13, 3, 2, 8);
    });
  }

  // ─── Enemies ───────────────────────────────────────────
  private generateEnemies(): void {
    this.gen('enemy_slime', 12, 10, g => {
      g.fillStyle(0x44cc44); g.fillRoundedRect(1, 3, 10, 7, 3);
      g.fillStyle(0x66ee66); g.fillRect(3, 4, 2, 2); g.fillRect(7, 4, 2, 2);
      g.fillStyle(0x228822); g.fillRect(4, 7, 4, 1);
    });
    this.gen('enemy_zombie', 14, 14, g => {
      g.fillStyle(0x557733); g.fillRect(4, 1, 6, 3);
      g.fillStyle(0x668844); g.fillRect(3, 2, 8, 8);
      g.fillStyle(0xff0000); g.fillRect(5, 3, 2, 1); g.fillRect(8, 3, 2, 1);
      g.fillStyle(0x556633); g.fillRect(4, 10, 2, 4); g.fillRect(8, 10, 2, 4);
    });
    this.gen('enemy_ghost', 12, 14, g => {
      g.fillStyle(0xaaaaff); g.fillRect(2, 1, 8, 8); g.fillRect(1, 3, 10, 4);
      g.fillStyle(0x222244); g.fillRect(4, 4, 2, 2); g.fillRect(7, 4, 2, 2);
      for (let i = 0; i < 5; i++) g.fillRect(1 + i * 2, 9, 2, 3 + (i % 2) * 2);
    });
    this.gen('enemy_skeleton_mage', 14, 14, g => {
      g.fillStyle(0xddddcc); g.fillRect(4, 1, 6, 6); g.fillRect(5, 7, 4, 5);
      g.fillStyle(0x222222); g.fillRect(5, 3, 2, 2); g.fillRect(8, 3, 2, 2);
      g.fillStyle(0x444444); g.fillRect(5, 5, 4, 1);
      g.fillStyle(0x8844cc); g.fillRect(2, 8, 3, 4); g.fillRect(9, 8, 3, 4);
    });
    this.gen('enemy_boss_slime', 32, 28, g => {
      g.fillStyle(0xff4444); g.fillRoundedRect(2, 6, 28, 20, 8);
      g.fillStyle(0xff8888); g.fillRect(8, 10, 5, 5); g.fillRect(19, 10, 5, 5);
      g.fillStyle(0x881111); g.fillRect(9, 12, 3, 2); g.fillRect(20, 12, 3, 2);
      g.fillStyle(0xaa2222); g.fillRect(12, 20, 8, 2);
      g.fillStyle(0xffcc00); g.fillRect(8, 1, 16, 5);
      g.fillRect(6, 0, 4, 3); g.fillRect(14, 0, 4, 3); g.fillRect(22, 0, 4, 3);
    });
    this.gen('enemy_projectile', 6, 6, g => {
      g.fillStyle(0x8844cc); g.fillRect(1, 1, 4, 4);
      g.fillStyle(0xaa66ee); g.fillRect(2, 2, 2, 2);
    });
  }

  // ─── Projectiles ───────────────────────────────────────
  private generateProjectiles(): void {
    this.gen('proj_blade', 8, 8, g => {
      g.fillStyle(0xcccccc); g.fillRect(3, 0, 2, 8); g.fillRect(0, 3, 8, 2);
      g.fillStyle(0xeeeeee); g.fillRect(3, 3, 2, 2);
    });
    this.gen('proj_bullet', 6, 6, g => {
      g.fillStyle(0x44aaff); g.fillRect(1, 1, 4, 4);
      g.fillStyle(0x88ccff); g.fillRect(2, 2, 2, 2);
    });
    this.gen('proj_lightning', 6, 6, g => {
      g.fillStyle(0xffff44); g.fillRect(2, 0, 2, 6); g.fillRect(0, 2, 6, 2);
      g.fillStyle(0xffffaa); g.fillRect(2, 2, 2, 2);
    });
    this.gen('proj_fire_bottle', 6, 8, g => {
      g.fillStyle(0x884422); g.fillRect(2, 0, 2, 3);
      g.fillStyle(0xff6622); g.fillRect(1, 3, 4, 4);
      g.fillStyle(0xffaa44); g.fillRect(2, 4, 2, 2);
    });
    this.gen('fire_explosion', 24, 24, g => {
      g.fillStyle(0xff4400, 0.3); g.fillCircle(12, 12, 12);
      g.fillStyle(0xff8800, 0.5); g.fillCircle(12, 12, 8);
      g.fillStyle(0xffcc00, 0.7); g.fillCircle(12, 12, 4);
    });
  }

  // ─── Pickups ───────────────────────────────────────────
  private generatePickups(): void {
    this.gen('pickup_exp', 8, 8, g => {
      g.fillStyle(0x4488ff);
      g.fillRect(3, 0, 2, 2); g.fillRect(1, 2, 6, 2); g.fillRect(0, 4, 8, 2);
      g.fillRect(1, 6, 6, 2); g.fillRect(3, 7, 2, 1);
      g.fillStyle(0x88bbff); g.fillRect(3, 2, 2, 2);
    });
    this.gen('pickup_gold', 6, 6, g => {
      g.fillStyle(0xffcc00); g.fillCircle(3, 3, 3);
      g.fillStyle(0xffee44); g.fillRect(2, 2, 2, 2);
    });
    this.gen('pickup_health', 8, 8, g => {
      g.fillStyle(0xff4444); g.fillRect(3, 1, 2, 6); g.fillRect(1, 3, 6, 2);
      g.fillStyle(0xff8888); g.fillRect(3, 3, 2, 2);
    });
  }

  // ─── Effects ───────────────────────────────────────────
  private generateEffects(): void {
    this.gen('particle', 4, 4, g => {
      g.fillStyle(0xffffff); g.fillRect(0, 0, 4, 4);
    });
    this.gen('blood_splat', 6, 6, g => {
      g.fillStyle(0xcc0000, 0.6); g.fillRect(1, 1, 4, 4); g.fillRect(0, 2, 6, 2);
    });
  }

  // ─── UI Elements ───────────────────────────────────────
  private generateUI(): void {
    this.gen('hp_bar_bg', 100, 8, g => {
      g.fillStyle(0x333333); g.fillRoundedRect(0, 0, 100, 8, 2);
    });
    this.gen('hp_bar_fill', 100, 8, g => {
      g.fillStyle(0x44cc44); g.fillRoundedRect(0, 0, 100, 8, 2);
      g.fillStyle(0x66ee66); g.fillRect(0, 0, 100, 3);
    });
    this.gen('exp_bar_fill', 100, 6, g => {
      g.fillStyle(0x4488ff); g.fillRoundedRect(0, 0, 100, 6, 2);
      g.fillStyle(0x66aaff); g.fillRect(0, 0, 100, 2);
    });
    this.gen('joystick_base', 100, 100, g => {
      g.fillStyle(0xffffff, 0.1); g.fillCircle(50, 50, 50);
      g.fillStyle(0xffffff, 0.05); g.fillCircle(50, 50, 35);
    });
    this.gen('joystick_knob', 40, 40, g => {
      g.fillStyle(0xffffff, 0.4); g.fillCircle(20, 20, 20);
      g.fillStyle(0xffffff, 0.6); g.fillCircle(20, 20, 14);
    });
    this.gen('weapon_slot', 32, 32, g => {
      g.fillStyle(0x222244, 0.8); g.fillRoundedRect(0, 0, 32, 32, 4);
      g.fillStyle(0x334466, 0.6); g.fillRoundedRect(1, 1, 30, 30, 3);
    });
    this.gen('upgrade_card', 160, 80, g => {
      g.fillStyle(0x1a1a3e, 0.95); g.fillRoundedRect(0, 0, 160, 80, 6);
      g.fillStyle(0x2a2a5e, 0.8); g.fillRoundedRect(2, 2, 156, 76, 4);
      g.fillStyle(0x3a3a7e, 0.6); g.fillRect(4, 4, 152, 2);
    });
    this.gen('upgrade_card_hover', 160, 80, g => {
      g.fillStyle(0x2a2a5e, 0.95); g.fillRoundedRect(0, 0, 160, 80, 6);
      g.fillStyle(0x3a3a7e, 0.8); g.fillRoundedRect(2, 2, 156, 76, 4);
      g.fillStyle(0x5a5aae, 0.6); g.fillRect(4, 4, 152, 2);
    });
  }

  // ─── Background ────────────────────────────────────────
  private generateBackground(): void {
    const rng = Phaser.Math.RND;
    this.gen('tile_grass', 32, 32, g => {
      g.fillStyle(0x2d5a1e); g.fillRect(0, 0, 32, 32);
      for (let i = 0; i < 8; i++) {
        g.fillStyle(rng.pick([0x3a6b2a, 0x245218]));
        g.fillRect(rng.integerInRange(0, 28), rng.integerInRange(0, 28), 2, 2);
      }
    });
    this.gen('tile_grass_dark', 32, 32, g => {
      g.fillStyle(0x265018); g.fillRect(0, 0, 32, 32);
      for (let i = 0; i < 6; i++) {
        g.fillStyle(rng.pick([0x336622, 0x1e4412]));
        g.fillRect(rng.integerInRange(0, 28), rng.integerInRange(0, 28), 2, 2);
      }
    });
    this.gen('tile_flower', 32, 32, g => {
      g.fillStyle(0x2d5a1e); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xffff44); g.fillRect(14, 14, 4, 4);
      g.fillStyle(0xffff88); g.fillRect(15, 15, 2, 2);
    });
  }
}

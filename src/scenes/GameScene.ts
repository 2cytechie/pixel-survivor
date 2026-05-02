import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import {
  WeaponType, EnemyType, PassiveType,
  WEAPONS, ENEMIES, PASSIVES,
  WEAPON_TYPES, ENEMY_TYPES, PASSIVE_TYPES,
  getEnemyPool, expToLevel,
} from '../config/GameData';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { PickupItem, PickupType } from '../entities/PickupItem';
import { FloatingText } from '../entities/FloatingText';
import { WeaponManager } from '../systems/WeaponManager';
import { MusicManager } from '../systems/MusicManager';
import { SpatialHash } from '../utils/SpatialHash';
import { randInt, pickRandom, formatTime, clamp } from '../utils/MathUtils';

export class GameScene extends Phaser.Scene {
  // Core entities
  private player!: Player;
  private weaponManager!: WeaponManager;
  private spatialHash!: SpatialHash;

  // Entity containers
  private enemies: Enemy[] = [];
  private projectiles: Phaser.GameObjects.Sprite[] = [];
  private pickups: PickupItem[] = [];
  private floatingTexts: FloatingText[] = [];

  // Background
  private bgTiles: Phaser.GameObjects.Sprite[] = [];

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  private isMobile: boolean = false;

  // Joystick visuals
  private joystickBase!: Phaser.GameObjects.Sprite;
  private joystickKnob!: Phaser.GameObjects.Sprite;
  private joystickPointer: Phaser.Input.Pointer | null = null;
  private joystickOrigin: { x: number; y: number } = { x: 0, y: 0 };

  // HUD
  private hpBarFill!: Phaser.GameObjects.Sprite;
  private hpBarBg!: Phaser.GameObjects.Sprite;
  private expBarFill!: Phaser.GameObjects.Sprite;
  private hpText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;

  // Game state
  private gameTime: number = 0;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  private totalKills: number = 0;
  private totalGold: number = 0;
  private spawnTimer: number = 0;
  private lastBossTime: number = 0;

  // Music
  private musicManager: MusicManager = new MusicManager();
  private muteBtn: Phaser.GameObjects.Text | null = null;

  // Upgrade panel elements (stored for cleanup)
  private upgradeElements: Phaser.GameObjects.GameObject[] = [];
  private pendingLevelUp: boolean = false;

  // Pause overlay
  private pauseOverlay: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  // ==================== CREATE ====================

  create(): void {
    this.isMobile = !this.sys.game.device.os.desktop;
    this.gameTime = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.totalKills = 0;
    this.totalGold = 0;
    this.spawnTimer = 0;
    this.lastBossTime = 0;
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.floatingTexts = [];

    this.createBackground();
    this.createPlayer();
    this.createCamera();
    this.createInput();
    this.createHUD();
    if (this.isMobile) {
      this.createJoystick();
    }

    // Initial weapon
    this.weaponManager.addWeapon('spinning_blade');

    // Start BGM
    this.musicManager.play();

    // Pause key
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => this.togglePause());
      this.input.keyboard.on('keydown-P', () => this.togglePause());
    }
  }

  // ==================== BACKGROUND ====================

  private createBackground(): void {
    const mw = GameConfig.MAP.WIDTH;
    const mh = GameConfig.MAP.HEIGHT;
    const tileSize = GameConfig.VISUAL.GRID_SIZE;
    const tilesX = mw / tileSize;
    const tilesY = mh / tileSize;

    const textures = ['tile_grass', 'tile_grass_dark', 'tile_flower'];

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        let tex: string;
        const rng = Phaser.Math.RND.frac();
        if (rng < 0.05) {
          tex = 'tile_flower';
        } else if (rng < 0.35) {
          tex = 'tile_grass_dark';
        } else {
          tex = 'tile_grass';
        }
        const tile = this.add.sprite(tx * tileSize + tileSize / 2, ty * tileSize + tileSize / 2, tex);
        tile.setOrigin(0.5, 0.5);
        tile.setDepth(0);
        this.bgTiles.push(tile);
      }
    }

    // Map boundary visual
    const boundary = this.add.graphics();
    boundary.lineStyle(4, 0xff0000, 0.5);
    boundary.strokeRect(0, 0, mw, mh);
    boundary.setDepth(1);
  }

  // ==================== PLAYER ====================

  private createPlayer(): void {
    this.player = new Player(this, GameConfig.MAP.WIDTH / 2, GameConfig.MAP.HEIGHT / 2);
    this.player.setDepth(10);
    this.weaponManager = new WeaponManager(this, this.player);
    this.spatialHash = new SpatialHash(64);
  }

  // ==================== CAMERA ====================

  private createCamera(): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, GameConfig.MAP.WIDTH, GameConfig.MAP.HEIGHT);
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setZoom(1);
  }

  // ==================== INPUT ====================

  private createInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey('W'),
        A: this.input.keyboard.addKey('A'),
        S: this.input.keyboard.addKey('S'),
        D: this.input.keyboard.addKey('D'),
      };
    }
  }

  // ==================== JOYSTICK ====================

  private createJoystick(): void {
    const cam = this.cameras.main;
    const joystickX = 80;
    const joystickY = this.scale.height - 80;

    this.joystickBase = this.add.sprite(joystickX, joystickY, 'joystick_base')
      .setScale(1)
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.6);

    this.joystickKnob = this.add.sprite(joystickX, joystickY, 'joystick_knob')
      .setScale(1)
      .setScrollFactor(0)
      .setDepth(1001)
      .setAlpha(0.8);

    this.joystickOrigin = { x: joystickX, y: joystickY };

    // Touch events
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isPaused || this.isGameOver || this.pendingLevelUp) return;
      const wx = pointer.x;
      const wy = pointer.y;
      // Only respond to left side touches
      if (wx < this.scale.width / 2) {
        this.joystickPointer = pointer;
        this.joystickBase.setPosition(wx, wy);
        this.joystickKnob.setPosition(wx, wy);
        this.joystickOrigin = { x: wx, y: wy };
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer !== pointer) return;
      const dx = pointer.x - this.joystickOrigin.x;
      const dy = pointer.y - this.joystickOrigin.y;
      const maxDist = 40;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clampedDist = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);

      const knobX = this.joystickOrigin.x + Math.cos(angle) * clampedDist;
      const knobY = this.joystickOrigin.y + Math.sin(angle) * clampedDist;
      this.joystickKnob.setPosition(knobX, knobY);

      if (dist > 5) {
        this.joystickVector = {
          x: Math.cos(angle),
          y: Math.sin(angle),
        };
      } else {
        this.joystickVector = { x: 0, y: 0 };
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer === pointer) {
        this.joystickPointer = null;
        this.joystickVector = { x: 0, y: 0 };
        this.joystickKnob.setPosition(this.joystickOrigin.x, this.joystickOrigin.y);
      }
    });
  }

  // ==================== HUD ====================

  private createHUD(): void {
    const pad = 10;

    // HP Bar
    this.hpBarBg = this.add.sprite(pad + 50, pad + 8, 'hp_bar_bg')
      .setScale(1)
      .setScrollFactor(0)
      .setDepth(1000)
      .setOrigin(0, 0);

    this.hpBarFill = this.add.sprite(pad + 50, pad + 8, 'hp_bar_fill')
      .setScale(1)
      .setScrollFactor(0)
      .setDepth(1001)
      .setOrigin(0, 0);

    // HP Text
    this.hpText = this.add.text(pad + 155, pad + 2, '100/100', {
      fontSize: '10px',
      fontFamily: '"Courier New", monospace',
      color: '#ffffff',
    }).setScrollFactor(0).setDepth(1002);

    // EXP Bar
    const expBarY = pad + 20;
    const expBg = this.add.graphics();
    expBg.fillStyle(0x333333, 0.8);
    expBg.fillRoundedRect(pad + 50, expBarY, 100, 6, 2);
    expBg.setScrollFactor(0).setDepth(1000);

    this.expBarFill = this.add.sprite(pad + 50, expBarY, 'exp_bar_fill')
      .setScale(1)
      .setScrollFactor(0)
      .setDepth(1001)
      .setOrigin(0, 0);

    // Level
    this.levelText = this.add.text(pad, pad + 2, 'Lv.1', {
      fontSize: '12px',
      fontFamily: '"Courier New", monospace',
      color: '#ffcc44',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(1002);

    // Time
    this.timeText = this.add.text(this.scale.width - pad, pad, '5:00', {
      fontSize: '14px',
      fontFamily: '"Courier New", monospace',
      color: '#ffffff',
    }).setScrollFactor(0).setDepth(1002).setOrigin(1, 0);

    // Kills
    this.killText = this.add.text(this.scale.width - pad, pad + 20, '击杀: 0', {
      fontSize: '10px',
      fontFamily: '"Courier New", monospace',
      color: '#ff8888',
    }).setScrollFactor(0).setDepth(1002).setOrigin(1, 0);

    // Gold
    this.goldText = this.add.text(this.scale.width - pad, pad + 34, '金币: 0', {
      fontSize: '10px',
      fontFamily: '"Courier New", monospace',
      color: '#ffcc44',
    }).setScrollFactor(0).setDepth(1002).setOrigin(1, 0);

    // Pause button (top center)
    const pauseBtn = this.add.text(this.scale.width / 2, pad, '[P] 暂停', {
      fontSize: '10px',
      fontFamily: '"Courier New", monospace',
      color: '#888888',
    }).setScrollFactor(0).setDepth(1002).setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.togglePause());

    // Mute button (top right area)
    this.muteBtn = this.add.text(this.scale.width - pad, pad + 48, '♪ ON', {
      fontSize: '10px',
      fontFamily: '"Courier New", monospace',
      color: '#88ccff',
    }).setScrollFactor(0).setDepth(1002).setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        const muted = this.musicManager.toggleMute();
        if (this.muteBtn) {
          this.muteBtn.setText(muted ? '♪ OFF' : '♪ ON');
          this.muteBtn.setColor(muted ? '#ff4444' : '#88ccff');
        }
      });
  }

  private updateHUD(): void {
    // HP bar
    const hpPercent = Math.max(0, this.player.hp / this.player.maxHp);
    this.hpBarFill.setCrop(0, 0, 100 * hpPercent, 8);
    this.hpText.setText(`${Math.ceil(this.player.hp)}/${this.player.maxHp}`);

    // EXP bar
    const expPercent = this.player.expToNext > 0 ? this.player.exp / this.player.expToNext : 0;
    this.expBarFill.setCrop(0, 0, 100 * expPercent, 6);

    // Level
    this.levelText.setText(`Lv.${this.player.level}`);

    // Time (countdown)
    const remaining = Math.max(0, GameConfig.LEVEL.DURATION - this.gameTime);
    this.timeText.setText(formatTime(remaining));

    // Kills
    this.killText.setText(`击杀: ${this.totalKills}`);

    // Gold
    this.goldText.setText(`金币: ${this.totalGold}`);
  }

  // ==================== UPDATE ====================

  update(time: number, delta: number): void {
    if (this.isPaused || this.isGameOver || this.pendingLevelUp) return;

    this.gameTime += delta / 1000;

    // Update player input
    this.updatePlayerInput();

    // Update player
    this.player.update(time, delta);

    // Clamp player to map bounds
    this.player.x = clamp(this.player.x, 16, GameConfig.MAP.WIDTH - 16);
    this.player.y = clamp(this.player.y, 16, GameConfig.MAP.HEIGHT - 16);

    // Update spatial hash
    this.spatialHash.clear();
    for (const enemy of this.enemies) {
      if (enemy.active) {
        this.spatialHash.insert(enemy);
      }
    }

    // Update enemies
    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.update(this.player, delta);
      }
    }

    // Remove dead enemies
    this.enemies = this.enemies.filter(e => e.active);

    // Update weapon manager
    this.weaponManager.update(time, delta, this.enemies);

    // Update projectiles
    this.updateProjectiles(delta);

    // Update pickups
    this.updatePickups(time, delta);

    // Enemy-player collision
    this.checkEnemyPlayerCollision();

    // Spawn enemies
    this.spawnTimer += delta;
    this.updateSpawning();

    // Update floating texts
    this.updateFloatingTexts(delta);

    // Update HUD
    this.updateHUD();

    // Check game over
    if (this.player.hp <= 0) {
      this.gameOver();
    }

    // Check victory
    if (this.gameTime >= GameConfig.LEVEL.DURATION) {
      this.victory();
    }
  }

  // ==================== PLAYER INPUT ====================

  private updatePlayerInput(): void {
    let vx = 0;
    let vy = 0;

    // Keyboard input
    if (this.cursors) {
      if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
      if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;
    }

    // Joystick input (mobile)
    if (this.isMobile && (this.joystickVector.x !== 0 || this.joystickVector.y !== 0)) {
      vx = this.joystickVector.x;
      vy = this.joystickVector.y;
    }

    this.player.vx = vx;
    this.player.vy = vy;
  }

  // ==================== PROJECTILES ====================

  private updateProjectiles(delta: number): void {
    const toRemove: number[] = [];

    for (let i = 0; i < this.projectiles.length; i++) {
      const proj = this.projectiles[i];
      if (!proj.active) {
        toRemove.push(i);
        continue;
      }

      const speed = proj.getData('speed') as number || 0;
      const angle = proj.getData('angle') as number || 0;
      const range = proj.getData('range') as number || 300;
      const startX = proj.getData('startX') as number || proj.x;
      const startY = proj.getData('startY') as number || proj.y;
      const isEnemy = proj.getData('isEnemy') as boolean || false;
      const projType = proj.getData('type') as string || '';
      const damage = proj.getData('damage') as number || 0;
      const hitEnemies = proj.getData('hitEnemies') as Set<number> || new Set<number>();

      // Move projectile
      const moveX = Math.cos(angle) * speed * (delta / 1000);
      const moveY = Math.sin(angle) * speed * (delta / 1000);
      proj.x += moveX;
      proj.y += moveY;

      // Check range
      const traveled = Phaser.Math.Distance.Between(startX, startY, proj.x, proj.y);
      if (traveled >= range) {
        // Fire bottle explosion
        if (projType === 'fire_bottle') {
          const weaponLevel = proj.getData('weaponLevel') as number || 1;
          const explosionRange = proj.getData('explosionRange') as number || 50;
          this.weaponManager.handleFireBottleExplosion(proj.x, proj.y, damage, explosionRange, this.enemies);
        }
        proj.destroy();
        toRemove.push(i);
        continue;
      }

      // Out of map bounds
      if (proj.x < 0 || proj.x > GameConfig.MAP.WIDTH || proj.y < 0 || proj.y > GameConfig.MAP.HEIGHT) {
        proj.destroy();
        toRemove.push(i);
        continue;
      }

      // Collision detection
      if (!isEnemy) {
        // Player projectile vs enemies
        const nearby = this.spatialHash.queryNearby(proj.x, proj.y, 20);
        for (const obj of nearby) {
          if (!(obj instanceof Enemy) || !obj.active) continue;
          if (hitEnemies.has(obj.uid)) continue;

          const dist = Phaser.Math.Distance.Between(proj.x, proj.y, obj.x, obj.y);
          if (dist < 16) {
            hitEnemies.add(obj.uid);
            proj.setData('hitEnemies', hitEnemies);

            const killed = obj.takeDamage(damage, this);
            this.showDamageText(obj.x, obj.y - 10, damage, false);

            // Don't destroy on hit (projectile continues)
            // But we could add pierce logic here if needed
          }
        }
      } else {
        // Enemy projectile vs player
        const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y);
        if (dist < 16) {
          this.player.takeDamage(damage);
          this.showDamageText(this.player.x, this.player.y - 10, damage, false);
          proj.destroy();
          toRemove.push(i);
        }
      }
    }

    // Remove destroyed projectiles (reverse order)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.projectiles.splice(toRemove[i], 1);
    }
  }

  // ==================== PICKUPS ====================

  private updatePickups(time: number, delta: number): void {
    const toRemove: number[] = [];

    for (let i = 0; i < this.pickups.length; i++) {
      const pickup = this.pickups[i];
      if (!pickup.active) {
        toRemove.push(i);
        continue;
      }

      const picked = pickup.update(time, delta, this.player, this.player.pickupRange);
      if (picked) {
        toRemove.push(i);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.pickups.splice(toRemove[i], 1);
    }
  }

  // ==================== ENEMY-PLAYER COLLISION ====================

  private checkEnemyPlayerCollision(): void {
    const nearby = this.spatialHash.queryNearby(this.player.x, this.player.y, 20);
    for (const obj of nearby) {
      if (!(obj instanceof Enemy) || !obj.active) continue;

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.x, obj.y);
      if (dist < 16) {
        this.player.takeDamage(obj.damage);
        this.showDamageText(this.player.x, this.player.y - 10, obj.damage, false);

        // Pushback enemy slightly
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, obj.x, obj.y);
        obj.x += Math.cos(angle) * 10;
        obj.y += Math.sin(angle) * 10;
      }
    }
  }

  // ==================== SPAWNING ====================

  private updateSpawning(): void {
    // Dynamic spawn interval based on time
    const progress = Math.min(1, this.gameTime / GameConfig.LEVEL.DURATION);
    const interval = GameConfig.ENEMY.SPAWN_INTERVAL_INITIAL -
      (GameConfig.ENEMY.SPAWN_INTERVAL_INITIAL - GameConfig.ENEMY.SPAWN_INTERVAL_MIN) * progress;

    if (this.spawnTimer < interval) return;
    this.spawnTimer = 0;

    // Check max enemies
    if (this.enemies.length >= GameConfig.ENEMY.MAX_ENEMIES) return;

    // Spawn 1-3 enemies based on progress
    const count = 1 + Math.floor(progress * 2);
    for (let i = 0; i < count; i++) {
      this.spawnEnemy();
    }

    // Boss every 60 seconds
    if (this.gameTime - this.lastBossTime >= 60 && this.gameTime > 30) {
      this.lastBossTime = this.gameTime;
      this.spawnEnemy('boss_slime');
    }
  }

  private spawnEnemy(type?: EnemyType): void {
    const pool = type ? [type] : getEnemyPool(this.gameTime);
    const enemyType = pickRandom(pool);
    const data = ENEMIES[enemyType];

    // Spawn at random position around player
    const angle = Math.random() * Math.PI * 2;
    const dist = GameConfig.ENEMY.SPAWN_DISTANCE_MIN +
      Math.random() * (GameConfig.ENEMY.SPAWN_DISTANCE_MAX - GameConfig.ENEMY.SPAWN_DISTANCE_MIN);

    let x = this.player.x + Math.cos(angle) * dist;
    let y = this.player.y + Math.sin(angle) * dist;

    // Clamp to map bounds
    x = clamp(x, 32, GameConfig.MAP.WIDTH - 32);
    y = clamp(y, 32, GameConfig.MAP.HEIGHT - 32);

    // Scale enemy stats with game time
    const scaledData = { ...data };
    const scaleFactor = 1 + (this.gameTime / GameConfig.LEVEL.DURATION) * 2;
    scaledData.hp = Math.floor(data.hp * scaleFactor);
    scaledData.damage = Math.floor(data.damage * (1 + this.gameTime / GameConfig.LEVEL.DURATION));

    const enemy = new Enemy(this, x, y, scaledData);
    enemy.setTexture(`enemy_${enemyType}`);
    enemy.setDepth(5);

    this.enemies.push(enemy);
  }

  // ==================== CALLBACKS ====================

  onEnemyKilled(enemy: Enemy): void {
    this.totalKills++;

    // Drop loot
    // Always drop exp gem
    this.spawnPickup(enemy.x, enemy.y, 'exp', enemy.expValue);

    // Chance to drop gold
    if (Math.random() < GameConfig.LOOT.GOLD_CHANCE) {
      const goldValue = randInt(GameConfig.LOOT.GOLD_VALUE_MIN, GameConfig.LOOT.GOLD_VALUE_MAX);
      this.spawnPickup(enemy.x + randInt(-10, 10), enemy.y + randInt(-10, 10), 'gold', goldValue);
    }

    // Chance to drop health
    if (Math.random() < GameConfig.LOOT.HEAL_CHANCE) {
      this.spawnPickup(enemy.x + randInt(-10, 10), enemy.y + randInt(-10, 10), 'health', GameConfig.LOOT.HEAL_AMOUNT);
    }

    // Kill effect (blood splat)
    const splat = this.add.sprite(enemy.x, enemy.y, 'blood_splat')
      .setScale(2)
      .setDepth(3)
      .setAlpha(0.6);
    this.time.delayedCall(300, () => splat.destroy());
  }

  private spawnPickup(x: number, y: number, type: PickupType, value: number): void {
    const pickup = new PickupItem(this, x, y, type, value);
    pickup.setDepth(4);
    this.pickups.push(pickup);
  }

  onPickupCollected(pickup: PickupItem, _player: Phaser.GameObjects.Sprite): void {
    switch (pickup.pickupType) {
      case 'exp': {
        const expAmount = Math.floor(pickup.value * (1 + this.player.critRate * 0.1)); // small bonus
        const leveledUp = this.player.addExp(expAmount);
        this.showDamageText(this.player.x, this.player.y - 20, expAmount, false, 'exp');
        if (leveledUp) {
          this.pendingLevelUp = true;
          this.time.delayedCall(200, () => this.showUpgradePanel());
        }
        break;
      }
      case 'gold':
        this.totalGold += pickup.value;
        this.showDamageText(this.player.x, this.player.y - 20, pickup.value, false, 'gold');
        break;
      case 'health':
        this.player.heal(pickup.value);
        this.showDamageText(this.player.x, this.player.y - 20, pickup.value, false, 'heal');
        break;
    }
  }

  showDamageText(x: number, y: number, amount: number, isCrit: boolean, type: string = 'damage'): void {
    const textType = type === 'exp' ? 'exp' : type === 'heal' ? 'heal' : isCrit ? 'crit' : 'damage';
    const ft = new FloatingText(this, x + randInt(-8, 8), y, Math.floor(amount).toString(), textType);
    this.floatingTexts.push(ft);
  }

  spawnEnemyProjectile(x: number, y: number, angle: number, damage: number, speed: number): void {
    const proj = this.add.sprite(x, y, 'enemy_projectile');
    proj.setScale(2);
    proj.setOrigin(0.5, 0.5);
    proj.setDepth(5);
    proj.setData('damage', damage);
    proj.setData('isEnemy', true);
    proj.setData('hitEnemies', new Set<number>());
    proj.setData('speed', speed);
    proj.setData('range', 400);
    proj.setData('angle', angle);
    proj.setData('startX', x);
    proj.setData('startY', y);
    proj.setData('type', 'enemy_projectile');
    this.projectiles.push(proj);
  }

  // ==================== FLOATING TEXTS ====================

  private updateFloatingTexts(delta: number): void {
    const toRemove: number[] = [];
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (!ft.active) {
        toRemove.push(i);
        continue;
      }
      ft.update(0, delta);
    }
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.floatingTexts.splice(toRemove[i], 1);
    }
  }

  // ==================== UPGRADE PANEL ====================

  private showUpgradePanel(): void {
    if (this.upgradeElements.length > 0) return;

    this.isPaused = true;

    const w = this.scale.width;
    const h = this.scale.height;
    const panelDepth = 2001;

    // Dark overlay — NOT interactive, just visual
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6)
      .setScrollFactor(0)
      .setDepth(panelDepth);
    this.upgradeElements.push(overlay);

    // Title
    const title = this.add.text(w / 2, h * 0.2, `升级! Lv.${this.player.level}`, {
      fontSize: '24px',
      fontFamily: '"Courier New", monospace',
      color: '#ffcc44',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(panelDepth + 1);
    this.upgradeElements.push(title);

    // Generate 3 random upgrade options
    const options = this.generateUpgradeOptions();

    // Create option cards
    const cardWidth = 160;
    const cardHeight = 80;
    const cardGap = 20;
    const totalWidth = options.length * cardWidth + (options.length - 1) * cardGap;
    const startX = (w - totalWidth) / 2 + cardWidth / 2;
    const cardY = h * 0.45;

    options.forEach((option, i) => {
      const cx = startX + i * (cardWidth + cardGap);
      const cy = cardY;
      const cardDepth = panelDepth + 2;

      // Card background sprite
      const card = this.add.sprite(cx, cy, 'upgrade_card')
        .setScale(1)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(cardDepth);
      this.upgradeElements.push(card);

      // Card texts
      const nameText = this.add.text(cx, cy - 18, option.name, {
        fontSize: '12px',
        fontFamily: '"Courier New", monospace',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(cardDepth + 1);
      this.upgradeElements.push(nameText);

      const descText = this.add.text(cx, cy + 2, option.description, {
        fontSize: '9px',
        fontFamily: '"Courier New", monospace',
        color: '#aaaaaa',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(cardDepth + 1);
      this.upgradeElements.push(descText);

      const levelText = this.add.text(cx, cy + 22, option.levelInfo, {
        fontSize: '9px',
        fontFamily: '"Courier New", monospace',
        color: '#88ccff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(cardDepth + 1);
      this.upgradeElements.push(levelText);

      // Interactive hit area — independent Game Object, NOT inside a Container
      const hitArea = this.add.rectangle(cx, cy, cardWidth, cardHeight, 0xffffff, 0.01)
        .setScrollFactor(0)
        .setDepth(cardDepth + 2)
        .setInteractive({ useHandCursor: true });

      hitArea.on('pointerover', () => {
        card.setTexture('upgrade_card_hover');
      });
      hitArea.on('pointerout', () => {
        card.setTexture('upgrade_card');
      });
      hitArea.on('pointerdown', () => {
        this.selectUpgrade(option);
      });

      this.upgradeElements.push(hitArea);
    });
  }

  private generateUpgradeOptions(): Array<{
    type: 'weapon_new' | 'weapon_upgrade' | 'passive';
    weaponType?: WeaponType;
    passiveType?: PassiveType;
    name: string;
    description: string;
    levelInfo: string;
  }> {
    const options: Array<{
      type: 'weapon_new' | 'weapon_upgrade' | 'passive';
      weaponType?: WeaponType;
      passiveType?: PassiveType;
      name: string;
      description: string;
      levelInfo: string;
    }> = [];

    // Available new weapons
    const availableWeapons = WEAPON_TYPES.filter(t => !this.weaponManager.hasWeapon(t));

    // Weapons that can be upgraded
    const upgradeableWeapons = this.weaponManager.getEquippedWeapons()
      .filter(w => w.level < w.data.maxLevel);

    // Build candidate pool
    const candidates: typeof options = [];

    // New weapons
    for (const wt of availableWeapons) {
      if (this.weaponManager.getEquippedWeapons().length < this.player.weaponSlots + GameConfig.WEAPON.MAX_SLOTS) {
        const data = WEAPONS[wt];
        candidates.push({
          type: 'weapon_new',
          weaponType: wt,
          name: `新武器: ${data.name}`,
          description: data.description,
          levelInfo: 'Lv.1',
        });
      }
    }

    // Weapon upgrades
    for (const w of upgradeableWeapons) {
      candidates.push({
        type: 'weapon_upgrade',
        weaponType: w.type,
        name: `${w.data.name}`,
        description: `升级 ${w.level} → ${w.level + 1}`,
        levelInfo: `Lv.${w.level} → Lv.${w.level + 1}`,
      });
    }

    // Passive skills
    for (const pt of PASSIVE_TYPES) {
      const data = PASSIVES[pt];
      // Calculate current level based on player stats
      let currentLevel = 0;
      switch (pt) {
        case 'max_hp': currentLevel = Math.floor((this.player.maxHp - 100) / 20); break;
        case 'move_speed': currentLevel = Math.floor((this.player.speed - 160) / 16); break;
        case 'pickup_range': currentLevel = Math.floor((this.player.pickupRange - 60) / 12); break;
        case 'armor': currentLevel = Math.floor(this.player.armor / 0.05); break;
        case 'regen': currentLevel = Math.floor(this.player.regen); break;
        case 'crit_rate': currentLevel = Math.floor(this.player.critRate / 0.05); break;
        case 'crit_damage': currentLevel = Math.floor((this.player.critDamage - 1.5) / 0.25); break;
        case 'cooldown_reduction': currentLevel = Math.floor(this.player.cooldownReduction / 0.08); break;
        case 'weapon_slots': currentLevel = Math.floor(this.player.weaponSlots - 1); break;
        case 'exp_bonus': currentLevel = 0; // Can't easily track this
      }

      if (currentLevel < data.maxLevel) {
        candidates.push({
          type: 'passive',
          passiveType: pt,
          name: data.name,
          description: data.description,
          levelInfo: `Lv.${currentLevel} → Lv.${currentLevel + 1}`,
        });
      }
    }

    // Shuffle and pick 3
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  private selectUpgrade(option: {
    type: 'weapon_new' | 'weapon_upgrade' | 'passive';
    weaponType?: WeaponType;
    passiveType?: PassiveType;
  }): void {
    switch (option.type) {
      case 'weapon_new':
        if (option.weaponType) {
          this.weaponManager.addWeapon(option.weaponType);
        }
        break;
      case 'weapon_upgrade':
        if (option.weaponType) {
          this.weaponManager.upgradeWeapon(option.weaponType);
        }
        break;
      case 'passive':
        if (option.passiveType) {
          this.applyPassive(option.passiveType);
        }
        break;
    }

    // Close panel — destroy all upgrade UI elements
    for (const el of this.upgradeElements) {
      el.destroy();
    }
    this.upgradeElements = [];
    this.isPaused = false;
    this.pendingLevelUp = false;
  }

  private applyPassive(type: PassiveType): void {
    const data = PASSIVES[type];
    switch (type) {
      case 'max_hp':
        this.player.maxHp += data.valuePerLevel;
        this.player.hp += data.valuePerLevel;
        break;
      case 'move_speed':
        this.player.speed += data.valuePerLevel * 160;
        break;
      case 'pickup_range':
        this.player.pickupRange += data.valuePerLevel * 60;
        break;
      case 'armor':
        this.player.armor += data.valuePerLevel;
        break;
      case 'regen':
        this.player.regen += data.valuePerLevel;
        break;
      case 'crit_rate':
        this.player.critRate += data.valuePerLevel;
        break;
      case 'crit_damage':
        this.player.critDamage += data.valuePerLevel;
        break;
      case 'cooldown_reduction':
        this.player.cooldownReduction = Math.min(0.5, this.player.cooldownReduction + data.valuePerLevel);
        break;
      case 'weapon_slots':
        this.player.weaponSlots += 1;
        break;
      case 'exp_bonus':
        // Handled in pickup collection
        break;
    }
  }

  // ==================== PAUSE ====================

  private togglePause(): void {
    if (this.isGameOver || this.pendingLevelUp) return;
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.showPauseOverlay();
    } else {
      this.hidePauseOverlay();
    }
  }

  private showPauseOverlay(): void {
    if (this.pauseOverlay) return;

    const w = this.scale.width;
    const h = this.scale.height;

    this.pauseOverlay = this.add.container(0, 0).setDepth(3000).setScrollFactor(0);

    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);
    this.pauseOverlay.add(bg);

    const title = this.add.text(w / 2, h * 0.35, '暂停', {
      fontSize: '28px',
      fontFamily: '"Courier New", monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.pauseOverlay.add(title);

    const resumeBtn = this.add.text(w / 2, h * 0.5, '继续游戏', {
      fontSize: '16px',
      fontFamily: '"Courier New", monospace',
      color: '#44aaff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.togglePause())
      .on('pointerover', () => resumeBtn.setColor('#88ccff'))
      .on('pointerout', () => resumeBtn.setColor('#44aaff'));
    this.pauseOverlay.add(resumeBtn);

    const quitBtn = this.add.text(w / 2, h * 0.6, '返回主菜单', {
      fontSize: '14px',
      fontFamily: '"Courier New", monospace',
      color: '#ff8888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.hidePauseOverlay();
        this.scene.start('MenuScene');
      })
      .on('pointerover', () => quitBtn.setColor('#ffaaaa'))
      .on('pointerout', () => quitBtn.setColor('#ff8888'));
    this.pauseOverlay.add(quitBtn);
  }

  private hidePauseOverlay(): void {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy(true);
      this.pauseOverlay = null;
    }
  }

  // ==================== GAME OVER / VICTORY ====================

  private gameOver(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    const text = this.add.text(
      this.player.x, this.player.y - 40,
      '游戏结束',
      {
        fontSize: '24px',
        fontFamily: '"Courier New", monospace',
        color: '#ff4444',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(2000);

    this.cameras.main.shake(300, 0.01);

    this.time.delayedCall(2000, () => {
      text.destroy();
      this.scene.start('ResultScene', {
        won: false,
        time: this.gameTime,
        kills: this.totalKills,
        level: this.player.level,
        gold: this.totalGold,
      });
    });
  }

  private victory(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    const text = this.add.text(
      this.player.x, this.player.y - 40,
      '胜利!',
      {
        fontSize: '28px',
        fontFamily: '"Courier New", monospace',
        color: '#ffcc44',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(2000);

    this.time.delayedCall(2000, () => {
      text.destroy();
      this.scene.start('ResultScene', {
        won: true,
        time: this.gameTime,
        kills: this.totalKills,
        level: this.player.level,
        gold: this.totalGold,
      });
    });
  }

  // ==================== CLEANUP ====================

  shutdown(): void {
    // Stop music
    this.musicManager.stop();

    // Clean up all entities
    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    for (const proj of this.projectiles) {
      proj.destroy();
    }
    for (const pickup of this.pickups) {
      pickup.destroy();
    }
    this.weaponManager.destroy();
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
  }
}

import Phaser from 'phaser';
import { WeaponType, WeaponData, WEAPONS } from '../config/GameData';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { distBetween, angleBetween, pickRandom } from '../utils/MathUtils';

export interface WeaponInstance {
  type: WeaponType;
  level: number;
  timer: number;
  data: WeaponData;
}

export class WeaponManager {
  public scene: Phaser.Scene;
  public player: Player;
  public weapons: Map<WeaponType, WeaponInstance>;
  public weaponOrder: WeaponType[];

  // 旋转飞刀精灵列表
  private bladeSprites: Phaser.GameObjects.Sprite[] = [];
  private bladeAngle: number = 0;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.weapons = new Map();
    this.weaponOrder = [];
  }

  /**
   * 添加新武器，初始 level=1
   */
  addWeapon(type: WeaponType): void {
    if (this.weapons.has(type)) return;

    const data = WEAPONS[type];
    const instance: WeaponInstance = {
      type,
      level: 1,
      timer: 0,
      data,
    };

    this.weapons.set(type, instance);
    this.weaponOrder.push(type);

    // 如果是旋转飞刀，立即创建精灵
    if (type === 'spinning_blade') {
      this.recreateBladeSprites();
    }
  }

  /**
   * 升级武器，返回新等级
   */
  upgradeWeapon(type: WeaponType): number {
    const weapon = this.weapons.get(type);
    if (!weapon) return 0;

    if (weapon.level >= weapon.data.maxLevel) {
      return weapon.level; // 已满级
    }

    weapon.level++;

    // 如果是旋转飞刀，重建精灵
    if (type === 'spinning_blade') {
      this.recreateBladeSprites();
    }

    return weapon.level;
  }

  /**
   * 移除武器
   */
  removeWeapon(type: WeaponType): void {
    if (!this.weapons.has(type)) return;

    this.weapons.delete(type);
    this.weaponOrder = this.weaponOrder.filter(t => t !== type);

    // 如果是旋转飞刀，销毁精灵
    if (type === 'spinning_blade') {
      this.destroyBladeSprites();
    }
  }

  /**
   * 检查是否拥有某武器
   */
  hasWeapon(type: WeaponType): boolean {
    return this.weapons.has(type);
  }

  /**
   * 获取武器等级
   */
  getWeaponLevel(type: WeaponType): number {
    const weapon = this.weapons.get(type);
    return weapon ? weapon.level : 0;
  }

  /**
   * 获取已装备武器列表
   */
  getEquippedWeapons(): WeaponInstance[] {
    return this.weaponOrder
      .map(type => this.weapons.get(type))
      .filter((w): w is WeaponInstance => w !== undefined);
  }

  /**
   * 每帧更新，处理所有武器攻击逻辑
   */
  update(time: number, delta: number, enemies: Phaser.GameObjects.Sprite[]): void {
    for (const type of this.weaponOrder) {
      const weapon = this.weapons.get(type);
      if (!weapon) continue;

      switch (type) {
        case 'spinning_blade':
          this.updateSpinningBlade(weapon, delta, enemies);
          break;
        case 'energy_bullet':
          this.updateEnergyBullet(weapon, time, delta, enemies);
          break;
        case 'lightning_chain':
          this.updateLightningChain(weapon, time, delta, enemies);
          break;
        case 'fire_bottle':
          this.updateFireBottle(weapon, time, delta, enemies);
          break;
      }
    }
  }

  // ==================== 旋转飞刀 ====================

  private recreateBladeSprites(): void {
    this.destroyBladeSprites();

    const weapon = this.weapons.get('spinning_blade');
    if (!weapon) return;

    const count = 2 + weapon.level;
    for (let i = 0; i < count; i++) {
      const sprite = this.scene.add.sprite(0, 0, 'proj_blade');
      sprite.setScale(2);
      sprite.setOrigin(0.5, 0.5);
      sprite.setDepth(5);
      this.bladeSprites.push(sprite);
    }
  }

  private destroyBladeSprites(): void {
    for (const sprite of this.bladeSprites) {
      sprite.destroy();
    }
    this.bladeSprites = [];
  }

  private updateSpinningBlade(weapon: WeaponInstance, delta: number, enemies: Phaser.GameObjects.Sprite[]): void {
    const count = this.bladeSprites.length;
    if (count === 0) return;

    // 旋转速度：每秒旋转 2.5 弧度
    const rotationSpeed = 2.5;
    this.bladeAngle += rotationSpeed * (delta / 1000);

    // 旋转半径随等级增大
    const radius = weapon.data.baseRange + (weapon.level - 1) * 10;

    // 更新每个飞刀的位置
    for (let i = 0; i < count; i++) {
      const angle = this.bladeAngle + (Math.PI * 2 / count) * i;
      const x = this.player.x + Math.cos(angle) * radius;
      const y = this.player.y + Math.sin(angle) * radius;
      this.bladeSprites[i].setPosition(x, y);
      this.bladeSprites[i].setRotation(angle + Math.PI / 2);
    }

    // 计算伤害
    const damage = this.calculateDamage(weapon);

    // 碰撞检测：飞刀与敌人
    for (const sprite of this.bladeSprites) {
      for (const enemy of enemies) {
        if (!(enemy instanceof Enemy) || !enemy.active) continue;

        const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, enemy.x, enemy.y);
        if (dist < 16) {
          // 使用 setData 存储的 hitEnemies 避免同一帧重复伤害
          const hitKey = `blade_hit_${enemy.uid}`;
          const lastHit = sprite.getData(hitKey) as number || 0;
          const now = this.scene.time.now;

          // 每 200ms 可以对同一敌人造成一次伤害
          if (now - lastHit >= 200) {
            sprite.setData(hitKey, now);
            const { finalDamage, isCrit } = this.applyCrit(damage);
            enemy.takeDamage(finalDamage, this.scene);
            this.showDamage(enemy, finalDamage, isCrit);
          }
        }
      }
    }
  }

  // ==================== 能量弹 ====================

  private updateEnergyBullet(weapon: WeaponInstance, time: number, delta: number, enemies: Phaser.GameObjects.Sprite[]): void {
    const cooldown = weapon.data.baseCooldown * (1 - this.player.cooldownReduction);
    weapon.timer += delta;

    if (weapon.timer < cooldown) return;
    if (enemies.length === 0) return;

    weapon.timer = 0;

    // 找到最近的敌人
    const nearestEnemy = this.findNearestEnemy(enemies);
    if (!nearestEnemy) return;

    // 发射子弹数量随等级增加
    const bulletCount = 1 + Math.floor(weapon.level / 2);
    const damage = this.calculateDamage(weapon);

    for (let i = 0; i < bulletCount; i++) {
      // 稍微偏移角度以产生散射效果
      const baseAngle = angleBetween(this.player, nearestEnemy);
      const spread = (i - (bulletCount - 1) / 2) * 0.15;
      const angle = baseAngle + spread;

      const bullet = this.scene.add.sprite(this.player.x, this.player.y, 'proj_bullet');
      bullet.setScale(2);
      bullet.setOrigin(0.5, 0.5);
      bullet.setDepth(5);
      bullet.setData('damage', damage);
      bullet.setData('isEnemy', false);
      bullet.setData('hitEnemies', new Set<number>());
      bullet.setData('speed', weapon.data.projectileSpeed);
      bullet.setData('range', weapon.data.baseRange);
      bullet.setData('angle', angle);
      bullet.setData('startX', this.player.x);
      bullet.setData('startY', this.player.y);
      bullet.setData('type', 'energy_bullet');
      bullet.setRotation(angle);

      // 添加到场景的投射物数组
      this.addProjectile(bullet);
    }
  }

  // ==================== 闪电链 ====================

  private updateLightningChain(weapon: WeaponInstance, time: number, delta: number, enemies: Phaser.GameObjects.Sprite[]): void {
    const cooldown = weapon.data.baseCooldown * (1 - this.player.cooldownReduction);
    weapon.timer += delta;

    if (weapon.timer < cooldown) return;
    if (enemies.length === 0) return;

    weapon.timer = 0;

    // 找到附近的敌人（在范围内）
    const range = weapon.data.baseRange + (weapon.level - 1) * 15;
    const nearbyEnemies = enemies.filter(e => {
      if (!(e instanceof Enemy) || !e.active) return false;
      return distBetween(this.player, e) <= range;
    });

    if (nearbyEnemies.length === 0) return;

    // 跳跃次数随等级增加
    const jumpCount = 2 + weapon.level;
    const damage = this.calculateDamage(weapon);

    // 随机选择第一个目标
    let current = pickRandom(nearbyEnemies) as Enemy;
    const hitSet = new Set<number>();
    hitSet.add(current.uid);

    for (let i = 0; i < jumpCount; i++) {
      // 对当前目标造成伤害
      const { finalDamage, isCrit } = this.applyCrit(damage);
      current.takeDamage(finalDamage, this.scene);
      this.showDamage(current, finalDamage, isCrit);

      // 显示闪电效果
      this.showLightningEffect(current.x, current.y);

      // 如果敌人已死亡，停止跳跃
      if (current.hp <= 0) break;

      // 找到下一个跳跃目标（在跳跃范围内的未命中敌人）
      const jumpRange = weapon.data.baseRange * 0.8;
      const nextTargets = nearbyEnemies.filter(e => {
        if (!(e instanceof Enemy) || !e.active) return false;
        if (hitSet.has(e.uid)) return false;
        return distBetween(current, e) <= jumpRange;
      });

      if (nextTargets.length === 0) break;

      current = pickRandom(nextTargets) as Enemy;
      hitSet.add(current.uid);
    }
  }

  private showLightningEffect(x: number, y: number): void {
    const lightning = this.scene.add.sprite(x, y, 'proj_lightning');
    lightning.setScale(2);
    lightning.setOrigin(0.5, 0.5);
    lightning.setDepth(10);
    lightning.setAlpha(0.8);

    // 短暂显示后销毁
    this.scene.time.delayedCall(150, () => {
      lightning.destroy();
    });
  }

  // ==================== 火焰瓶 ====================

  private updateFireBottle(weapon: WeaponInstance, time: number, delta: number, enemies: Phaser.GameObjects.Sprite[]): void {
    const cooldown = weapon.data.baseCooldown * (1 - this.player.cooldownReduction);
    weapon.timer += delta;

    if (weapon.timer < cooldown) return;
    if (enemies.length === 0) return;

    weapon.timer = 0;

    // 投掷数量随等级增加
    const bottleCount = 1 + Math.floor(weapon.level / 2);
    const damage = this.calculateDamage(weapon);

    for (let i = 0; i < bottleCount; i++) {
      // 随机选择一个敌人作为目标
      const target = pickRandom(enemies);
      if (!target || !(target instanceof Enemy) || !target.active) continue;

      const angle = angleBetween(this.player, target);

      const bottle = this.scene.add.sprite(this.player.x, this.player.y, 'proj_fire_bottle');
      bottle.setScale(2);
      bottle.setOrigin(0.5, 0.5);
      bottle.setDepth(5);
      bottle.setData('damage', damage);
      bottle.setData('isEnemy', false);
      bottle.setData('hitEnemies', new Set<number>());
      bottle.setData('speed', weapon.data.projectileSpeed);
      bottle.setData('range', weapon.data.baseRange);
      bottle.setData('angle', angle);
      bottle.setData('startX', this.player.x);
      bottle.setData('startY', this.player.y);
      bottle.setData('type', 'fire_bottle');
      bottle.setData('weaponLevel', weapon.level);
      bottle.setData('explosionRange', weapon.data.baseRange * 0.5 + (weapon.level - 1) * 10);
      bottle.setRotation(angle);

      this.addProjectile(bottle);
    }
  }

  /**
   * 火焰瓶落地爆炸处理，由 GameScene 调用
   */
  handleFireBottleExplosion(x: number, y: number, damage: number, explosionRange: number, enemies: Phaser.GameObjects.Sprite[]): void {
    // 显示爆炸效果
    const explosion = this.scene.add.sprite(x, y, 'fire_explosion');
    explosion.setScale(2);
    explosion.setOrigin(0.5, 0.5);
    explosion.setDepth(10);
    explosion.setAlpha(0.9);

    // 短暂显示后销毁
    this.scene.time.delayedCall(300, () => {
      explosion.destroy();
    });

    // 对范围内敌人造成伤害
    for (const enemy of enemies) {
      if (!(enemy instanceof Enemy) || !enemy.active) continue;

      const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (dist <= explosionRange) {
        const { finalDamage, isCrit } = this.applyCrit(damage);
        enemy.takeDamage(finalDamage, this.scene);
        this.showDamage(enemy, finalDamage, isCrit);
      }
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 计算武器基础伤害（含等级加成）
   */
  private calculateDamage(weapon: WeaponInstance): number {
    return weapon.data.baseDamage * (1 + (weapon.level - 1) * 0.25);
  }

  /**
   * 应用暴击判定
   */
  private applyCrit(baseDamage: number): { finalDamage: number; isCrit: boolean } {
    const isCrit = Math.random() < this.player.critRate;
    const finalDamage = isCrit
      ? Math.floor(baseDamage * this.player.critDamage)
      : Math.floor(baseDamage);
    return { finalDamage, isCrit };
  }

  /**
   * 显示伤害数字
   */
  private showDamage(enemy: Phaser.GameObjects.Sprite, damage: number, isCrit: boolean): void {
    if ((this.scene as any).showDamageText) {
      (this.scene as any).showDamageText(enemy.x, enemy.y, damage, isCrit);
    }
  }

  /**
   * 找到最近的存活敌人
   */
  private findNearestEnemy(enemies: Phaser.GameObjects.Sprite[]): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;

    for (const enemy of enemies) {
      if (!(enemy instanceof Enemy) || !enemy.active) continue;

      const dist = distBetween(this.player, enemy);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }

  /**
   * 将投射物添加到场景的 projectiles 数组
   */
  private addProjectile(sprite: Phaser.GameObjects.Sprite): void {
    const sceneAny = this.scene as any;
    if (!sceneAny.projectiles) {
      sceneAny.projectiles = [];
    }
    sceneAny.projectiles.push(sprite);
  }

  /**
   * 销毁所有武器相关资源
   */
  destroy(): void {
    this.destroyBladeSprites();
    this.weapons.clear();
    this.weaponOrder = [];
  }
}

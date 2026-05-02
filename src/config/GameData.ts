export type WeaponType = 'spinning_blade' | 'energy_bullet' | 'lightning_chain' | 'fire_bottle';
export type EnemyType = 'slime' | 'zombie' | 'ghost' | 'skeleton_mage' | 'boss_slime';
export type PassiveType = 'max_hp' | 'move_speed' | 'pickup_range' | 'exp_bonus' | 'armor' | 'regen' | 'crit_rate' | 'crit_damage' | 'cooldown_reduction' | 'weapon_slots';

export interface WeaponData {
  type: WeaponType;
  name: string;
  description: string;
  iconColor: number;
  baseDamage: number;
  baseCooldown: number;
  baseRange: number;
  maxLevel: number;
  projectileCount: number;
  projectileSpeed: number;
}

export interface EnemyData {
  type: EnemyType;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  expValue: number;
  size: number;
  color: number;
  behavior: 'chase' | 'dash' | 'ranged';
  attackInterval?: number;
  projectileSpeed?: number;
}

export interface PassiveData {
  type: PassiveType;
  name: string;
  description: string;
  maxLevel: number;
  valuePerLevel: number;
  iconColor: number;
}

export const WEAPONS: Record<WeaponType, WeaponData> = {
  spinning_blade: {
    type: 'spinning_blade',
    name: '旋转飞刀',
    description: '环绕角色旋转的飞刀',
    iconColor: 0xcccccc,
    baseDamage: 12,
    baseCooldown: 0,
    baseRange: 60,
    maxLevel: 8,
    projectileCount: 2,
    projectileSpeed: 0,
  },
  energy_bullet: {
    type: 'energy_bullet',
    name: '能量弹',
    description: '自动射向最近敌人',
    iconColor: 0x44aaff,
    baseDamage: 10,
    baseCooldown: 800,
    baseRange: 250,
    maxLevel: 8,
    projectileCount: 1,
    projectileSpeed: 300,
  },
  lightning_chain: {
    type: 'lightning_chain',
    name: '闪电链',
    description: '随机电弧跳跃攻击',
    iconColor: 0xffff44,
    baseDamage: 15,
    baseCooldown: 1500,
    baseRange: 120,
    maxLevel: 8,
    projectileCount: 3,
    projectileSpeed: 0,
  },
  fire_bottle: {
    type: 'fire_bottle',
    name: '火焰瓶',
    description: '投掷燃烧瓶造成范围伤害',
    iconColor: 0xff6622,
    baseDamage: 20,
    baseCooldown: 2000,
    baseRange: 180,
    maxLevel: 8,
    projectileCount: 1,
    projectileSpeed: 200,
  },
};

export const ENEMIES: Record<EnemyType, EnemyData> = {
  slime: {
    type: 'slime',
    name: '史莱姆',
    hp: 15,
    speed: 50,
    damage: 8,
    expValue: 3,
    size: 12,
    color: 0x44cc44,
    behavior: 'chase',
  },
  zombie: {
    type: 'zombie',
    name: '僵尸',
    hp: 30,
    speed: 35,
    damage: 12,
    expValue: 5,
    size: 14,
    color: 0x668844,
    behavior: 'chase',
  },
  ghost: {
    type: 'ghost',
    name: '幽灵',
    hp: 20,
    speed: 80,
    damage: 10,
    expValue: 6,
    size: 12,
    color: 0xaaaaff,
    behavior: 'dash',
    attackInterval: 2000,
  },
  skeleton_mage: {
    type: 'skeleton_mage',
    name: '骷髅法师',
    hp: 25,
    speed: 30,
    damage: 15,
    expValue: 8,
    size: 14,
    color: 0xddddcc,
    behavior: 'ranged',
    attackInterval: 2500,
    projectileSpeed: 150,
  },
  boss_slime: {
    type: 'boss_slime',
    name: '巨型史莱姆',
    hp: 500,
    speed: 40,
    damage: 20,
    expValue: 100,
    size: 32,
    color: 0xff4444,
    behavior: 'chase',
  },
};

export const PASSIVES: Record<PassiveType, PassiveData> = {
  max_hp: { type: 'max_hp', name: '最大生命', description: '生命上限 +20', maxLevel: 5, valuePerLevel: 20, iconColor: 0xff4444 },
  move_speed: { type: 'move_speed', name: '移动速度', description: '移速 +10%', maxLevel: 5, valuePerLevel: 0.1, iconColor: 0x44ff44 },
  pickup_range: { type: 'pickup_range', name: '拾取范围', description: '拾取范围 +20%', maxLevel: 5, valuePerLevel: 0.2, iconColor: 0x4488ff },
  exp_bonus: { type: 'exp_bonus', name: '经验加成', description: '经验 +15%', maxLevel: 5, valuePerLevel: 0.15, iconColor: 0xaa44ff },
  armor: { type: 'armor', name: '护甲', description: '减伤 +5%', maxLevel: 5, valuePerLevel: 0.05, iconColor: 0xcccc44 },
  regen: { type: 'regen', name: '回血', description: '每秒回血 +1', maxLevel: 5, valuePerLevel: 1, iconColor: 0xff88aa },
  crit_rate: { type: 'crit_rate', name: '暴击率', description: '暴击率 +5%', maxLevel: 5, valuePerLevel: 0.05, iconColor: 0xff8800 },
  crit_damage: { type: 'crit_damage', name: '暴击伤害', description: '暴击伤害 +25%', maxLevel: 5, valuePerLevel: 0.25, iconColor: 0xff0044 },
  cooldown_reduction: { type: 'cooldown_reduction', name: '冷却缩减', description: '武器冷却 -8%', maxLevel: 5, valuePerLevel: 0.08, iconColor: 0x00ccff },
  weapon_slots: { type: 'weapon_slots', name: '武器栏位', description: '可装备更多武器', maxLevel: 2, valuePerLevel: 1, iconColor: 0xffaaff },
};

export const WEAPON_TYPES: WeaponType[] = ['spinning_blade', 'energy_bullet', 'lightning_chain', 'fire_bottle'];
export const ENEMY_TYPES: EnemyType[] = ['slime', 'zombie', 'ghost', 'skeleton_mage'];
export const PASSIVE_TYPES: PassiveType[] = ['max_hp', 'move_speed', 'pickup_range', 'exp_bonus', 'armor', 'regen', 'crit_rate', 'crit_damage', 'cooldown_reduction', 'weapon_slots'];

export function expToLevel(level: number): number {
  return Math.floor(10 * Math.pow(1.3, level - 1));
}

export function getEnemyPool(elapsedSeconds: number): EnemyType[] {
  const pool: EnemyType[] = ['slime'];
  if (elapsedSeconds > 30) pool.push('zombie');
  if (elapsedSeconds > 60) pool.push('ghost');
  if (elapsedSeconds > 90) pool.push('skeleton_mage');
  return pool;
}

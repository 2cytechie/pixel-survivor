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

// ─── Game Modes ──────────────────────────────────────────

export type GameMode = 'classic' | 'endless' | 'boss_rush' | 'daily_challenge';

export interface GameModeData {
  type: GameMode;
  name: string;
  description: string;
  iconColor: number;
  timeLimit: number; // 0 = no limit
  enemyHpMult: number;
  enemySpeedMult: number;
  spawnRateMult: number;
  bossInterval: number; // seconds, 0 = no boss
}

export const GAME_MODES: Record<GameMode, GameModeData> = {
  classic: {
    type: 'classic',
    name: '经典模式',
    description: '存活5分钟，击杀尽可能多的敌人',
    iconColor: 0x44aaff,
    timeLimit: 300,
    enemyHpMult: 1,
    enemySpeedMult: 1,
    spawnRateMult: 1,
    bossInterval: 60,
  },
  endless: {
    type: 'endless',
    name: '无尽模式',
    description: '没有时间限制，敌人无限增强',
    iconColor: 0xff4444,
    timeLimit: 0,
    enemyHpMult: 1,
    enemySpeedMult: 1,
    spawnRateMult: 1,
    bossInterval: 45,
  },
  boss_rush: {
    type: 'boss_rush',
    name: 'Boss Rush',
    description: '每波只有BOSS，击败后进入下一波',
    iconColor: 0xffcc00,
    timeLimit: 0,
    enemyHpMult: 1,
    enemySpeedMult: 1.2,
    spawnRateMult: 0,
    bossInterval: 0,
  },
  daily_challenge: {
    type: 'daily_challenge',
    name: '每日挑战',
    description: '特殊规则：速度x2，敌人血量x2',
    iconColor: 0xaa44ff,
    timeLimit: 300,
    enemyHpMult: 2,
    enemySpeedMult: 2,
    spawnRateMult: 1.5,
    bossInterval: 60,
  },
};

export const GAME_MODE_TYPES: GameMode[] = ['classic', 'endless', 'boss_rush', 'daily_challenge'];

// ─── Characters ──────────────────────────────────────────

export type CharacterType = 'warrior' | 'mage' | 'ranger';

export interface CharacterData {
  type: CharacterType;
  name: string;
  description: string;
  iconColor: number;
  bodyColor: number;
  maxHp: number;
  speed: number;
  armor: number;
  regen: number;
  critRate: number;
  critDamage: number;
  cooldownReduction: number;
  startWeapon: WeaponType;
  bonusPassive: PassiveType;
  bonusPassiveLevel: number;
}

export const CHARACTERS: Record<CharacterType, CharacterData> = {
  warrior: {
    type: 'warrior',
    name: '战士',
    description: '高血量高护甲，近战型',
    iconColor: 0xff4444,
    bodyColor: 0xff4444,
    maxHp: 150,
    speed: 140,
    armor: 0.1,
    regen: 1,
    critRate: 0.05,
    critDamage: 1.5,
    cooldownReduction: 0,
    startWeapon: 'spinning_blade',
    bonusPassive: 'max_hp',
    bonusPassiveLevel: 2,
  },
  mage: {
    type: 'mage',
    name: '法师',
    description: '高暴击高伤害，远程型',
    iconColor: 0x8844cc,
    bodyColor: 0x8844cc,
    maxHp: 80,
    speed: 160,
    armor: 0,
    regen: 0,
    critRate: 0.15,
    critDamage: 2.0,
    cooldownReduction: 0.16,
    startWeapon: 'energy_bullet',
    bonusPassive: 'cooldown_reduction',
    bonusPassiveLevel: 2,
  },
  ranger: {
    type: 'ranger',
    name: '游侠',
    description: '高移速高拾取，均衡型',
    iconColor: 0x44cc44,
    bodyColor: 0x44cc44,
    maxHp: 100,
    speed: 200,
    armor: 0.05,
    regen: 0,
    critRate: 0.1,
    critDamage: 1.75,
    cooldownReduction: 0.08,
    startWeapon: 'lightning_chain',
    bonusPassive: 'move_speed',
    bonusPassiveLevel: 2,
  },
};

export const CHARACTER_TYPES: CharacterType[] = ['warrior', 'mage', 'ranger'];

// ─── Achievements ────────────────────────────────────────

export interface AchievementData {
  id: string;
  name: string;
  description: string;
  iconColor: number;
  condition: (stats: GameStats) => boolean;
}

export interface GameStats {
  mode: GameMode;
  character: CharacterType;
  time: number;
  kills: number;
  level: number;
  gold: number;
  bossKills: number;
  won: boolean;
}

export const ACHIEVEMENTS: AchievementData[] = [
  { id: 'first_win', name: '初次胜利', description: '在经典模式中存活5分钟', iconColor: 0xffcc00, condition: s => s.mode === 'classic' && s.won },
  { id: 'survive_10min', name: '久经沙场', description: '在无尽模式中存活超过10分钟', iconColor: 0x44aaff, condition: s => s.mode === 'endless' && s.time >= 600 },
  { id: 'survive_20min', name: '不朽传说', description: '在无尽模式中存活超过20分钟', iconColor: 0xff44ff, condition: s => s.mode === 'endless' && s.time >= 1200 },
  { id: 'kill_100', name: '百人斩', description: '单局击杀100个敌人', iconColor: 0xff4444, condition: s => s.kills >= 100 },
  { id: 'kill_500', name: '千人斩', description: '单局击杀500个敌人', iconColor: 0xff8800, condition: s => s.kills >= 500 },
  { id: 'kill_1000', name: '万人敌', description: '单局击杀1000个敌人', iconColor: 0xff0000, condition: s => s.kills >= 1000 },
  { id: 'level_10', name: '身经百战', description: '达到10级', iconColor: 0x44ff44, condition: s => s.level >= 10 },
  { id: 'level_20', name: '登峰造极', description: '达到20级', iconColor: 0x00ff88, condition: s => s.level >= 20 },
  { id: 'boss_5', name: '猎魔人', description: '单局击杀5个BOSS', iconColor: 0xffcc44, condition: s => s.bossKills >= 5 },
  { id: 'boss_10', name: '屠龙者', description: '单局击杀10个BOSS', iconColor: 0xffaa00, condition: s => s.bossKills >= 10 },
  { id: 'boss_rush_5', name: 'Boss Rusher', description: '在Boss Rush中击败5波BOSS', iconColor: 0xff6600, condition: s => s.mode === 'boss_rush' && s.bossKills >= 5 },
  { id: 'daily_clear', name: '每日达人', description: '通关每日挑战', iconColor: 0xaa44ff, condition: s => s.mode === 'daily_challenge' && s.won },
  { id: 'gold_500', name: '富甲一方', description: '单局获得500金币', iconColor: 0xffcc00, condition: s => s.gold >= 500 },
  { id: 'play_all_chars', name: '全能勇士', description: '使用全部3个角色通关经典模式', iconColor: 0xffffff, condition: () => false }, // 特殊处理
];

export const GameConfig = {
  // 游戏设计分辨率
  WIDTH: 800,
  HEIGHT: 600,

  // 像素缩放
  PIXEL_SCALE: 2,

  // 玩家
  PLAYER: {
    SPEED: 160,
    MAX_HP: 100,
    INVINCIBLE_TIME: 500,
    PICKUP_RANGE: 60,
  },

  // 经验与升级
  EXP: {
    BASE_EXP_TO_LEVEL: 10,
    EXP_GROWTH: 1.3,
    GEM_SIZE: 8,
    GEM_MAGNET_SPEED: 300,
  },

  // 怪物
  ENEMY: {
    SPAWN_INTERVAL_INITIAL: 1500,
    SPAWN_INTERVAL_MIN: 300,
    SPAWN_DISTANCE_MIN: 300,
    SPAWN_DISTANCE_MAX: 500,
    MAX_ENEMIES: 200,
    DAMAGE_PUSHBACK: 100,
  },

  // 关卡
  LEVEL: {
    DURATION: 300, // 5 minutes in seconds
    DIFFICULTY_SCALE_TIME: 30, // difficulty scales every 30s
  },

  // 武器
  WEAPON: {
    MAX_SLOTS: 6,
  },

  // 掉落
  LOOT: {
    EXP_GEM_CHANCE: 1.0,
    GOLD_CHANCE: 0.15,
    HEAL_CHANCE: 0.02,
    GOLD_VALUE_MIN: 1,
    GOLD_VALUE_MAX: 5,
    HEAL_AMOUNT: 15,
  },

  // 视觉
  VISUAL: {
    BG_COLOR: 0x2d5a1e,
    GRID_SIZE: 32,
    DAMAGE_TEXT_DURATION: 800,
    KILL_EFFECT_DURATION: 300,
  },

  // 地图边界
  MAP: {
    WIDTH: 3200,
    HEIGHT: 3200,
  },
};

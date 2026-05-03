import { GameStats, AchievementData, ACHIEVEMENTS, CharacterType } from '../config/GameData';

const STORAGE_KEY = 'pixel_survivor_achievements';

interface AchievementRecord {
  id: string;
  unlockedAt: number;
}

interface BestRecords {
  bestTime: number;
  bestKills: number;
  bestLevel: number;
  classicWinChars: CharacterType[];
}

export class AchievementManager {
  private unlocked: Map<string, AchievementRecord> = new Map();
  private records: BestRecords = {
    bestTime: 0,
    bestKills: 0,
    bestLevel: 0,
    classicWinChars: [],
  };

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.unlocked) {
          for (const r of data.unlocked) {
            this.unlocked.set(r.id, r);
          }
        }
        if (data.records) {
          this.records = { ...this.records, ...data.records };
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  save(): void {
    try {
      const data = {
        unlocked: Array.from(this.unlocked.values()),
        records: this.records,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }

  checkAchievements(stats: GameStats): AchievementData[] {
    const newlyUnlocked: AchievementData[] = [];

    for (const ach of ACHIEVEMENTS) {
      if (this.unlocked.has(ach.id)) continue;

      let unlocked = false;

      // Special case: play_all_chars
      if (ach.id === 'play_all_chars') {
        if (stats.mode === 'classic' && stats.won) {
          if (!this.records.classicWinChars.includes(stats.character)) {
            this.records.classicWinChars.push(stats.character);
          }
          unlocked = this.records.classicWinChars.length >= 3;
        }
      } else {
        unlocked = ach.condition(stats);
      }

      if (unlocked) {
        this.unlocked.set(ach.id, { id: ach.id, unlockedAt: Date.now() });
        newlyUnlocked.push(ach);
      }
    }

    // Update best records
    if (stats.time > this.records.bestTime) this.records.bestTime = stats.time;
    if (stats.kills > this.records.bestKills) this.records.bestKills = stats.kills;
    if (stats.level > this.records.bestLevel) this.records.bestLevel = stats.level;

    if (newlyUnlocked.length > 0) {
      this.save();
    }

    return newlyUnlocked;
  }

  isUnlocked(id: string): boolean {
    return this.unlocked.has(id);
  }

  getUnlockedCount(): number {
    return this.unlocked.size;
  }

  getTotalCount(): number {
    return ACHIEVEMENTS.length;
  }

  getAllUnlocked(): AchievementRecord[] {
    return Array.from(this.unlocked.values());
  }

  getRecords(): BestRecords {
    return { ...this.records };
  }
}

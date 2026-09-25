import { GameState, AntiqueItem } from '../types/game';
import { INITIAL_ITEMS, STORE_UPGRADES, CITIES } from '../data/items';
import { soundManager } from '../audio/soundManager';

const STORAGE_KEY = 'vintage_vault_save_v1';

export class GameStateManager {
  private state: GameState;
  public listeners: ((state: GameState) => void)[] = [];

  constructor() {
    this.state = this.loadState();
    this.startApprenticeLoop();
  }

  private getDefaultState(): GameState {
    // Generate 2 starting mystery uncleaned items
    const starterItems: AntiqueItem[] = [
      {
        ...INITIAL_ITEMS[0], // Pocket watch
        id: 'item_start_1',
        cleanedPercent: 15,
        polishedPercent: 0,
        mechanismFixed: false,
        goldInlaid: false,
        grade: 'D',
        currentValue: INITIAL_ITEMS[0].baseValue
      },
      {
        ...INITIAL_ITEMS[3], // Ottoman Coffee Grinder
        id: 'item_start_2',
        cleanedPercent: 5,
        polishedPercent: 0,
        mechanismFixed: false,
        goldInlaid: false,
        grade: 'D',
        currentValue: INITIAL_ITEMS[3].baseValue
      }
    ];

    return {
      cash: 1200,
      gems: 10,
      fame: 50,
      day: 1,
      activeCityId: 'city_istanbul',
      inventory: starterItems,
      selectedItemForRestorationId: starterItems[0].id,
      upgrades: {
        pedestal: 0,
        lighting: 0,
        gramophone: 0,
        apprentice: 0
      },
      unlockedCities: ['city_istanbul'],
      restoredCatalog: [],
      totalEarnings: 0,
      totalRestored: 0,
      soundEnabled: true,
      musicEnabled: true
    };
  }

  private loadState(): GameState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...this.getDefaultState(), ...parsed };
      }
    } catch (_) {}
    return this.getDefaultState();
  }

  public save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (_) {}
    this.notify();
  }

  public getState(): GameState {
    return this.state;
  }

  public subscribe(cb: (state: GameState) => void) {
    this.listeners.push(cb);
    cb(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  // --- Actions ---

  public addCash(amount: number) {
    this.state.cash += amount;
    this.state.totalEarnings += amount;
    this.save();
  }

  public spendCash(amount: number): boolean {
    if (this.state.cash < amount) return false;
    this.state.cash -= amount;
    this.save();
    return true;
  }

  public addFame(amount: number) {
    this.state.fame += amount;
    this.save();
  }

  public addItem(item: AntiqueItem) {
    this.state.inventory.push(item);
    if (!this.state.selectedItemForRestorationId) {
      this.state.selectedItemForRestorationId = item.id;
    }
    this.save();
  }

  public removeItem(itemId: string) {
    this.state.inventory = this.state.inventory.filter((i) => i.id !== itemId);
    if (this.state.selectedItemForRestorationId === itemId) {
      this.state.selectedItemForRestorationId = this.state.inventory[0]?.id || null;
    }
    this.save();
  }

  public updateItem(updated: AntiqueItem) {
    const idx = this.state.inventory.findIndex((i) => i.id === updated.id);
    if (idx !== -1) {
      this.state.inventory[idx] = updated;

      // Check if item newly reached S tier
      if (updated.grade === 'S' && !this.state.restoredCatalog.includes(updated.nameTr)) {
        this.state.restoredCatalog.push(updated.nameTr);
        this.state.totalRestored++;
        this.state.fame += 100;
      }
      this.save();
    }
  }

  public selectItemForRestoration(id: string) {
    this.state.selectedItemForRestorationId = id;
    this.save();
  }

  public buyUpgrade(upgradeId: string): boolean {
    const upgrade = STORE_UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) return false;

    const currentLvl = this.state.upgrades[upgradeId] || 0;
    if (currentLvl >= upgrade.maxLevel) return false;

    const cost = Math.round(upgrade.cost * Math.pow(1.5, currentLvl));
    if (this.spendCash(cost)) {
      this.state.upgrades[upgradeId] = currentLvl + 1;
      this.state.fame += 50;
      soundManager.playCashRegister();
      soundManager.playGradeUpgrade();
      this.save();
      return true;
    }
    return false;
  }

  public unlockCity(cityId: string): boolean {
    const city = CITIES.find((c) => c.id === cityId);
    if (!city || this.state.unlockedCities.includes(cityId)) return false;
    if (this.state.fame < city.requiredFame) return false;

    if (this.spendCash(city.unlockCost)) {
      this.state.unlockedCities.push(cityId);
      this.state.activeCityId = cityId;
      soundManager.playGradeUpgrade();
      this.save();
      return true;
    }
    return false;
  }

  public setActiveCity(cityId: string) {
    if (this.state.unlockedCities.includes(cityId)) {
      this.state.activeCityId = cityId;
      this.save();
    }
  }

  private startApprenticeLoop() {
    // If apprentice is hired, clean 1 random uncleaned item every 20s
    window.setInterval(() => {
      const lvl = this.state.upgrades.apprentice || 0;
      if (lvl <= 0) return;

      const uncleaned = this.state.inventory.find((i) => i.cleanedPercent < 100);
      if (uncleaned) {
        uncleaned.cleanedPercent = Math.min(100, uncleaned.cleanedPercent + 10 * lvl);
        if (uncleaned.cleanedPercent >= 90 && uncleaned.polishedPercent < 100) {
          uncleaned.polishedPercent = Math.min(100, uncleaned.polishedPercent + 5 * lvl);
        }
        if (uncleaned.cleanedPercent >= 30 && uncleaned.grade === 'D') uncleaned.grade = 'C';
        if (uncleaned.cleanedPercent >= 90 && uncleaned.polishedPercent >= 40 && uncleaned.grade === 'C') uncleaned.grade = 'B';
        uncleaned.currentValue = Math.round(uncleaned.baseValue * (uncleaned.grade === 'B' ? 2.2 : uncleaned.grade === 'C' ? 1.5 : 1.0));
        this.save();
      }
    }, 18000);
  }
}

export const gameStateManager = new GameStateManager();

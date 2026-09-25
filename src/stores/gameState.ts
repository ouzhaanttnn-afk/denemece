import { GameState, AntiqueItem, Achievement } from '../types/game';
import { INITIAL_ITEMS, STORE_UPGRADES, CITIES } from '../data/items';
import { soundManager } from '../audio/soundManager';
import { confetti } from '../render/confetti';

const STORAGE_KEY = 'vintage_vault_save_v2';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_auction',
    titleTr: 'İlk Müzayede Zaferi',
    descTr: 'Depo savaşlarında ilk açık artırmanı kazan.',
    icon: '🔨',
    rewardCash: 350,
    rewardFame: 50,
    unlocked: false
  },
  {
    id: 'first_s_tier',
    titleTr: 'Altın Varaklı Şaheser',
    descTr: 'Atölyede bir eşyayı kusursuz S-Tier seviyesine çıkar.',
    icon: '✨',
    rewardCash: 600,
    rewardFame: 100,
    unlocked: false
  },
  {
    id: 'five_deals',
    titleTr: 'Kurt Pazarlıkçı',
    descTr: 'Dükkanında 5 müşteriye başarıyla satış yap.',
    icon: '🤝',
    rewardCash: 500,
    rewardFame: 80,
    unlocked: false
  },
  {
    id: 'big_earner',
    titleTr: 'Antika Baronu',
    descTr: 'Toplamda ₺10.000 ciro eşiğini aş.',
    icon: '💰',
    rewardCash: 1500,
    rewardFame: 250,
    unlocked: false
  },
  {
    id: 'world_trader',
    titleTr: 'Küresel Küratör',
    descTr: 'İstanbul dışında yeni bir dünya şehrinde şube aç.',
    icon: '🌍',
    rewardCash: 1000,
    rewardFame: 200,
    unlocked: false
  }
];

export class GameStateManager {
  private state: GameState;
  public listeners: ((state: GameState) => void)[] = [];

  constructor() {
    this.state = this.loadState();
    this.startApprenticeLoop();
  }

  private getDefaultState(): GameState {
    const starterItems: AntiqueItem[] = [
      {
        ...INITIAL_ITEMS[0],
        id: 'item_start_1',
        cleanedPercent: 15,
        polishedPercent: 0,
        mechanismFixed: false,
        goldInlaid: false,
        grade: 'D',
        currentValue: INITIAL_ITEMS[0].baseValue
      },
      {
        ...INITIAL_ITEMS[3],
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
      achievements: INITIAL_ACHIEVEMENTS,
      profile: {
        name: 'Üstad Alper',
        shopName: 'Saray Antikacısı',
        avatar: '🎩',
        title: 'Baş Küratör',
        reputationLevel: 1,
        auctionsWon: 0,
        negotiationsCompleted: 0,
        lifetimeEarnings: 0
      },
      totalEarnings: 0,
      totalRestored: 0,
      soundEnabled: true,
      musicEnabled: true,
      fxVolume: 0.8,
      bgmVolume: 0.5
    };
  }

  private loadState(): GameState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const def = this.getDefaultState();
        return {
          ...def,
          ...parsed,
          profile: {
            ...def.profile,
            ...(parsed.profile || {}),
            shopName: parsed.profile?.shopName || parsed.profile?.name || def.profile.shopName
          }
        };
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

  // --- Profile Actions ---

  public updateProfileName(name: string) {
    this.state.profile.name = name.trim() || 'Üstad Alper';
    this.save();
  }

  public updateShopName(shopName: string) {
    this.state.profile.shopName = shopName.trim() || 'Saray Antikacısı';
    this.save();
  }

  public updateProfileAvatar(avatar: string) {
    this.state.profile.avatar = avatar;
    this.save();
  }

  public updateVolumes(fx: number, bgm: number) {
    this.state.fxVolume = fx;
    this.state.bgmVolume = bgm;
    this.save();
  }

  public recordAuctionWin() {
    this.state.profile.auctionsWon++;
    this.checkAchievements();
    this.save();
  }

  public recordNegotiationSuccess(earned: number) {
    this.state.profile.negotiationsCompleted++;
    this.state.profile.lifetimeEarnings += earned;
    this.updateDealerTitle();
    this.checkAchievements();
    this.save();
  }

  private updateDealerTitle() {
    const earned = this.state.profile.lifetimeEarnings;
    const restored = this.state.totalRestored;

    if (earned >= 50000 && restored >= 10) {
      this.state.profile.title = 'Efsanevi Antika Küratörü';
      this.state.profile.reputationLevel = 5;
    } else if (earned >= 25000) {
      this.state.profile.title = 'Uluslararası Antika Baronu';
      this.state.profile.reputationLevel = 4;
    } else if (earned >= 10000) {
      this.state.profile.title = 'Baş Ekspertiz Ustası';
      this.state.profile.reputationLevel = 3;
    } else if (earned >= 3000) {
      this.state.profile.title = 'Kalfa Zanaatkar';
      this.state.profile.reputationLevel = 2;
    } else {
      this.state.profile.title = 'Çırak Restoratör';
      this.state.profile.reputationLevel = 1;
    }
  }

  public checkAchievements() {
    let unlockedAny = false;

    this.state.achievements.forEach((ach) => {
      if (ach.unlocked) return;

      let qualify = false;
      if (ach.id === 'first_auction' && this.state.profile.auctionsWon >= 1) qualify = true;
      if (ach.id === 'first_s_tier' && this.state.totalRestored >= 1) qualify = true;
      if (ach.id === 'five_deals' && this.state.profile.negotiationsCompleted >= 5) qualify = true;
      if (ach.id === 'big_earner' && this.state.totalEarnings >= 10000) qualify = true;
      if (ach.id === 'world_trader' && this.state.unlockedCities.length >= 2) qualify = true;

      if (qualify) {
        ach.unlocked = true;
        this.state.cash += ach.rewardCash;
        this.state.fame += ach.rewardFame;
        unlockedAny = true;
      }
    });

    if (unlockedAny) {
      soundManager.playCashRegister();
      soundManager.playGradeUpgrade();
      confetti.explode(80);
    }
  }

  // --- Economy Actions ---

  public addCash(amount: number) {
    this.state.cash += amount;
    this.state.totalEarnings += amount;
    this.updateDealerTitle();
    this.checkAchievements();
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

      if (updated.grade === 'S' && !this.state.restoredCatalog.includes(updated.nameTr)) {
        this.state.restoredCatalog.push(updated.nameTr);
        this.state.totalRestored++;
        this.state.fame += 100;
        this.checkAchievements();
        confetti.explode(100);
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
      this.checkAchievements();
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

  public exportSave(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importSave(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed.cash === 'number') {
        this.state = { ...this.getDefaultState(), ...parsed };
        this.save();
        return true;
      }
    } catch (_) {}
    return false;
  }

  public resetGame() {
    this.state = this.getDefaultState();
    this.save();
  }

  private startApprenticeLoop() {
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

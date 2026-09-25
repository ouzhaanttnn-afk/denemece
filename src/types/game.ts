export type ItemRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export type RestorationGrade = 'D' | 'C' | 'B' | 'A' | 'S';

export interface AntiqueItem {
  id: string;
  name: string;
  nameTr: string;
  category: 'Horology' | 'Optics' | 'Weapons' | 'Music' | 'Domestic' | 'Artifacts';
  categoryTr: string;
  period: string;
  rarity: ItemRarity;
  description: string;
  descriptionTr: string;
  modelKey: 'pocket_watch' | 'spyglass' | 'lamp' | 'dagger' | 'coffee_grinder' | 'radio' | 'roman_coin' | 'camera';
  baseValue: number;
  // Restoration progress 0 to 100
  cleanedPercent: number;
  polishedPercent: number;
  mechanismFixed: boolean;
  goldInlaid: boolean;
  grade: RestorationGrade;
  currentValue: number;
  restoredAt?: number;
}

export interface Customer {
  id: string;
  name: string;
  archetype: 'Collector' | 'BargainHunter' | 'Tourist' | 'Mobster' | 'Grandma';
  avatar: string;
  patience: number; // 0 - 100
  maxPatience: number;
  budgetMultiplier: number;
  targetItemId: string;
  currentOffer: number;
  dialogue: string;
}

export interface AuctionLot {
  id: string;
  title: string;
  titleTr: string;
  location: string;
  tier: 'Attic' | 'Barn' | 'Vault';
  cost: number;
  minItems: number;
  maxItems: number;
  potentialProfit: string;
  descriptionTr: string;
}

export interface StoreUpgrade {
  id: string;
  title: string;
  titleTr: string;
  descTr: string;
  cost: number;
  icon: string;
  level: number;
  maxLevel: number;
  effectTr: string;
}

export interface CityLocation {
  id: string;
  name: string;
  nameTr: string;
  country: string;
  flag: string;
  requiredFame: number;
  unlockCost: number;
  bonusDescTr: string;
  unlocked: boolean;
}

export interface GameState {
  cash: number;
  gems: number;
  fame: number;
  day: number;
  activeCityId: string;
  inventory: AntiqueItem[];
  selectedItemForRestorationId: string | null;
  upgrades: Record<string, number>;
  unlockedCities: string[];
  restoredCatalog: string[];
  totalEarnings: number;
  totalRestored: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

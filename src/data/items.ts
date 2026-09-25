import { AntiqueItem, AuctionLot, CityLocation, StoreUpgrade } from '../types/game';

export const INITIAL_ITEMS: Omit<AntiqueItem, 'id' | 'cleanedPercent' | 'polishedPercent' | 'mechanismFixed' | 'goldInlaid' | 'grade' | 'currentValue'>[] = [
  {
    name: '1890 Brass Pocket Watch',
    nameTr: '1890 Pirinç Cep Saati',
    category: 'Horology',
    categoryTr: 'Saatçilik',
    period: 'Viktorya Dönemi (1890)',
    rarity: 'Rare',
    description: 'A pocket watch with exposed brass gear wheels, covered in heavy oxidation.',
    descriptionTr: 'Ağır pas tabakasıyla kaplanmış, içi el yapımı çarklarla dolu İngiliz demiryolu cep saati.',
    modelKey: 'pocket_watch',
    baseValue: 450
  },
  {
    name: 'Pirate Brass Spyglass',
    nameTr: 'Korsan Pirinç Dürbün',
    category: 'Optics',
    categoryTr: 'Optik',
    period: 'Denizcilik Çağı (1780)',
    rarity: 'Epic',
    description: 'Three-stage collapsible telescope found in a shipwreck crate, lens crusted with salt.',
    descriptionTr: 'Gemi enkazı sandığından çıkarılmış, üç kademeli açılır pirinç denizci dürbünü.',
    modelKey: 'spyglass',
    baseValue: 850
  },
  {
    name: 'Art Deco Stained Glass Lamp',
    nameTr: 'Art Deco Vitray Lamba',
    category: 'Domestic',
    categoryTr: 'Ev Eşyası',
    period: 'Art Deco (1925)',
    rarity: 'Rare',
    description: 'Geometric stained glass shade on an ornate bronze base, darkened by decades of soot.',
    descriptionTr: 'Zamanın isiyle kararmış, geometrik vitray cam kubbeli ve işlemeli bronz ayaklı masa lambası.',
    modelKey: 'lamp',
    baseValue: 620
  },
  {
    name: 'Ottoman Coffee Grinder',
    nameTr: 'Osmanlı Pirinç Değirmen',
    category: 'Domestic',
    categoryTr: 'Mutfak & Zanaat',
    period: 'Osmanlı (1840)',
    rarity: 'Common',
    description: 'Hand-carved brass coffee mill with floral arabesque engravings, jammed with old beans.',
    descriptionTr: 'Çiçek motifleriyle bezeli, tutma kolu sıkışmış geleneksel el yapımı kahve değirmeni.',
    modelKey: 'coffee_grinder',
    baseValue: 280
  },
  {
    name: 'Damascus Steel Dagger',
    nameTr: 'Şam Çeliği Hançer',
    category: 'Weapons',
    categoryTr: 'Silah & Zırh',
    period: 'Orta Çağ (1450)',
    rarity: 'Legendary',
    description: 'Wavy patterned Damascus steel blade with a lion-shaped golden crossguard, heavily pitted with rust.',
    descriptionTr: 'Yüzeyi pasla lekelenmiş, su dalgalı Şam çeliğinden dövülmüş ve altın kabzalı asil hançer.',
    modelKey: 'dagger',
    baseValue: 1800
  },
  {
    name: '1930s Bakelite Tube Radio',
    nameTr: '1930 Lambalı Bakalit Radyo',
    category: 'Music',
    categoryTr: 'Müzik & Ses',
    period: 'Erken Yayın Dönemi (1934)',
    rarity: 'Rare',
    description: 'Classic amber tube radio with brass tuning knobs, dusty speaker cloth and loose wires.',
    descriptionTr: 'Ahşap kasası çizilmiş, pirinç kadranlı ve lambalı sıcak tonlu nostaljik salon radyosu.',
    modelKey: 'radio',
    baseValue: 540
  },
  {
    name: 'Caesar Roman Gold Aureus',
    nameTr: 'Antik Roma Altın Madalyonu',
    category: 'Artifacts',
    categoryTr: 'Tarihi Eser',
    period: 'Roma İmparatorluğu (M.S. 110)',
    rarity: 'Mythic',
    description: 'Ancient embossed golden medal with Latin inscriptions, encrusted with centuries of petrified earth.',
    descriptionTr: 'Toprak altında taşlaşmış çamurla kaplı, İmparator kabartmalı paha biçilmez altın madalyon.',
    modelKey: 'roman_coin',
    baseValue: 3500
  },
  {
    name: '1910 Bellows Folding Camera',
    nameTr: '1910 Körük Fotoğraf Makinesi',
    category: 'Optics',
    categoryTr: 'Fotoğrafçılık',
    period: 'Edwardian (1910)',
    rarity: 'Epic',
    description: 'Leather folding camera with red bellows and brass shutter mechanism, dried out leather and stiff lens.',
    descriptionTr: 'Deri körükleri yıpranmış, pirinç deklanşör mekanizması takılan antika gezgin fotoğraf makinesi.',
    modelKey: 'camera',
    baseValue: 920
  }
];

export const AUCTION_LOTS: AuctionLot[] = [
  {
    id: 'lot_attic',
    title: 'Dusty Village Attic',
    titleTr: 'Terk Edilmiş Köy Tavan Arası',
    location: 'Bolu, Türkiye',
    tier: 'Attic',
    cost: 350,
    minItems: 1,
    maxItems: 2,
    potentialProfit: '₺700 - ₺1.800',
    descriptionTr: 'Yıllardır kilitli kalan tahta sandıklar, paslı kutular ve unutulmuş aile eşyaları.'
  },
  {
    id: 'lot_barn',
    title: 'Old Collector Barn',
    titleTr: 'Eski Saatçinin Çiftlik Deposu',
    location: 'Bursa, Türkiye',
    tier: 'Barn',
    cost: 950,
    minItems: 2,
    maxItems: 3,
    potentialProfit: '₺2.200 - ₺5.500',
    descriptionTr: 'Emekli bir antikacının geride bıraktığı mekanik cihazlar, denizci aletleri ve ahşap kutular.'
  },
  {
    id: 'lot_vault',
    title: 'Sealed Manor Basement',
    titleTr: 'Mühürlü Konak Mahzeni',
    location: 'Boğaziçi Yalısı, İstanbul',
    tier: 'Vault',
    cost: 2600,
    minItems: 2,
    maxItems: 4,
    potentialProfit: '₺6.000 - ₺18.000',
    descriptionTr: 'Ağır demir kapılar ardında yüzyıllardır saklanan saray yadigarları ve altın süslemeli nadide parçalar.'
  }
];

export const STORE_UPGRADES: StoreUpgrade[] = [
  {
    id: 'pedestal',
    title: 'Velvet Display Pedestals',
    titleTr: 'Kadife Vitrin Sehpaları',
    descTr: 'Dükkana giren zengin müşteri sayısını %25 artırır.',
    cost: 500,
    icon: '👑',
    level: 0,
    maxLevel: 3,
    effectTr: '+%25 Müşteri Trafiği'
  },
  {
    id: 'lighting',
    title: 'Warm Crystal Chandelier',
    titleTr: 'Sıcak Kristal Avize',
    descTr: 'Müşterilerin pazarlıktaki sabır barını %30 uzatır.',
    cost: 850,
    icon: '✨',
    level: 0,
    maxLevel: 3,
    effectTr: '+%30 Müşteri Sabrı'
  },
  {
    id: 'gramophone',
    title: 'Brass Antique Gramophone',
    titleTr: 'Pirinç Antika Gramofon',
    descTr: 'Çaldığı sıcak caz ezgileriyle satış kar marjını %15 yükseltir.',
    cost: 1400,
    icon: '🎷',
    level: 0,
    maxLevel: 3,
    effectTr: '+%15 Maksimum Teklif Oranı'
  },
  {
    id: 'apprentice',
    title: 'Apprentice Felix',
    titleTr: 'Çırak Zanaatkar Felix',
    descTr: 'Atölyedeki eşyaları otomatik olarak temizler ve parlatır.',
    cost: 2500,
    icon: '🧑‍🔧',
    level: 0,
    maxLevel: 2,
    effectTr: 'Otomatik Atölye Temizliği'
  }
];

export const CITIES: CityLocation[] = [
  {
    id: 'city_istanbul',
    name: 'Istanbul - Grand Bazaar',
    nameTr: 'İstanbul (Çukurcuma & Kapalıçarşı)',
    country: 'Türkiye',
    flag: '🇹🇷',
    requiredFame: 0,
    unlockCost: 0,
    bonusDescTr: 'Yerel pirinç ve Osmanlı eserlerinde %20 ek talep',
    unlocked: true
  },
  {
    id: 'city_london',
    name: 'London - Portobello Road',
    nameTr: 'Londra (Portobello Yolu)',
    country: 'İngiltere',
    flag: '🇬🇧',
    requiredFame: 500,
    unlockCost: 3500,
    bonusDescTr: 'Viktorya saati ve denizcilik aletlerinde %35 yüksek teklifler',
    unlocked: false
  },
  {
    id: 'city_tokyo',
    name: 'Tokyo - Yanaka Ginza',
    nameTr: 'Tokyo (Yanaka Nostalji Pazarı)',
    country: 'Japonya',
    flag: '🇯🇵',
    requiredFame: 1500,
    unlockCost: 8000,
    bonusDescTr: 'Koleksiyonerler nadir silahlara 2 katı fiyat öder',
    unlocked: false
  },
  {
    id: 'city_paris',
    name: 'Paris - Saint-Ouen',
    nameTr: 'Paris (Saint-Ouen Bit Pazarı)',
    country: 'Fransa',
    flag: '🇫🇷',
    requiredFame: 3500,
    unlockCost: 15000,
    bonusDescTr: 'Tüm S-Tier restorasyonlarda %50 lüks komisyonu',
    unlocked: false
  }
];

export const CUSTOMER_NAMES = [
  { name: 'Lord Harrington', archetype: 'Collector' as const, avatar: '🧐', bioTr: 'Sadece kusursuz ve sertifikalı antikalara para saçar.' },
  { name: 'Kurnaz Selim', archetype: 'BargainHunter' as const, avatar: '🕵️', bioTr: 'En ufak lekeyi bahane edip fiyat kırmaya çalışır.' },
  { name: 'Madame Claire', archetype: 'Tourist' as const, avatar: '👒', bioTr: 'Eşyanın arkasındaki tarihi hikayeyi dinlerse keseyi açar.' },
  { name: 'Don Salvatore', archetype: 'Mobster' as const, avatar: '🕶️', bioTr: 'Gece yarısı gelir, çok az konuşur, tomarla nakit bırakır.' },
  { name: 'Muazzez Teyze', archetype: 'Grandma' as const, avatar: '👵', bioTr: 'Eski günlerin hatırasını arayan tatlı dilli bir nostalji aşığı.' }
];

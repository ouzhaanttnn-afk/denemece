import './styles/app.css';
import { gameStateManager } from './stores/gameState';
import { soundManager } from './audio/soundManager';
import { ThreeRestorationScene, RestorationTool } from './render/threeScene';
import { auctionSystem } from './systems/auctionSystem';
import { negotiationSystem } from './systems/negotiationSystem';
import { AUCTION_LOTS, STORE_UPGRADES, CITIES } from './data/items';
import { ASSET_ICONS } from './data/assets';
import { confetti } from './render/confetti';
import { AntiqueItem } from './types/game';

// DOM Elements
const statCash = document.getElementById('stat-cash')!;
const statFame = document.getElementById('stat-fame')!;
const activeCityBadge = document.getElementById('active-city-badge')!;
const btnToggleAudio = document.getElementById('btn-toggle-audio')!;
const audioIcon = document.getElementById('audio-icon')!;

// Tabs
const navItems = document.querySelectorAll<HTMLButtonElement>('.nav-item');
const tabPanes = document.querySelectorAll<HTMLElement>('.tab-pane');

// Workshop Elements
const workshopContainer = document.getElementById('three-canvas-container')!;
const workshopGrade = document.getElementById('workshop-item-grade')!;
const workshopCategory = document.getElementById('workshop-item-category')!;
const workshopTitle = document.getElementById('workshop-item-title')!;
const workshopPeriod = document.getElementById('workshop-item-period')!;
const workshopValue = document.getElementById('workshop-item-value')!;
const progressCleanBar = document.getElementById('progress-clean-bar')!;
const progressCleanText = document.getElementById('progress-clean-text')!;
const progressPolishBar = document.getElementById('progress-polish-bar')!;
const progressPolishText = document.getElementById('progress-polish-text')!;
const toolBtns = document.querySelectorAll<HTMLButtonElement>('.tool-btn');

// Storefront Elements
const customerDealContainer = document.getElementById('customer-deal-container')!;
const emptyStoreCard = document.getElementById('empty-store-card')!;
const btnCallCustomer = document.getElementById('btn-call-customer')!;
const storeInventoryGrid = document.getElementById('store-inventory-grid')!;
const inventoryCount = document.getElementById('inventory-count')!;

// Auction Elements
const auctionLotsContainer = document.getElementById('auction-lots-container')!;
const auctionWarModal = document.getElementById('auction-war-modal')!;
const warLotTitle = document.getElementById('war-lot-title')!;
const warTimer = document.getElementById('war-timer')!;
const warCurrentBid = document.getElementById('war-current-bid')!;
const warHighestBidder = document.getElementById('war-highest-bidder')!;
const btnBid50 = document.getElementById('btn-bid-50')!;
const btnBid100 = document.getElementById('btn-bid-100')!;
const btnBid250 = document.getElementById('btn-bid-250')!;

// Empire Elements
const upgradesList = document.getElementById('upgrades-list')!;
const citiesList = document.getElementById('cities-list')!;
const restoredCount = document.getElementById('restored-count')!;
const restoredCatalogList = document.getElementById('restored-catalog-list')!;

// Profile Elements
const profileAvatarDisplay = document.getElementById('profile-avatar-display')!;
const profileNameInput = document.getElementById('profile-name-input') as HTMLInputElement;
const profileTitleDisplay = document.getElementById('profile-title-display')!;
const profileReputationStars = document.getElementById('profile-reputation-stars')!;
const avatarChoices = document.querySelectorAll<HTMLElement>('.avatar-choice');
const statLifetimeEarnings = document.getElementById('stat-lifetime-earnings')!;
const statLifetimeRestored = document.getElementById('stat-lifetime-restored')!;
const statAuctionsWon = document.getElementById('stat-auctions-won')!;
const statDealsCompleted = document.getElementById('stat-deals-completed')!;
const achievementsContainer = document.getElementById('achievements-container')!;
const sliderFx = document.getElementById('slider-fx') as HTMLInputElement;
const sliderBgm = document.getElementById('slider-bgm') as HTMLInputElement;
const btnExportSave = document.getElementById('btn-export-save')!;
const btnImportSave = document.getElementById('btn-import-save')!;
const btnResetGame = document.getElementById('btn-reset-game')!;

// Initialize 3D Scene
let threeScene: ThreeRestorationScene | null = null;

function init() {
  // Initialize 3D Viewport
  threeScene = new ThreeRestorationScene(workshopContainer);
  threeScene.onProgressUpdate = (updated) => {
    gameStateManager.updateItem(updated);
    updateWorkshopHUD(updated);
  };

  // Setup navigation tabs
  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) return;

      navItems.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(targetTab);
      if (pane) pane.classList.add('active');

      soundManager.playCustomerBlip(1.4);

      // Start ambient music on first tab interaction
      if (soundManager.musicEnabled) {
        soundManager.startLofiBgm();
      }
    });
  });

  // Setup 3D Tools
  toolBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tool = btn.getAttribute('data-tool') as RestorationTool;
      if (!tool || !threeScene) return;

      toolBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      threeScene.setTool(tool);
      soundManager.playCustomerBlip(1.1);
    });
  });

  // Audio Toggle
  btnToggleAudio.addEventListener('click', () => {
    const isEnabled = !soundManager.soundEnabled;
    soundManager.soundEnabled = isEnabled;
    soundManager.toggleMusic(isEnabled);
    audioIcon.textContent = isEnabled ? '🔊' : '🔇';
  });

  // Auction System Callbacks
  auctionSystem.onBidUpdate = (bid, timeLeft) => {
    warTimer.textContent = `${timeLeft < 10 ? '0' : ''}${timeLeft}s`;
    warCurrentBid.textContent = `₺${bid.amount.toLocaleString('tr-TR')}`;
    warHighestBidder.textContent = `Lider Teklif: ${bid.bidder}`;
    if (bid.isPlayer) {
      warHighestBidder.classList.add('player');
    } else {
      warHighestBidder.classList.remove('player');
    }
  };

  auctionSystem.onAuctionEnd = (won, itemsWon, finalPrice) => {
    auctionWarModal.classList.remove('active');
    if (won) {
      gameStateManager.spendCash(finalPrice);
      itemsWon.forEach((item) => gameStateManager.addItem(item));
      gameStateManager.recordAuctionWin();
      confetti.explode(90);
      triggerFloatingCash(`🎉 İhale Kazanıldı! +${itemsWon.length} Antika Eşya!`);
      soundManager.playGradeUpgrade();
    } else {
      triggerFloatingCash(`❌ İhale Kaybedildi! (Diğer alıcı aldı)`);
    }
    renderStoreInventory();
    renderProfileView();
  };

  // Bid buttons
  btnBid50.addEventListener('click', () => {
    const cash = gameStateManager.getState().cash;
    auctionSystem.placePlayerBid(50, cash);
  });
  btnBid100.addEventListener('click', () => {
    const cash = gameStateManager.getState().cash;
    auctionSystem.placePlayerBid(100, cash);
  });
  btnBid250.addEventListener('click', () => {
    const cash = gameStateManager.getState().cash;
    auctionSystem.placePlayerBid(250, cash);
  });

  // Negotiation System Callbacks
  negotiationSystem.onCustomerEnter = (customer, item) => {
    renderCustomerCard(customer, item);
  };

  negotiationSystem.onPatienceChange = (patience) => {
    const patienceFill = document.getElementById('patience-fill');
    if (patienceFill && negotiationSystem.currentCustomer) {
      const pct = (patience / negotiationSystem.currentCustomer.maxPatience) * 100;
      patienceFill.style.width = `${pct}%`;
      patienceFill.style.backgroundColor = pct > 50 ? 'var(--mint)' : pct > 25 ? 'var(--gold)' : 'var(--ruby)';
    }
  };

  negotiationSystem.onOfferChange = (offer, dialogue) => {
    const offerAmt = document.getElementById('customer-offer-amt');
    const speech = document.getElementById('customer-speech');
    if (offerAmt) offerAmt.textContent = `₺${offer.toLocaleString('tr-TR')}`;
    if (speech) speech.textContent = dialogue;
  };

  negotiationSystem.onSaleComplete = (result) => {
    if (result.accepted) {
      gameStateManager.addCash(result.soldPrice);
      gameStateManager.addFame(result.fameGained);
      gameStateManager.recordNegotiationSuccess(result.soldPrice);
      if (negotiationSystem.currentItem) {
        gameStateManager.removeItem(negotiationSystem.currentItem.id);
      }
      confetti.explode(50);
      triggerFloatingCash(`+₺${result.soldPrice.toLocaleString('tr-TR')} ↗`);
    }
    customerDealContainer.innerHTML = '';
    emptyStoreCard.style.display = 'flex';
    renderStoreInventory();
    renderProfileView();
  };

  btnCallCustomer.addEventListener('click', () => {
    trySpawnCustomer();
  });

  // Profile View Event Handlers
  profileNameInput.addEventListener('change', () => {
    gameStateManager.updateProfileName(profileNameInput.value);
  });

  avatarChoices.forEach((choice) => {
    choice.addEventListener('click', () => {
      const avatar = choice.getAttribute('data-avatar');
      if (avatar) {
        avatarChoices.forEach((c) => c.classList.remove('active'));
        choice.classList.add('active');
        gameStateManager.updateProfileAvatar(avatar);
        profileAvatarDisplay.textContent = avatar;
        soundManager.playCustomerBlip(1.3);
      }
    });
  });

  sliderFx.addEventListener('input', () => {
    const val = parseFloat(sliderFx.value);
    soundManager.fxVolume = val;
    gameStateManager.updateVolumes(val, soundManager.bgmVolume);
  });

  sliderBgm.addEventListener('input', () => {
    const val = parseFloat(sliderBgm.value);
    soundManager.bgmVolume = val;
    gameStateManager.updateVolumes(soundManager.fxVolume, val);
  });

  btnExportSave.addEventListener('click', () => {
    const data = gameStateManager.exportSave();
    navigator.clipboard.writeText(data).then(() => {
      alert('Kayıt verisi panoya kopyalandı! Güvenli bir yere yapıştırıp saklayabilirsin.');
    }).catch(() => {
      prompt('Kayıt verisini kopyala:', data);
    });
  });

  btnImportSave.addEventListener('click', () => {
    const jsonStr = prompt('Yedek JSON verisini buraya yapıştır:');
    if (jsonStr) {
      if (gameStateManager.importSave(jsonStr)) {
        alert('Kayıt başarıyla yüklendi!');
        soundManager.playGradeUpgrade();
      } else {
        alert('Geçersiz kayıt verisi formatı!');
      }
    }
  });

  btnResetGame.addEventListener('click', () => {
    if (confirm('Tüm ilerlemen sıfırlanacak. Emin misin?')) {
      gameStateManager.resetGame();
      alert('Oyun sıfırlandı.');
    }
  });

  // State Subscription
  gameStateManager.subscribe((state) => {
    statCash.textContent = state.cash.toLocaleString('tr-TR');
    statFame.textContent = state.fame.toLocaleString('tr-TR');

    const activeCity = CITIES.find((c) => c.id === state.activeCityId) || CITIES[0];
    activeCityBadge.textContent = `${activeCity.flag} ${activeCity.nameTr.split(' ')[0]}`;

    // Load active item in 3D scene if changed
    if (threeScene && state.selectedItemForRestorationId) {
      const activeItem = state.inventory.find((i) => i.id === state.selectedItemForRestorationId);
      if (activeItem) {
        threeScene.loadItem(activeItem);
        updateWorkshopHUD(activeItem);
      }
    }

    renderStoreInventory();
    renderAuctionLots();
    renderUpgradesAndEmpire();
    renderProfileView();
  });

  // Periodically check/spawn customers if inventory has items
  window.setInterval(() => {
    if (!negotiationSystem.isNegotiating && gameStateManager.getState().inventory.length > 0) {
      trySpawnCustomer();
    }
  }, 14000);

  // Initial customer spawn
  setTimeout(() => {
    trySpawnCustomer();
  }, 1000);
}

function trySpawnCustomer() {
  const state = gameStateManager.getState();
  if (state.inventory.length === 0) {
    customerDealContainer.innerHTML = '';
    emptyStoreCard.style.display = 'flex';
    return;
  }
  const gramophoneLvl = state.upgrades.gramophone || 0;
  const pedestalLvl = state.upgrades.pedestal || 0;
  const customer = negotiationSystem.spawnCustomer(state.inventory, 1 + pedestalLvl, gramophoneLvl > 0);
  if (customer) {
    emptyStoreCard.style.display = 'none';
  }
}

function renderCustomerCard(customer: any, item: AntiqueItem) {
  customerDealContainer.innerHTML = `
    <div class="customer-card active-deal">
      <div class="customer-header">
        <div class="customer-avatar">${customer.avatar}</div>
        <div class="customer-details">
          <div class="customer-name">${customer.name}</div>
          <div class="customer-archetype">${customer.archetype === 'Collector' ? '👑 Nadide Koleksiyoneri' : customer.archetype === 'BargainHunter' ? '🔍 Fırsat Avcısı Eskici' : customer.archetype === 'Tourist' ? '📸 Antika Meraklısı Turist' : customer.archetype === 'Mobster' ? '🕶️ Gece Yarısı Alıcısı' : '👵 Nostalji Aşığı'}</div>
          <div class="patience-container">
            <span style="font-size: 10px; color: var(--text-muted); font-weight: 700;">Sabır:</span>
            <div class="patience-track">
              <div id="patience-fill" class="patience-fill" style="width: 100%; background: var(--mint);"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="customer-speech" class="dialogue-speech-bubble">${customer.dialogue}</div>

      <div class="target-item-preview">
        <div>
          <div style="font-size: 11px; color: var(--gold); font-weight: 700;">Talip Olunan Eşya:</div>
          <div style="font-size: 14px; font-weight: 800; color: #fff;">${item.nameTr}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            ${item.period} · <span class="item-grade-badge grade-${item.grade}">${item.grade} Tier</span>
            ${item.grade === 'S' ? ASSET_ICONS.certifiedStamp : ''}
          </div>
        </div>
        <div class="offer-display">
          <span class="offer-label">Müşteri Teklifi</span>
          <span id="customer-offer-amt" class="offer-amount">₺${customer.currentOffer.toLocaleString('tr-TR')}</span>
        </div>
      </div>

      <div class="negotiate-actions">
        <button id="btn-accept-deal" class="action-btn btn-accept">🤝 Teklifi Kabul Et (₺${customer.currentOffer.toLocaleString('tr-TR')})</button>
        <button id="btn-counter-10" class="action-btn btn-counter">+%15 Artır</button>
        <button id="btn-counter-25" class="action-btn btn-counter">+%30 Artır</button>
        <button id="btn-provenance" class="action-btn btn-provenance">📜 Tarihini Anlat</button>
        <button id="btn-reject-deal" class="action-btn btn-reject">❌ Satışı Reddet</button>
      </div>
    </div>
  `;

  document.getElementById('btn-accept-deal')?.addEventListener('click', () => {
    negotiationSystem.acceptDeal();
  });

  document.getElementById('btn-counter-10')?.addEventListener('click', () => {
    const newPrice = Math.round(negotiationSystem.currentCustomer!.currentOffer * 1.15);
    negotiationSystem.counterOffer(newPrice);
  });

  document.getElementById('btn-counter-25')?.addEventListener('click', () => {
    const newPrice = Math.round(negotiationSystem.currentCustomer!.currentOffer * 1.3);
    negotiationSystem.counterOffer(newPrice);
  });

  document.getElementById('btn-provenance')?.addEventListener('click', () => {
    negotiationSystem.praiseProvenance();
  });

  document.getElementById('btn-reject-deal')?.addEventListener('click', () => {
    negotiationSystem.rejectDeal();
  });
}

function updateWorkshopHUD(item: AntiqueItem) {
  workshopGrade.textContent = `${item.grade} TIER`;
  workshopGrade.className = `item-grade-badge grade-${item.grade}`;
  workshopCategory.textContent = item.categoryTr;
  workshopTitle.textContent = item.nameTr;
  workshopPeriod.textContent = item.period;
  workshopValue.textContent = `₺${item.currentValue.toLocaleString('tr-TR')}`;

  progressCleanBar.style.width = `${item.cleanedPercent}%`;
  progressCleanText.textContent = `${Math.round(item.cleanedPercent)}%`;

  progressPolishBar.style.width = `${item.polishedPercent}%`;
  progressPolishText.textContent = `${Math.round(item.polishedPercent)}%`;
}

function renderStoreInventory() {
  const state = gameStateManager.getState();
  inventoryCount.textContent = state.inventory.length.toString();
  storeInventoryGrid.innerHTML = '';

  state.inventory.forEach((item) => {
    const card = document.createElement('div');
    card.className = `lot-card ${state.selectedItemForRestorationId === item.id ? 'active-lot' : ''}`;
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="lot-header">
        <span class="item-grade-badge grade-${item.grade}">${item.grade} Tier</span>
        <span style="font-size: 13px; font-weight: 800; color: var(--gold);">₺${item.currentValue.toLocaleString('tr-TR')}</span>
      </div>
      <div style="font-weight: 700; font-size: 13px; color: #fff;">${item.nameTr}</div>
      <div style="font-size: 10px; color: var(--text-muted);">${item.categoryTr} · Temizlik: %${Math.round(item.cleanedPercent)}</div>
      
      <!-- Condition Progress Bar -->
      <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden; margin-top: 6px;">
        <div style="width: ${Math.round((item.cleanedPercent + item.polishedPercent) / 2)}%; height: 100%; background: var(--mint);"></div>
      </div>

      <button class="action-btn btn-counter" style="font-size: 11px; padding: 6px; margin-top: 6px;">🔧 Atölyede Onar</button>
    `;

    card.addEventListener('click', () => {
      gameStateManager.selectItemForRestoration(item.id);
      const workshopNav = document.querySelector<HTMLButtonElement>('[data-tab="restoration-tab"]');
      workshopNav?.click();
    });

    storeInventoryGrid.appendChild(card);
  });
}

function renderAuctionLots() {
  const state = gameStateManager.getState();
  auctionLotsContainer.innerHTML = '';

  AUCTION_LOTS.forEach((lot) => {
    const card = document.createElement('div');
    card.className = 'lot-card';
    const canAfford = state.cash >= lot.cost;

    card.innerHTML = `
      <div class="lot-header">
        <div>
          <div class="lot-title">${lot.titleTr}</div>
          <div class="lot-location">📍 ${lot.location}</div>
        </div>
        <div class="lot-cost-pill">₺${lot.cost.toLocaleString('tr-TR')}</div>
      </div>
      <div class="lot-desc">${lot.descriptionTr}</div>
      <div class="lot-meta-row">
        <span>Tahmini İçerik: ${lot.minItems}-${lot.maxItems} Parça</span>
        <span>Potansiyel: ${lot.potentialProfit}</span>
      </div>
      <button class="action-btn btn-accept" style="margin-top: 6px; ${!canAfford ? 'opacity: 0.5; filter: grayscale(1); cursor: not-allowed;' : ''}">
        🔨 İhaleye Katıl (₺${lot.cost.toLocaleString('tr-TR')})
      </button>
    `;

    const bidBtn = card.querySelector<HTMLButtonElement>('.btn-accept');
    bidBtn?.addEventListener('click', () => {
      if (!canAfford) return;
      warLotTitle.textContent = lot.titleTr;
      auctionWarModal.classList.add('active');
      auctionSystem.startAuction(lot, state.cash);
    });

    auctionLotsContainer.appendChild(card);
  });
}

function renderUpgradesAndEmpire() {
  const state = gameStateManager.getState();

  upgradesList.innerHTML = '';
  STORE_UPGRADES.forEach((upg) => {
    const lvl = state.upgrades[upg.id] || 0;
    const isMax = lvl >= upg.maxLevel;
    const cost = Math.round(upg.cost * Math.pow(1.5, lvl));
    const canBuy = state.cash >= cost && !isMax;

    const row = document.createElement('div');
    row.className = 'upgrade-card';
    row.innerHTML = `
      <div class="upgrade-icon">${upg.icon}</div>
      <div class="upgrade-details">
        <div class="upgrade-name">${upg.titleTr} <small style="color: var(--gold); font-size: 11px;">(Seviye ${lvl}/${upg.maxLevel})</small></div>
        <div class="upgrade-desc">${upg.descTr}</div>
        <div style="font-size: 11px; color: var(--mint); font-weight: 700;">${upg.effectTr}</div>
      </div>
      <button class="upgrade-btn" ${!canBuy ? 'disabled style="opacity: 0.5; cursor: default;"' : ''}>
        ${isMax ? 'MAKS.' : `₺${cost.toLocaleString('tr-TR')} Satın Al`}
      </button>
    `;

    const btn = row.querySelector<HTMLButtonElement>('.upgrade-btn');
    btn?.addEventListener('click', () => {
      if (canBuy) {
        gameStateManager.buyUpgrade(upg.id);
        triggerFloatingCash(`-₺${cost.toLocaleString('tr-TR')} (Yükseltildi!)`);
      }
    });

    upgradesList.appendChild(row);
  });

  citiesList.innerHTML = '';
  CITIES.forEach((city) => {
    const isUnlocked = state.unlockedCities.includes(city.id);
    const isActive = state.activeCityId === city.id;
    const canUnlock = state.fame >= city.requiredFame && state.cash >= city.unlockCost && !isUnlocked;

    const row = document.createElement('div');
    row.className = `city-card ${isActive ? 'active-city' : ''}`;
    row.innerHTML = `
      <div class="city-flag">${city.flag}</div>
      <div class="city-details">
        <div class="city-name">${city.nameTr} ${isActive ? '⭐ <span style="font-size: 10px; color: var(--mint);">(Mevcut Şube)</span>' : ''}</div>
        <div class="city-bonus">${city.bonusDescTr}</div>
        <div style="font-size: 10px; color: var(--text-muted);">Gereken Şöhret: ⭐${city.requiredFame}</div>
      </div>
      ${isUnlocked
        ? `<button class="city-unlock-btn" style="background: rgba(85, 239, 196, 0.15); color: var(--mint); border-color: var(--mint);">
            ${isActive ? 'Aktif' : 'Taşın'}
          </button>`
        : `<button class="city-unlock-btn" ${!canUnlock ? 'disabled style="opacity: 0.5; cursor: default;"' : ''}>
            ₺${city.unlockCost.toLocaleString('tr-TR')} Aç
          </button>`
      }
    `;

    const btn = row.querySelector<HTMLButtonElement>('.city-unlock-btn');
    btn?.addEventListener('click', () => {
      if (isUnlocked && !isActive) {
        gameStateManager.setActiveCity(city.id);
        soundManager.playGradeUpgrade();
      } else if (!isUnlocked && canUnlock) {
        gameStateManager.unlockCity(city.id);
      }
    });

    citiesList.appendChild(row);
  });

  restoredCount.textContent = state.restoredCatalog.length.toString();
  restoredCatalogList.innerHTML = '';
  if (state.restoredCatalog.length === 0) {
    restoredCatalogList.innerHTML = `<span style="font-size: 12px; color: var(--text-muted);">Henüz kusursuz S-Tier restorasyon yapılmadı. Atölyede altın varaklı bir şaheser yarat!</span>`;
  } else {
    state.restoredCatalog.forEach((itemTitle) => {
      const pill = document.createElement('div');
      pill.className = 'item-grade-badge grade-S';
      pill.style.fontSize = '11px';
      pill.textContent = `✨ ${itemTitle}`;
      restoredCatalogList.appendChild(pill);
    });
  }
}

function renderProfileView() {
  const state = gameStateManager.getState();

  // Profile Info
  profileAvatarDisplay.textContent = state.profile.avatar;
  if (document.activeElement !== profileNameInput) {
    profileNameInput.value = state.profile.name;
  }
  profileTitleDisplay.textContent = state.profile.title;

  const stars = '⭐'.repeat(state.profile.reputationLevel) + '☆'.repeat(5 - state.profile.reputationLevel);
  profileReputationStars.textContent = stars;

  // Stats
  statLifetimeEarnings.textContent = `₺${state.profile.lifetimeEarnings.toLocaleString('tr-TR')}`;
  statLifetimeRestored.textContent = state.totalRestored.toString();
  statAuctionsWon.textContent = state.profile.auctionsWon.toString();
  statDealsCompleted.textContent = state.profile.negotiationsCompleted.toString();

  // Achievements
  achievementsContainer.innerHTML = '';
  state.achievements.forEach((ach) => {
    const card = document.createElement('div');
    card.className = `achievement-card ${ach.unlocked ? 'unlocked' : ''}`;
    card.innerHTML = `
      <div class="achievement-icon">${ach.icon}</div>
      <div class="achievement-details">
        <div class="achievement-title">${ach.titleTr}</div>
        <div class="achievement-desc">${ach.descTr}</div>
        <div class="achievement-reward">+₺${ach.rewardCash} · +⭐${ach.rewardFame} Şöhret</div>
      </div>
      <div class="achievement-status-badge ${ach.unlocked ? 'status-unlocked' : 'status-locked'}">
        ${ach.unlocked ? '✓ Tamamlandı' : 'Kilitli'}
      </div>
    `;
    achievementsContainer.appendChild(card);
  });
}

function triggerFloatingCash(text: string) {
  const fx = document.createElement('div');
  fx.className = 'floating-cash-fx';
  fx.textContent = text;
  document.body.appendChild(fx);
  setTimeout(() => {
    fx.remove();
  }, 2200);
}

// Start application
window.addEventListener('DOMContentLoaded', init);

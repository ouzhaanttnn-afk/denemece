import { Customer, AntiqueItem } from '../types/game';
import { CUSTOMER_NAMES } from '../data/items';
import { soundManager } from '../audio/soundManager';

export interface NegotiationResult {
  accepted: boolean;
  soldPrice: number;
  fameGained: number;
  messageTr: string;
}

export class NegotiationSystem {
  public currentCustomer: Customer | null = null;
  public currentItem: AntiqueItem | null = null;
  public isNegotiating = false;

  public onCustomerEnter?: (customer: Customer, item: AntiqueItem) => void;
  public onPatienceChange?: (patience: number) => void;
  public onOfferChange?: (offer: number, dialogue: string) => void;
  public onSaleComplete?: (result: NegotiationResult) => void;

  public spawnCustomer(inventory: AntiqueItem[], storeLevel = 1, gramophoneActive = false): Customer | null {
    if (inventory.length === 0) return null;

    // Pick a random restored or uncleaned item from player's inventory
    const targetItem = inventory[Math.floor(Math.random() * inventory.length)];
    const archetypeData = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];

    let basePatience = 65;
    let budgetMult = 1.0;

    switch (archetypeData.archetype) {
      case 'Collector':
        basePatience = 75;
        budgetMult = 1.45;
        break;
      case 'BargainHunter':
        basePatience = 50;
        budgetMult = 0.75;
        break;
      case 'Tourist':
        basePatience = 85;
        budgetMult = 1.15;
        break;
      case 'Mobster':
        basePatience = 40;
        budgetMult = 1.85;
        break;
      case 'Grandma':
        basePatience = 90;
        budgetMult = 1.0;
        break;
    }

    if (gramophoneActive) {
      basePatience += 15;
    }

    // Opening offer relative to item current value
    const initialOfferRatio = archetypeData.archetype === 'BargainHunter' ? 0.65 : 0.85;
    const openingOffer = Math.round(targetItem.currentValue * initialOfferRatio * (1 + (storeLevel - 1) * 0.05));

    const dialogues: Record<string, string> = {
      Collector: `Bu ${targetItem.nameTr} parçası vitrinimde parlayacak bir şaheser! Ne kadar istiyorsun?`,
      BargainHunter: `Bu ${targetItem.nameTr} biraz yıpranmış görünüyor, ama bir teklif yapabilirim.`,
      Tourist: `Aman Tanrım, ne kadar otantik bir ${targetItem.nameTr}! Memleketime hatıra götürmek isterim.`,
      Mobster: `Bana laf kalabalığı yapma. Bu ${targetItem.nameTr} için nakit çalışırım.`,
      Grandma: `Çocukluğumda büyükbabamın evinde aynen böyle bir ${targetItem.nameTr} vardı...`
    };

    const customer: Customer = {
      id: 'cust_' + Date.now(),
      name: archetypeData.name,
      archetype: archetypeData.archetype,
      avatar: archetypeData.avatar,
      patience: basePatience,
      maxPatience: basePatience,
      budgetMultiplier: budgetMult,
      targetItemId: targetItem.id,
      currentOffer: openingOffer,
      dialogue: dialogues[archetypeData.archetype] || 'Güzel bir parçaya benziyor.'
    };

    this.currentCustomer = customer;
    this.currentItem = targetItem;
    this.isNegotiating = true;

    soundManager.playCustomerBlip();
    this.onCustomerEnter?.(customer, targetItem);
    return customer;
  }

  public counterOffer(counterPrice: number): { success: boolean; message: string; customerLeft: boolean } {
    if (!this.currentCustomer || !this.currentItem) {
      return { success: false, message: 'Aktif müşteri yok.', customerLeft: false };
    }

    const maxWillingness = Math.round(this.currentItem.currentValue * this.currentCustomer.budgetMultiplier * 1.3);

    // If counter is within customer's instant willingness
    if (counterPrice <= this.currentCustomer.currentOffer * 1.1) {
      this.currentCustomer.currentOffer = counterPrice;
      soundManager.playCustomerBlip(1.2);
      this.onOfferChange?.(counterPrice, 'Anlaştık! Bu fiyata memnuniyetle alırım.');
      return { success: true, message: 'Müşteri teklifini kabul etti!', customerLeft: false };
    }

    // Customer considers counter: reduces patience
    const patiencePenalty = Math.round(((counterPrice - this.currentCustomer.currentOffer) / this.currentItem.currentValue) * 35);
    this.currentCustomer.patience = Math.max(0, this.currentCustomer.patience - Math.max(10, patiencePenalty));
    this.onPatienceChange?.(this.currentCustomer.patience);

    if (this.currentCustomer.patience <= 0) {
      // Customer walks out angry
      soundManager.playCustomerBlip(0.7);
      const leaveMessage = 'Bu fiyat kabul edilemez, vaktimi harcadınız! (Müşteri dükkandan ayrıldı)';
      this.endNegotiation(false, 0, leaveMessage);
      return { success: false, message: leaveMessage, customerLeft: true };
    }

    // Customer meets in the middle
    if (counterPrice <= maxWillingness) {
      const step = Math.round((counterPrice - this.currentCustomer.currentOffer) * 0.45);
      this.currentCustomer.currentOffer += step;
      soundManager.playCustomerBlip(1.1);
      const dial = `Pekala, biraz daha yukarı çıkabilirim: ₺${this.currentCustomer.currentOffer.toLocaleString('tr-TR')}. Ne dersin?`;
      this.onOfferChange?.(this.currentCustomer.currentOffer, dial);
      return { success: true, message: dial, customerLeft: false };
    } else {
      soundManager.playCustomerBlip(0.8);
      const dial = `Çok fazla istiyorsun! En fazla ₺${this.currentCustomer.currentOffer.toLocaleString('tr-TR')} verebilirim.`;
      this.onOfferChange?.(this.currentCustomer.currentOffer, dial);
      return { success: false, message: dial, customerLeft: false };
    }
  }

  public praiseProvenance(): { success: boolean; message: string } {
    if (!this.currentCustomer || !this.currentItem) return { success: false, message: '' };

    this.currentCustomer.patience = Math.min(this.currentCustomer.maxPatience, this.currentCustomer.patience + 25);
    this.currentCustomer.budgetMultiplier += 0.12;
    soundManager.playCustomerBlip(1.3);

    const message = `Eşyanın ${this.currentItem.period} dönemine ait hikayesini duyunca müşterinin gözleri parladı! (Sabır ve Bütçe Arttı!)`;
    this.onPatienceChange?.(this.currentCustomer.patience);
    this.onOfferChange?.(this.currentCustomer.currentOffer, message);
    return { success: true, message };
  }

  public acceptDeal(): NegotiationResult | null {
    if (!this.currentCustomer || !this.currentItem) return null;

    const soldPrice = this.currentCustomer.currentOffer;
    const fameGained = Math.round(soldPrice * 0.15) + (this.currentItem.grade === 'S' ? 80 : 25);

    soundManager.playCashRegister();
    const result: NegotiationResult = {
      accepted: true,
      soldPrice,
      fameGained,
      messageTr: `${this.currentCustomer.name}, ${this.currentItem.nameTr} eşyasını ₺${soldPrice.toLocaleString('tr-TR')} karşılığında satın aldı!`
    };

    this.endNegotiation(true, soldPrice, result.messageTr);
    this.onSaleComplete?.(result);
    return result;
  }

  public rejectDeal(): NegotiationResult | null {
    if (!this.currentCustomer) return null;
    const result: NegotiationResult = {
      accepted: false,
      soldPrice: 0,
      fameGained: 0,
      messageTr: 'Teklifi reddettiniz. Müşteri teşekkür ederek ayrıldı.'
    };
    this.endNegotiation(false, 0, result.messageTr);
    this.onSaleComplete?.(result);
    return result;
  }

  private endNegotiation(_accepted: boolean, _price: number, _msg: string) {
    this.isNegotiating = false;
    this.currentCustomer = null;
    this.currentItem = null;
  }
}

export const negotiationSystem = new NegotiationSystem();

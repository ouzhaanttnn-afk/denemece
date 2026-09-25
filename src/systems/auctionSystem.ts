import { AuctionLot, AntiqueItem } from '../types/game';
import { INITIAL_ITEMS } from '../data/items';
import { soundManager } from '../audio/soundManager';

export interface BidEvent {
  bidder: string;
  amount: number;
  isPlayer: boolean;
}

export class AuctionSystem {
  public currentLot: AuctionLot | null = null;
  public currentBid = 0;
  public highestBidder = '';
  public isPlayerHighest = false;
  public timeLeft = 10;
  public isRunning = false;
  private timer: number | null = null;
  private botInterval: number | null = null;

  public onBidUpdate?: (bid: BidEvent, timeLeft: number) => void;
  public onAuctionEnd?: (won: boolean, itemsWon: AntiqueItem[], finalPrice: number) => void;

  public startAuction(lot: AuctionLot, playerCash: number): boolean {
    if (playerCash < lot.cost) {
      return false;
    }

    this.currentLot = lot;
    this.currentBid = lot.cost;
    this.highestBidder = 'Başlangıç Fiyatı';
    this.isPlayerHighest = false;
    this.timeLeft = 8;
    this.isRunning = true;

    soundManager.playGavel();
    this.onBidUpdate?.({ bidder: this.highestBidder, amount: this.currentBid, isPlayer: false }, this.timeLeft);

    // Countdown timer
    this.timer = window.setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.resolveAuction();
      } else {
        this.onBidUpdate?.({ bidder: this.highestBidder, amount: this.currentBid, isPlayer: this.isPlayerHighest }, this.timeLeft);
      }
    }, 1000);

    // AI Bots bidding logic
    this.botInterval = window.setInterval(() => {
      if (!this.isRunning || !this.currentLot) return;

      // Probability for AI to outbid
      const maxEstimatedLotValue = this.currentLot.cost * 1.8;
      if (this.currentBid < maxEstimatedLotValue && Math.random() < 0.65) {
        const botNames = ['Eskici Hayri', 'Lord Charles', 'Koleksiyoner Canan', 'Antikacı Melih'];
        const bot = botNames[Math.floor(Math.random() * botNames.length)];
        const increment = Math.round((50 + Math.random() * 100) / 10) * 10;

        this.currentBid += increment;
        this.highestBidder = bot;
        this.isPlayerHighest = false;
        this.timeLeft = Math.min(8, this.timeLeft + 2); // Reset timer slightly on new bid

        soundManager.playGavel();
        this.onBidUpdate?.({ bidder: bot, amount: this.currentBid, isPlayer: false }, this.timeLeft);
      }
    }, 2200);

    return true;
  }

  public placePlayerBid(increment: number, playerCash: number): boolean {
    if (!this.isRunning || !this.currentLot) return false;
    const newBid = this.currentBid + increment;
    if (playerCash < newBid) return false;

    this.currentBid = newBid;
    this.highestBidder = 'Sen (Oyuncu)';
    this.isPlayerHighest = true;
    this.timeLeft = Math.min(8, this.timeLeft + 2);

    soundManager.playGavel();
    soundManager.playCashRegister();
    this.onBidUpdate?.({ bidder: this.highestBidder, amount: this.currentBid, isPlayer: true }, this.timeLeft);
    return true;
  }

  private resolveAuction() {
    this.isRunning = false;
    if (this.timer) clearInterval(this.timer);
    if (this.botInterval) clearInterval(this.botInterval);

    soundManager.playGavel();

    if (this.isPlayerHighest && this.currentLot) {
      soundManager.playGradeUpgrade();
      // Generate random mystery items from lot
      const count = Math.floor(Math.random() * (this.currentLot.maxItems - this.currentLot.minItems + 1)) + this.currentLot.minItems;
      const wonItems: AntiqueItem[] = [];

      for (let i = 0; i < count; i++) {
        const template = INITIAL_ITEMS[Math.floor(Math.random() * INITIAL_ITEMS.length)];
        const newItem: AntiqueItem = {
          ...template,
          id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          cleanedPercent: 0,
          polishedPercent: 0,
          mechanismFixed: false,
          goldInlaid: false,
          grade: 'D',
          currentValue: template.baseValue
        };
        wonItems.push(newItem);
      }

      this.onAuctionEnd?.(true, wonItems, this.currentBid);
    } else {
      this.onAuctionEnd?.(false, [], this.currentBid);
    }
  }

  public cancel() {
    this.isRunning = false;
    if (this.timer) clearInterval(this.timer);
    if (this.botInterval) clearInterval(this.botInterval);
  }
}

export const auctionSystem = new AuctionSystem();

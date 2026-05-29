export type TradeDirection = 'BUY' | 'SELL';
export type TradeResult = 'WIN' | 'LOSS' | 'BREAKEVEN';
export type TradeStatus = 'OPEN' | 'CLOSED';
export type Session = 'LONDON' | 'NEW_YORK' | 'ASIAN' | 'OVERLAP';
export type Emotion = 'CONFIDENT' | 'NERVOUS' | 'NEUTRAL' | 'FOMO' | 'REVENGE' | 'CALM';

export interface Trade {
  id: string;
  date: string;          // ISO date string
  time: string;          // HH:MM
  symbol: string;        // XAUUSD
  direction: TradeDirection;
  lotSize: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice?: number;
  status: TradeStatus;
  result?: TradeResult;
  pnl?: number;          // profit/loss in USD
  pips?: number;
  riskAmount: number;    // USD risked
  rewardAmount?: number; // USD gained
  rrRatio?: number;      // actual R:R achieved
  setup: string;         // e.g. "Break of structure", "Support bounce"
  session: Session;
  emotion: Emotion;
  notes: string;
  screenshot?: string;   // base64 or URL
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  accountBalance: number;
  riskPerTrade: number;   // percentage
  maxDailyLoss: number;   // percentage
  maxDailyTrades: number;
  rrRatio: number;
  currency: string;
  broker: string;
  tradingName: string;
}

export interface DailyStats {
  date: string;
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
  winRate: number;
}

export interface DB {
  trades: Trade[];
  settings: Settings;
}

import { put, head, getDownloadUrl } from '@vercel/blob';
import { DB, Settings, Trade } from './types';

const DB_FILE = 'journal.json';

const defaultDB: DB = {
  trades: [],
  settings: {
    accountBalance: 500,
    riskPerTrade: 2,
    maxDailyLoss: 6,
    maxDailyTrades: 3,
    rrRatio: 2,
    currency: 'USD',
    broker: '',
    tradingName: 'Gold Trader',
  },
};

export async function readDB(): Promise<DB> {
  try {
    const blob = await head(DB_FILE);
    const res = await fetch(blob.url);
    return await res.json();
  } catch {
    return defaultDB;
  }
}

export async function writeDB(db: DB): Promise<void> {
  await put(DB_FILE, JSON.stringify(db), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}
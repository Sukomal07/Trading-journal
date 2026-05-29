import fs from 'fs';
import path from 'path';
import { DB, Settings } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'journal.json');

const defaultSettings: Settings = {
  accountBalance: 500,
  riskPerTrade: 2,
  maxDailyLoss: 6,
  maxDailyTrades: 3,
  rrRatio: 2,
  currency: 'USD',
  broker: '',
  tradingName: 'Gold Trader',
};

const defaultDB: DB = {
  trades: [],
  settings: defaultSettings,
};

export function readDB(): DB {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
      return defaultDB;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as DB;
  } catch {
    return defaultDB;
  }
}

export function writeDB(db: DB): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

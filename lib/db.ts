import { prisma } from './prisma';
import { Trade, Settings, BalanceEntry, DB } from './types';

const defaultSettings: Settings = {
  accountBalance: 0,
  riskPerTrade: 0,
  maxDailyLoss: 0,
  maxDailyTrades: 0,
  rrRatio: 2,
  currency: '',
  broker: '',
  tradingName: '',
};

function calcSettingsFromBalance(balance: number): Partial<Settings> {
  if (balance <= 0) return {};
  const riskPerTrade = 2; // 2% default
  const maxDailyLoss = 6; // 6% default (3x riskPerTrade)
  const maxDailyTrades = Math.floor(maxDailyLoss / riskPerTrade);
  return { accountBalance: balance, riskPerTrade, maxDailyLoss, maxDailyTrades };
}

function parseTags(tags: string): string[] {
  try {
    return JSON.parse(tags) as string[];
  } catch {
    return [];
  }
}

function toTrade(row: {
  id: string;
  date: string;
  time: string;
  symbol: string;
  direction: string;
  lotSize: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number | null;
  status: string;
  result: string | null;
  pnl: number | null;
  pips: number | null;
  riskAmount: number;
  rewardAmount: number | null;
  rrRatio: number | null;
  setup: string;
  session: string;
  emotion: string;
  notes: string;
  screenshot: string | null;
  tags: string;
  createdAt: string;
  updatedAt: string;
}): Trade {
  return {
    id: row.id,
    date: row.date,
    time: row.time,
    symbol: row.symbol,
    direction: row.direction as Trade['direction'],
    lotSize: row.lotSize,
    entryPrice: row.entryPrice,
    stopLoss: row.stopLoss,
    takeProfit: row.takeProfit,
    exitPrice: row.exitPrice ?? undefined,
    status: row.status as Trade['status'],
    result: row.result ? (row.result as Trade['result']) : undefined,
    pnl: row.pnl ?? undefined,
    pips: row.pips ?? undefined,
    riskAmount: row.riskAmount,
    rewardAmount: row.rewardAmount ?? undefined,
    rrRatio: row.rrRatio ?? undefined,
    setup: row.setup,
    session: row.session as Trade['session'],
    emotion: row.emotion as Trade['emotion'],
    notes: row.notes,
    screenshot: row.screenshot ?? undefined,
    tags: parseTags(row.tags),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getTrades(status?: string, date?: string): Promise<Trade[]> {
  const rows = await prisma.trade.findMany({
    where: {
      ...(status ? { status: status as Trade['status'] } : {}),
      ...(date ? { date } : {}),
    },
    orderBy: [
      { date: 'desc' },
      { time: 'desc' },
    ],
  });
  return rows.map(toTrade);
}

export async function getTradeById(id: string): Promise<Trade | undefined> {
  const row = await prisma.trade.findUnique({ where: { id } });
  return row ? toTrade(row) : undefined;
}

export async function createTrade(trade: Trade): Promise<void> {
  await prisma.trade.create({
    data: {
      ...trade,
      tags: JSON.stringify(trade.tags),
      exitPrice: trade.exitPrice ?? null,
      result: trade.result ?? null,
      pnl: trade.pnl ?? null,
      pips: trade.pips ?? null,
      rewardAmount: trade.rewardAmount ?? null,
      rrRatio: trade.rrRatio ?? null,
      screenshot: trade.screenshot ?? null,
    },
  });
}

export async function updateTrade(trade: Trade): Promise<void> {
  await prisma.trade.update({
    where: { id: trade.id },
    data: {
      date: trade.date,
      time: trade.time,
      symbol: trade.symbol,
      direction: trade.direction,
      lotSize: trade.lotSize,
      entryPrice: trade.entryPrice,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      exitPrice: trade.exitPrice ?? null,
      status: trade.status,
      result: trade.result ?? null,
      pnl: trade.pnl ?? null,
      pips: trade.pips ?? null,
      riskAmount: trade.riskAmount,
      rewardAmount: trade.rewardAmount ?? null,
      rrRatio: trade.rrRatio ?? null,
      setup: trade.setup,
      session: trade.session,
      emotion: trade.emotion,
      notes: trade.notes,
      screenshot: trade.screenshot ?? null,
      tags: JSON.stringify(trade.tags),
      updatedAt: trade.updatedAt,
    },
  });
}

export async function deleteTrade(id: string): Promise<void> {
  await prisma.trade.delete({ where: { id } });
}

export async function getSettings(): Promise<Settings> {
  const row = await prisma.settings.findUnique({ where: { id: 'default' } });
  if (!row) {
    await saveSettings(defaultSettings);
    return defaultSettings;
  }
  const base = {
    accountBalance: row.accountBalance,
    riskPerTrade: row.riskPerTrade,
    maxDailyLoss: row.maxDailyLoss,
    maxDailyTrades: row.maxDailyTrades,
    rrRatio: row.rrRatio,
    currency: row.currency,
    broker: row.broker,
    tradingName: row.tradingName,
  };
  // Auto-calculate risk params from balance if they are still at zero
  if (base.accountBalance > 0 && base.riskPerTrade === 0) {
    const calc = calcSettingsFromBalance(base.accountBalance);
    return { ...base, ...calc } as Settings;
  }
  return base;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await prisma.settings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      ...settings,
    },
    update: {
      ...settings,
    },
  });
}

export async function getBalanceHistory(): Promise<BalanceEntry[]> {
  return prisma.balanceEntry.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createBalanceEntry(entry: BalanceEntry): Promise<void> {
  await prisma.balanceEntry.create({ data: entry });
}

export async function deleteBalanceEntry(id: string): Promise<void> {
  await prisma.balanceEntry.delete({ where: { id } });
}

export async function getBalanceEntryById(id: string): Promise<BalanceEntry | undefined> {
  return (await prisma.balanceEntry.findUnique({ where: { id } })) ?? undefined;
}

export async function resetDatabase(): Promise<void> {
  await prisma.trade.deleteMany();
  await prisma.balanceEntry.deleteMany();
  await prisma.settings.deleteMany();
}

export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect();
}

// Backward-compatible interface for gradual migration
export async function readDB(): Promise<DB> {
  const [trades, settings, balanceHistory] = await Promise.all([
    getTrades(),
    getSettings(),
    getBalanceHistory(),
  ]);
  return {
    trades,
    settings,
    balanceHistory,
  };
}

export async function writeDB(dbData: DB): Promise<void> {
  // This is a naive implementation for backward compatibility.
  // In production, use individual CRUD functions above.
  await saveSettings(dbData.settings);
  await prisma.trade.deleteMany();
  for (const trade of dbData.trades) {
    await createTrade(trade);
  }
  await prisma.balanceEntry.deleteMany();
  for (const entry of dbData.balanceHistory) {
    await createBalanceEntry(entry);
  }
}

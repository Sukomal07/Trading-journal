-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "lotSize" REAL NOT NULL,
    "entryPrice" REAL NOT NULL,
    "stopLoss" REAL NOT NULL,
    "takeProfit" REAL NOT NULL,
    "exitPrice" REAL,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "pnl" REAL,
    "pips" REAL,
    "riskAmount" REAL NOT NULL,
    "rewardAmount" REAL,
    "rrRatio" REAL,
    "setup" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "screenshot" TEXT,
    "tags" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "accountBalance" REAL NOT NULL,
    "riskPerTrade" REAL NOT NULL,
    "maxDailyLoss" REAL NOT NULL,
    "maxDailyTrades" INTEGER NOT NULL,
    "rrRatio" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "tradingName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BalanceEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "note" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "balanceAfter" REAL NOT NULL,
    "createdAt" TEXT NOT NULL
);

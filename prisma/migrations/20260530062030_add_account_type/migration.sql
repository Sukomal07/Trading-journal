-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Migrate BalanceEntry
CREATE TABLE "new_BalanceEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountType" TEXT NOT NULL DEFAULT 'REAL',
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "note" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "balanceAfter" REAL NOT NULL,
    "createdAt" TEXT NOT NULL
);
INSERT INTO "new_BalanceEntry" ("amount", "balanceAfter", "createdAt", "date", "id", "note", "type", "accountType") SELECT "amount", "balanceAfter", "createdAt", "date", "id", "note", "type", 'REAL' FROM "BalanceEntry";
DROP TABLE "BalanceEntry";
ALTER TABLE "new_BalanceEntry" RENAME TO "BalanceEntry";

-- Migrate Settings: update existing row id from 'default' to 'real' and set accountType
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountType" TEXT NOT NULL,
    "accountBalance" REAL NOT NULL,
    "riskPerTrade" REAL NOT NULL,
    "maxDailyLoss" REAL NOT NULL,
    "maxDailyTrades" INTEGER NOT NULL,
    "rrRatio" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "tradingName" TEXT NOT NULL
);
INSERT INTO "new_Settings" ("accountBalance", "broker", "currency", "id", "maxDailyLoss", "maxDailyTrades", "riskPerTrade", "rrRatio", "tradingName", "accountType")
SELECT "accountBalance", "broker", "currency", 'real', "maxDailyLoss", "maxDailyTrades", "riskPerTrade", "rrRatio", "tradingName", 'REAL' FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";

-- Insert default demo settings if not exists
INSERT OR IGNORE INTO "Settings" ("id", "accountType", "accountBalance", "riskPerTrade", "maxDailyLoss", "maxDailyTrades", "rrRatio", "currency", "broker", "tradingName")
VALUES ('demo', 'DEMO', 0, 0, 0, 0, 2, '', '', '');

-- Migrate Trade
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountType" TEXT NOT NULL DEFAULT 'REAL',
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
INSERT INTO "new_Trade" ("createdAt", "date", "direction", "emotion", "entryPrice", "exitPrice", "id", "lotSize", "notes", "pips", "pnl", "result", "rewardAmount", "riskAmount", "rrRatio", "screenshot", "session", "setup", "status", "stopLoss", "symbol", "tags", "takeProfit", "time", "updatedAt", "accountType")
SELECT "createdAt", "date", "direction", "emotion", "entryPrice", "exitPrice", "id", "lotSize", "notes", "pips", "pnl", "result", "rewardAmount", "riskAmount", "rrRatio", "screenshot", "session", "setup", "status", "stopLoss", "symbol", "tags", "takeProfit", "time", "updatedAt", 'REAL' FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

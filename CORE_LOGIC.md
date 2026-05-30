# Trading Journal — Core Business Logic Documentation

This document outlines the key business rules, formulas, and data flows that power the Trading Journal application.

---

## Table of Contents

1. [Account Types (Real & Demo)](#1-account-types-real--demo)
2. [Trade Profit & Loss (P&L) Calculation](#2-trade-profit--loss-pnl-calculation)
3. [Risk & Lot Size Calculation](#3-risk--lot-size-calculation)
4. [Auto-Suggested Stop Loss / Take Profit](#4-auto-suggested-stop-loss--take-profit)
5. [Settings Auto-Calculation](#5-settings-auto-calculation)
6. [Balance & Equity Tracking](#6-balance--equity-tracking)
7. [Daily Risk Management (Kill Switch)](#7-daily-risk-management-kill-switch)
8. [Performance Statistics](#8-performance-statistics)
9. [Data Models](#9-data-models)
10. [Validation Rules](#10-validation-rules)
11. [File Reference](#11-file-reference)

---

## 1. Account Types (Real & Demo)

**Source:** `components/TradingApp.tsx` (AccountSwitcher), `lib/db.ts`

The journal supports two completely isolated account environments:

| Account | Purpose | Visual Indicator |
|---------|---------|------------------|
| **REAL** | Live funded trading | Green badge |
| **DEMO** | Practice / backtesting | Blue badge |

### How It Works

- Every `Trade`, `BalanceEntry`, and `Settings` record is tagged with an `accountType` (`REAL` or `DEMO`).
- The `Settings` table uses `id: "real"` and `id: "demo"` instead of a single `"default"` row.
- Switching accounts in the UI triggers a full reload of trades, settings, and balance history for that account type.
- The selected account type is persisted in `localStorage` as `goldjournal_accountType`.
- Resetting data only clears the **currently active** account; the other account remains untouched.

### API Behavior

All API routes accept an `accountType` query parameter or body field:
- `GET /api/trades?accountType=DEMO`
- `GET /api/settings?accountType=DEMO`
- `GET /api/balance?accountType=DEMO`
- `POST /api/reset?accountType=DEMO`

---

## 2. Trade Profit & Loss (P&L) Calculation

**Source:** `app/api/trades/route.ts` (function `calcPnl`)

When a trade is created or updated with an `exitPrice`, the server automatically computes the following fields:

| Metric | Formula | Description |
|--------|---------|-------------|
| **Base Pip Value** | `$0.10` per pip on a `0.01` lot | Fixed constant for XAUUSD/gold |
| **Multiplier** | `lotSize / 0.01` | Scales pip value to the actual lot size |
| **Pips (BUY)** | `(exitPrice - entryPrice) * 10` | Price difference converted to pips |
| **Pips (SELL)** | `(entryPrice - exitPrice) * 10` | Inverse for short positions |
| **PnL ($)** | `pips * 0.1 * multiplier` | Final profit/loss in USD |
| **Result** | `WIN` if `pnl > 0.01` | Categorizes the trade outcome |
| | `LOSS` if `pnl < -0.01` | |
| | `BREAKEVEN` otherwise | |
| **R:R Ratio** | `pnl / riskAmount` | Actual risk-to-reward achieved |
| **Reward Amount** | `pnl` (only if positive) | Gross profit on winning trades |

**Trade Status Logic:**
- If `exitPrice` is provided → status = `CLOSED`
- If `exitPrice` is missing → status = `OPEN`

---

## 3. Risk & Lot Size Calculation

**Source:** `components/TradingApp.tsx` (function `calcLotSize`)

| Step | Formula |
|------|---------|
| **Risk Amount** | `(accountBalance * riskPerTrade%) / 100` |
| **Raw Lot Size** | `riskAmount / (stopLossPips * 0.1 * 100)` |
| **Rounded Lot** | `floor(lot / 0.01) * 0.01` (min `0.01`) |

The calculator ensures the lot size never goes below `0.01` and is always rounded down to the nearest micro-lot to prevent over-risking.

---

## 4. Auto-Suggested Stop Loss / Take Profit

**Source:** `components/TradingApp.tsx` (function `calcSLTP`)

Given an `entryPrice`, `direction`, `lotSize`, `riskAmount`, and desired `rrRatio`, the system can auto-calculate SL and TP prices:

| Step | Formula |
|------|---------|
| **SL Pips** | `riskAmount / (0.1 * multiplier)` |
| **TP Pips** | `slPips * rrRatio` |
| **SL Price (BUY)** | `entry - slPips * 0.1` |
| **SL Price (SELL)** | `entry + slPips * 0.1` |
| **TP Price (BUY)** | `entry + tpPips * 0.1` |
| **TP Price (SELL)** | `entry - tpPips * 0.1` |

All prices are rounded to 2 decimal places.

---

## 5. Settings Auto-Calculation

**Source:** `lib/db.ts` (function `calcSettingsFromBalance`)

If the user sets an `accountBalance > 0` but leaves risk settings at zero, the system automatically populates sensible defaults:

| Setting | Default Formula | Rationale |
|---------|----------------|-----------|
| **Risk Per Trade** | `2%` of balance | Industry-standard conservative risk |
| **Max Daily Loss** | `6%` of balance | 3x the per-trade risk limit |
| **Max Daily Trades** | `floor(6 / 2) = 3` | Prevents overtrading after 3 consecutive losses |

---

## 6. Balance & Equity Tracking

**Source:** `app/api/balance/route.ts`

### Balance Entry Operations

| Action | Account Balance Change |
|--------|------------------------|
| **Deposit** | `balance += amount` |
| **Withdrawal** | `balance -= amount` |
| **Delete Deposit** | `balance -= amount` (reversal) |
| **Delete Withdrawal** | `balance += amount` (reversal) |

Balance is always clamped to `>= 0` after deletion reversals.

### Dashboard Equity Curve

**Source:** `components/TradingApp.tsx`

The equity curve is built by:
1. Starting at `accountBalance`
2. Sorting all closed trades chronologically
3. Sequentially adding each trade's `pnl`

```
equityPoints = [
  { date: "Start", balance: accountBalance },
  { date: trade1.date, balance: accountBalance + trade1.pnl },
  { date: trade2.date, balance: prev + trade2.pnl },
  ...
]
```

---

## 7. Daily Risk Management (Kill Switch)

**Source:** `components/TradingApp.tsx` (Dashboard component)

The application monitors daily exposure in real-time to enforce trading discipline.

| Metric | Formula |
|--------|---------|
| **Max Daily Loss ($)** | `(balance * maxDailyLoss%) / 100` |
| **Today's Closed PnL** | `sum(pnl of all CLOSED trades today)` |
| **Open Trade Risk** | `sum(riskAmount of all OPEN trades today)` |
| **Daily Loss Used** | `abs(min(todayPnl, 0)) + openTradeRisk` |
| **Daily Loss % Used** | `(dailyLossUsed / maxDailyLoss) * 100` |

### Kill Switch Triggers

The kill switch banner appears and trading is discouraged when **either**:

1. `dailyLossPct >= 100` — You have hit or exceeded your daily loss limit.
2. `todayTrades.length >= maxDailyTrades` — You have reached the maximum number of trades allowed for the day.

This prevents emotional overtrading and enforces the user's pre-defined risk plan.

---

## 8. Performance Statistics

**Source:** `components/TradingApp.tsx` (Dashboard component)

All dashboard stats are derived from closed trades (`status === "CLOSED"`).

| Statistic | Formula | Interpretation |
|-----------|---------|----------------|
| **Win Rate** | `(wins / totalClosed) * 100` | `%` of trades that were winners |
| **Profit Factor** | `totalWinPnl / abs(totalLossPnl)` | `> 1.5` = excellent, `> 1` = profitable, `< 1` = losing |
| **Avg Win** | `sum(winPnl) / winCount` | Average profit per winning trade |
| **Avg Loss** | `sum(lossPnl) / lossCount` | Average loss per losing trade |
| **Account Balance** | `accountBalance + sum(allClosedPnls)` | Real-time balance including unrealized P&L is not counted |
| **Total PnL** | `sum(pnl of all closed trades)` | Cumulative profit/loss since inception |
| **14-Day PnL** | `sum(pnl of closed trades per day)` | Daily aggregation for the last 14 calendar days |

### Color Coding Rules

| Stat | Green | Gold/Neutral | Red |
|------|-------|--------------|-----|
| **Win Rate** | `>= 50%` | — | `< 50%` |
| **Profit Factor** | `>= 1.5` | `>= 1` | `< 1` |
| **Total PnL** | `>= 0` | — | `< 0` |

---

## 9. Data Models

**Source:** `prisma/schema.prisma`

### Trade

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `String` | Primary key |
| `accountType` | `AccountType` | `REAL` or `DEMO` |
| `date` | `String` | ISO date (YYYY-MM-DD) |
| `time` | `String` | HH:MM format |
| `symbol` | `String` | e.g. "XAUUSD" |
| `direction` | `TradeDirection` | `BUY` or `SELL` |
| `lotSize` | `Float` | Must be `> 0` |
| `entryPrice` | `Float` | Must be `> 0` |
| `stopLoss` | `Float` | Must be `> 0` |
| `takeProfit` | `Float` | Must be `> 0` |
| `exitPrice` | `Float?` | Optional |
| `status` | `TradeStatus` | `OPEN` or `CLOSED` |
| `result` | `TradeResult?` | `WIN`, `LOSS`, or `BREAKEVEN` |
| `pnl` | `Float?` | Auto-computed |
| `pips` | `Float?` | Auto-computed |
| `riskAmount` | `Float` | USD risked |
| `rewardAmount` | `Float?` | Profit on win |
| `rrRatio` | `Float?` | Actual R:R achieved |
| `setup` | `String` | Strategy name |
| `session` | `Session` | `LONDON`, `NEW_YORK`, `ASIAN`, `OVERLAP` |
| `emotion` | `Emotion` | `CONFIDENT`, `NERVOUS`, `NEUTRAL`, `FOMO`, `REVENGE`, `CALM` |
| `notes` | `String` | Free-form text |
| `screenshot` | `String?` | Base64 or URL |
| `tags` | `String` | JSON array (stored as string) |
| `createdAt` | `String` | ISO timestamp |
| `updatedAt` | `String` | ISO timestamp |

### Settings (One per Account)

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` | `"real"` or `"demo"` |
| `accountType` | `AccountType` | `REAL` or `DEMO` |
| `accountBalance` | `Float` | Current account equity |
| `riskPerTrade` | `Float` | `%` of balance risked per trade |
| `maxDailyLoss` | `Float` | `%` of balance max daily drawdown |
| `maxDailyTrades` | `Int` | Max trades per day |
| `rrRatio` | `Float` | Default reward:risk target |
| `currency` | `String` | Account currency |
| `broker` | `String` | Broker name |
| `tradingName` | `String` | User's trading alias |

### BalanceEntry

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` | Primary key |
| `accountType` | `AccountType` | `REAL` or `DEMO` |
| `type` | `BalanceEntryType` | `DEPOSIT` or `WITHDRAWAL` |
| `amount` | `Float` | Transaction amount |
| `note` | `String` | Optional memo |
| `date` | `String` | Transaction date |
| `balanceAfter` | `Float` | Account balance after this entry |
| `createdAt` | `String` | ISO timestamp |

---

## 10. Validation Rules

**Source:** `app/api/trades/route.ts` (function `validateTrade`)

A trade POST/PUT request is rejected (`400 Bad Request`) if any of the following are true:

| Field | Rule | Error Message |
|-------|------|---------------|
| `symbol` | Empty or whitespace-only | "Symbol is required" |
| `direction` | Missing | "Direction is required" |
| `date` | Missing | "Date is required" |
| `entryPrice` | `<= 0` | "Entry price must be greater than 0" |
| `stopLoss` | `<= 0` | "Stop loss must be greater than 0" |
| `takeProfit` | `<= 0` | "Take profit must be greater than 0" |
| `lotSize` | `<= 0` | "Lot size must be greater than 0" |
| `riskAmount` | `null` or `< 0` | "Risk amount is required" |

---

## 11. File Reference

| Concern | File(s) |
|---------|---------|
| Account Type Switching | `components/TradingApp.tsx` (AccountSwitcher), `components/TradingJournalProvider.tsx` |
| P&L Calculation | `app/api/trades/route.ts` |
| Risk / Lot / SLTP Math | `components/TradingApp.tsx` |
| Settings Defaults | `lib/db.ts` |
| Balance Operations | `app/api/balance/route.ts` |
| Dashboard Stats | `components/TradingApp.tsx` (Dashboard) |
| Data Schema | `prisma/schema.prisma` |
| Trade CRUD | `lib/db.ts` |
| Reset / Clear Data | `app/api/reset/route.ts` |

---

*Last updated: 2026-05-30*

## Account Type Isolation Notes

- `Trade`, `BalanceEntry`, and `Settings` models all include `accountType`.
- The `Settings.id` is derived from `accountType.toLowerCase()` (`"real"` or `"demo"`).
- `resetDatabase(accountType)` deletes only records belonging to that account type.
- The provider persists the user's selected account type in `localStorage` so it survives page refreshes.

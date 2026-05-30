import { NextRequest, NextResponse } from "next/server";
import {
  getTrades,
  getSettings,
  createTrade,
  getTradeById,
  updateTrade,
  deleteTrade,
} from "@/lib/db";
import { Trade } from "@/lib/types";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function calcPnl(trade: Partial<Trade>): Partial<Trade> {
  if (!trade.exitPrice || !trade.entryPrice || !trade.lotSize) return trade;
  const pip = 0.1; // 1 pip = $0.10 on 0.01 lot
  const multiplier = trade.lotSize / 0.01;
  let pips = 0;
  if (trade.direction === "BUY") {
    pips = (trade.exitPrice - trade.entryPrice) * 10;
  } else {
    pips = (trade.entryPrice - trade.exitPrice) * 10;
  }
  const pnl = pips * pip * multiplier;
  const result = pnl > 0.01 ? "WIN" : pnl < -0.01 ? "LOSS" : "BREAKEVEN";
  const rrRatio = trade.riskAmount
    ? pnl / trade.riskAmount
    : undefined;
  const rewardAmount = pnl > 0 ? parseFloat(pnl.toFixed(2)) : undefined;
  return {
    ...trade,
    pnl: parseFloat(pnl.toFixed(2)),
    pips: parseFloat(pips.toFixed(1)),
    result,
    rrRatio: rrRatio ? parseFloat(rrRatio.toFixed(2)) : undefined,
    rewardAmount,
  };
}

function validateTrade(body: Partial<Trade>): string | null {
  if (!body.symbol || body.symbol.trim() === "") return "Symbol is required";
  if (!body.direction) return "Direction is required";
  if (!body.date) return "Date is required";
  if (!body.entryPrice || body.entryPrice <= 0) return "Entry price must be greater than 0";
  if (!body.stopLoss || body.stopLoss <= 0) return "Stop loss must be greater than 0";
  if (!body.takeProfit || body.takeProfit <= 0) return "Take profit must be greater than 0";
  if (!body.lotSize || body.lotSize <= 0) return "Lot size must be greater than 0";
  if (body.riskAmount == null || body.riskAmount < 0) return "Risk amount is required";
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const date = searchParams.get("date") || undefined;
  const trades = await getTrades(status, date);
  const settings = await getSettings();
  return NextResponse.json({ trades, settings });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const validationError = validateTrade(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }
  const now = new Date().toISOString();
  let trade: Trade = {
    ...body,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    tags: body.tags || [],
    status: body.exitPrice ? "CLOSED" : "OPEN",
  };
  trade = { ...trade, ...calcPnl(trade) } as Trade;
  await createTrade(trade);
  return NextResponse.json({ trade }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const validationError = validateTrade(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }
  const existing = await getTradeById(body.id);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  let updated: Trade = {
    ...existing,
    ...body,
    updatedAt: new Date().toISOString(),
    status: body.exitPrice ? "CLOSED" : "OPEN",
  };
  updated = { ...updated, ...calcPnl(updated) } as Trade;
  await updateTrade(updated);
  return NextResponse.json({ trade: updated });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await deleteTrade(id);
  return NextResponse.json({ ok: true });
}

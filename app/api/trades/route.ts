import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/db";
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
    ? Math.abs(pnl) / trade.riskAmount
    : undefined;
  return {
    ...trade,
    pnl: parseFloat(pnl.toFixed(2)),
    pips: parseFloat(pips.toFixed(1)),
    result,
    rrRatio: rrRatio ? parseFloat(rrRatio.toFixed(2)) : undefined,
  };
}

export async function GET(req: NextRequest) {
  const db = await readDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  let trades = db.trades;
  if (status) trades = trades.filter((t) => t.status === status);
  if (date) trades = trades.filter((t) => t.date === date);
  trades = trades.sort(
    (a, b) =>
      new Date(b.date + "T" + b.time).getTime() -
      new Date(a.date + "T" + a.time).getTime(),
  );
  return NextResponse.json({ trades, settings: db.settings });
}

export async function POST(req: NextRequest) {
  const db = await readDB();
  const body = await req.json();
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
  db.trades.push(trade);
  writeDB(db);
  return NextResponse.json({ trade }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const db = await readDB();
  const body = await req.json();
  const idx = db.trades.findIndex((t) => t.id === body.id);
  if (idx === -1)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  let updated: Trade = {
    ...db.trades[idx],
    ...body,
    updatedAt: new Date().toISOString(),
    status: body.exitPrice ? "CLOSED" : "OPEN",
  };
  updated = { ...updated, ...calcPnl(updated) } as Trade;
  db.trades[idx] = updated;
  writeDB(db);
  return NextResponse.json({ trade: updated });
}

export async function DELETE(req: NextRequest) {
  const db = await readDB();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  db.trades = db.trades.filter((t) => t.id !== id);
  writeDB(db);
  return NextResponse.json({ ok: true });
}

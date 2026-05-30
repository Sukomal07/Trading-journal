import { NextRequest, NextResponse } from "next/server";
import {
  getSettings,
  saveSettings,
  getBalanceHistory,
  createBalanceEntry,
  getBalanceEntryById,
  deleteBalanceEntry,
} from "@/lib/db";
import { BalanceEntry } from "@/lib/types";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function GET() {
  const history = await getBalanceHistory();
  return NextResponse.json(history);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const now = new Date().toISOString();
  const entry: BalanceEntry = {
    id: generateId(),
    type: body.type,
    amount: Number(body.amount),
    note: body.note || "",
    balanceAfter: Number(body.balanceAfter),
    date: now.slice(0, 10),
    createdAt: now,
  };

  await createBalanceEntry(entry);

  const settings = await getSettings();
  settings.accountBalance = entry.balanceAfter;
  await saveSettings(settings);

  return NextResponse.json({ entry, settings }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const entry = await getBalanceEntryById(id);

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const settings = await getSettings();
  const adjustedBalance =
    entry.type === "DEPOSIT"
      ? settings.accountBalance - entry.amount
      : settings.accountBalance + entry.amount;

  await deleteBalanceEntry(id);

  settings.accountBalance = Math.max(0, parseFloat(adjustedBalance.toFixed(2)));
  await saveSettings(settings);

  return NextResponse.json({ ok: true, settings });
}

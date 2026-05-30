import { NextRequest, NextResponse } from "next/server";
import {
  getSettings,
  saveSettings,
  getBalanceHistory,
  createBalanceEntry,
  getBalanceEntryById,
  deleteBalanceEntry,
} from "@/lib/db";
import { BalanceEntry, AccountType } from "@/lib/types";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function parseAccountType(searchParams: URLSearchParams): AccountType {
  const type = searchParams.get("accountType");
  return type === "DEMO" ? "DEMO" : "REAL";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountType = parseAccountType(searchParams);
  const history = await getBalanceHistory(accountType);
  return NextResponse.json(history);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const accountType: AccountType = body.accountType === "DEMO" ? "DEMO" : "REAL";
  const now = new Date().toISOString();
  const entry: BalanceEntry = {
    id: generateId(),
    accountType,
    type: body.type,
    amount: Number(body.amount),
    note: body.note || "",
    balanceAfter: Number(body.balanceAfter),
    date: now.slice(0, 10),
    createdAt: now,
  };

  await createBalanceEntry(entry);

  const settings = await getSettings(accountType);
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

  const settings = await getSettings(entry.accountType);
  const adjustedBalance =
    entry.type === "DEPOSIT"
      ? settings.accountBalance - entry.amount
      : settings.accountBalance + entry.amount;

  await deleteBalanceEntry(id);

  settings.accountBalance = Math.max(0, parseFloat(adjustedBalance.toFixed(2)));
  await saveSettings(settings);

  return NextResponse.json({ ok: true, settings });
}

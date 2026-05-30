import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";
import { AccountType } from "@/lib/types";

function parseAccountType(searchParams: URLSearchParams): AccountType {
  const type = searchParams.get("accountType");
  return type === "DEMO" ? "DEMO" : "REAL";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountType = parseAccountType(searchParams);
  const settings = await getSettings(accountType);
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const accountType: AccountType = body.accountType === "DEMO" ? "DEMO" : "REAL";
  const current = await getSettings(accountType);
  const updated = { ...current, ...body, accountType };
  await saveSettings(updated);
  return NextResponse.json(updated);
}

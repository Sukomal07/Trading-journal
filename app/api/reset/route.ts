import { NextRequest, NextResponse } from "next/server";
import { getSettings, resetDatabase } from "@/lib/db";
import { AccountType } from "@/lib/types";

function parseAccountType(searchParams: URLSearchParams): AccountType | undefined {
  const type = searchParams.get("accountType");
  if (type === "DEMO") return "DEMO";
  if (type === "REAL") return "REAL";
  return undefined;
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountType = parseAccountType(searchParams);
  await resetDatabase(accountType);
  const settings = await getSettings(accountType ?? "REAL");
  return NextResponse.json({ ok: true, settings });
}

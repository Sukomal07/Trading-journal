import { NextResponse } from "next/server";
import { getSettings, resetDatabase } from "@/lib/db";

export async function POST() {
  await resetDatabase();
  const settings = await getSettings();
  return NextResponse.json({ ok: true, settings });
}

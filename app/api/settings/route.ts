import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/db";

export async function GET() {
  const db = await readDB();
  return NextResponse.json(db.settings);
}

export async function PUT(req: NextRequest) {
  const db = await readDB();
  const body = await req.json();
  db.settings = { ...db.settings, ...body };
  await writeDB(db);
  return NextResponse.json(db.settings);
}

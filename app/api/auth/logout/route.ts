import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();

  if (token) await store.invalidateToken(token);

  return NextResponse.json({ message: "Logged out successfully" });
}

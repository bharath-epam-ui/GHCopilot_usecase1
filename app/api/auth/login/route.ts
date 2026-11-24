import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "username and password are required" },
      { status: 400 }
    );
  }

  const user = store.findUser(username, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  try {
    const token = await store.generateToken(username);
    return NextResponse.json({
      data: { token, name: user.name, username: user.username },
      message: "Login successful",
    });
  } catch (err) {
    console.error("Token generation failed:", err);
    return NextResponse.json(
      { error: "Authentication service unavailable. Please try again." },
      { status: 503 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

async function getUsername(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  return store.validateToken(token);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const username = await getUsername(req);
  if (!username) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED", message: "Unauthorized" },
      { status: 401 }
    );
  }

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", message: "Task not found" },
      { status: 404 }
    );
  }

  const result = await store.restoreTask(username, id);
  if (!result) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", message: "Task not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, taskId: id, restored: true });
}

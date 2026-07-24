import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { TaskStatus } from "@/lib/types";

function isValidStatus(value: unknown): value is TaskStatus {
  return value === "todo" || value === "in-progress" || value === "done";
}

function normalizeStatus(value: unknown): TaskStatus | null {
  if (value === "To Do" || value === "TODO" || value === "todo") return "todo";
  if (value === "In Progress" || value === "IN_PROGRESS" || value === "in-progress") return "in-progress";
  if (value === "Done" || value === "DONE" || value === "done") return "done";
  return null;
}

function isAllowedTransition(current: TaskStatus, next: TaskStatus): boolean {
  if (current === "todo" && next === "in-progress") return true;
  if (current === "in-progress" && next === "done") return true;
  if (current === "done" && next === "todo") return true;
  return false;
}

async function getUsername(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  return store.validateToken(token);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const username = await getUsername(req);
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const nextStatusRaw = body?.nextStatus;
  if (!isValidStatus(nextStatusRaw)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid payload",
          details: { nextStatus: ["nextStatus must be one of: todo, in-progress, done"] },
        },
      },
      { status: 400 }
    );
  }

  const existing = await store.getTaskById(username, params.id);
  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Task not found" } },
      { status: 404 }
    );
  }

  const current = normalizeStatus(existing.status);
  if (!current) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Unexpected error" } },
      { status: 500 }
    );
  }

  if (current === nextStatusRaw) {
    return NextResponse.json({ data: existing, message: "No change" });
  }

  if (!isAllowedTransition(current, nextStatusRaw)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_TRANSITION",
          message: `Transition ${current}  ${nextStatusRaw} is not allowed`,
        },
      },
      { status: 409 }
    );
  }

  try {
    const updated = await store.updateTask(username, params.id, { status: nextStatusRaw });
    return NextResponse.json({ data: updated, message: "Status updated" });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Unexpected error" } },
      { status: 500 }
    );
  }
}

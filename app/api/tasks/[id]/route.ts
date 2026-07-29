import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { TaskStatus, TaskPriority } from "@/lib/types";

async function getUsername(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  return store.validateToken(token);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const username = await getUsername(req);
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const task = await store.getTaskById(username, params.id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ data: task });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const username = await getUsername(req);
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const task = await store.getTaskById(username, params.id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, description, status, priority, assignee } = body;

  const validStatuses: TaskStatus[] = ["todo", "in-progress", "done"];
  const validPriorities: TaskPriority[] = ["low", "medium", "high"];

  const updated = await store.updateTask(username, params.id, {
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(status !== undefined && validStatuses.includes(status) && { status }),
    ...(priority !== undefined && validPriorities.includes(priority) && { priority }),
    ...(assignee !== undefined && { assignee: assignee.trim() }),
  });

  return NextResponse.json({ data: updated, message: "Task updated" });
}

export async function DELETE(
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

  const result = await store.softDeleteTask(username, id);
  if (!result) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", message: "Task not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, taskId: id, deletedAt: result.deletedAt });
}

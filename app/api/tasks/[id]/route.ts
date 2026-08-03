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
  const { title, description, status, priority, assignee, dueDate } = body;

  // Validate dueDate if provided
  if (dueDate !== undefined && dueDate !== null) {
    // Check format: YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return NextResponse.json({ error: "dueDate must be in YYYY-MM-DD format" }, { status: 400 });
    }
    // Check validity (reject invalid dates like 2026-02-30)
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime()) || parsedDate.toISOString().split('T')[0] !== dueDate) {
      return NextResponse.json({ error: "dueDate is not a valid date" }, { status: 400 });
    }
  }

  const validStatuses: TaskStatus[] = ["todo", "in-progress", "done"];
  const validPriorities: TaskPriority[] = ["low", "medium", "high"];

  const updated = await store.updateTask(username, params.id, {
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(status !== undefined && validStatuses.includes(status) && { status }),
    ...(priority !== undefined && validPriorities.includes(priority) && { priority }),
    ...(assignee !== undefined && { assignee: assignee.trim() }),
    ...(dueDate !== undefined && { dueDate: dueDate || undefined }),
  });

  return NextResponse.json({ data: updated, message: "Task updated" });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const username = await getUsername(req);
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await store.deleteTask(username, params.id);
  if (!deleted) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Task deleted" });
}

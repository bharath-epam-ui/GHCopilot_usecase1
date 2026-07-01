import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { TaskStatus, TaskPriority } from "@/lib/types";

async function getUsername(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  return store.validateToken(token);
}

export async function GET(req: NextRequest) {
  const username = await getUsername(req);
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const assignee = searchParams.get("assignee") ?? undefined;

  const tasks = await store.getAllTasks(username, status, assignee);
  return NextResponse.json({ data: tasks });
}

export async function POST(req: NextRequest) {
  const username = await getUsername(req);
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, description, status, priority, assignee, dueDate } = body;

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

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

  const task = await store.createTask(username, {
    title: title.trim(),
    description: description?.trim() ?? "",
    status: validStatuses.includes(status) ? status : "todo",
    priority: validPriorities.includes(priority) ? priority : "medium",
    assignee: assignee?.trim() ?? username,
    ...(dueDate !== undefined && { dueDate: dueDate || undefined }),
  });

  return NextResponse.json({ data: task, message: "Task created" }, { status: 201 });
}

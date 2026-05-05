import { Task, User } from "./types";
import { randomUUID } from "crypto";
import { Redis } from "@upstash/redis";

// Use Upstash Redis when env vars are present (production), fall back to in-memory (local dev)
const USE_KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// ── Static data ───────────────────────────────────────────────────────────────

const USERS: User[] = [
  { id: "u1", username: "admin", password: "password123", name: "Admin User" },
  { id: "u2", username: "user1", password: "test1234", name: "Test User" },
];

const SEED_TASKS: Task[] = [
  { id: "t1", title: "Design login page", description: "Create wireframes and implement the login UI", status: "done", priority: "high", assignee: "admin", createdAt: "2024-01-01T09:00:00Z", updatedAt: "2024-01-02T10:00:00Z" },
  { id: "t2", title: "Implement task API", description: "Build REST endpoints for task CRUD operations", status: "in-progress", priority: "high", assignee: "user1", createdAt: "2024-01-02T09:00:00Z", updatedAt: "2024-01-03T11:00:00Z" },
  { id: "t3", title: "Write unit tests", description: "Add unit tests for all service layer functions", status: "todo", priority: "medium", assignee: "user1", createdAt: "2024-01-03T09:00:00Z", updatedAt: "2024-01-03T09:00:00Z" },
  { id: "t4", title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for build and deploy", status: "todo", priority: "medium", assignee: "admin", createdAt: "2024-01-04T09:00:00Z", updatedAt: "2024-01-04T09:00:00Z" },
  { id: "t5", title: "Performance testing", description: "Run load tests and optimise slow endpoints", status: "todo", priority: "low", assignee: "user1", createdAt: "2024-01-05T09:00:00Z", updatedAt: "2024-01-05T09:00:00Z" },
];

// ── In-memory fallback (local dev) ────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __kata_tokens: Map<string, string> | undefined;
  // eslint-disable-next-line no-var
  var __kata_tasks_map: Map<string, Task[]> | undefined;
}

function memTokens(): Map<string, string> {
  if (!globalThis.__kata_tokens) globalThis.__kata_tokens = new Map();
  return globalThis.__kata_tokens;
}

function memUserTasks(username: string): Task[] {
  if (!globalThis.__kata_tasks_map) globalThis.__kata_tasks_map = new Map();
  if (!globalThis.__kata_tasks_map.has(username)) {
    globalThis.__kata_tasks_map.set(username, SEED_TASKS.map((t) => ({ ...t })));
  }
  return globalThis.__kata_tasks_map.get(username)!;
}

// ── Vercel KV helpers ─────────────────────────────────────────────────────────

const TOKEN_TTL = 86400; // 24 hours
const kvTaskKey = (u: string) => `kata:tasks:${u}`;
const kvTokenKey = (t: string) => `kata:token:${t}`;

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return _redis;
}

async function kvGetTasks(username: string): Promise<Task[]> {
  const redis = getRedis();
  const existing = await redis.get<Task[]>(kvTaskKey(username));
  if (existing) return existing;
  // First login for this user — seed their personal task list
  const seeded = SEED_TASKS.map((t) => ({ ...t }));
  await redis.set(kvTaskKey(username), seeded);
  return seeded;
}

async function kvSaveTasks(username: string, tasks: Task[]): Promise<void> {
  const redis = getRedis();
  await redis.set(kvTaskKey(username), tasks);
}

// ── Public async store API ────────────────────────────────────────────────────

async function generateToken(username: string): Promise<string> {
  const token = Buffer.from(`${username}:${Date.now()}:${Math.random()}`).toString("base64url");
  if (USE_KV) {
    await getRedis().set(kvTokenKey(token), username, { ex: TOKEN_TTL });
  } else {
    memTokens().set(token, username);
  }
  return token;
}

async function validateToken(token: string): Promise<string | null> {
  if (USE_KV) {
    return await getRedis().get<string>(kvTokenKey(token));
  }
  return memTokens().get(token) ?? null;
}

async function invalidateToken(token: string): Promise<void> {
  if (USE_KV) {
    await getRedis().del(kvTokenKey(token));
  } else {
    memTokens().delete(token);
  }
}

function findUser(username: string, password: string): User | undefined {
  return USERS.find((u) => u.username === username && u.password === password);
}

async function getAllTasks(username: string, status?: string, assignee?: string): Promise<Task[]> {
  let tasks = USE_KV ? await kvGetTasks(username) : memUserTasks(username);
  if (status) tasks = tasks.filter((t) => t.status === status);
  if (assignee) tasks = tasks.filter((t) => t.assignee === assignee);
  return tasks;
}

async function getTaskById(username: string, id: string): Promise<Task | undefined> {
  const tasks = USE_KV ? await kvGetTasks(username) : memUserTasks(username);
  return tasks.find((t) => t.id === id);
}

async function createTask(
  username: string,
  data: Omit<Task, "id" | "createdAt" | "updatedAt">
): Promise<Task> {
  const tasks = USE_KV ? await kvGetTasks(username) : memUserTasks(username);
  const task: Task = {
    ...data,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(task);
  if (USE_KV) await kvSaveTasks(username, tasks);
  return task;
}

async function updateTask(
  username: string,
  id: string,
  data: Partial<Omit<Task, "id" | "createdAt">>
): Promise<Task | null> {
  const tasks = USE_KV ? await kvGetTasks(username) : memUserTasks(username);
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  tasks[index] = { ...tasks[index], ...data, updatedAt: new Date().toISOString() };
  if (USE_KV) await kvSaveTasks(username, tasks);
  return tasks[index];
}

async function deleteTask(username: string, id: string): Promise<boolean> {
  const tasks = USE_KV ? await kvGetTasks(username) : memUserTasks(username);
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  if (USE_KV) await kvSaveTasks(username, tasks);
  return true;
}

export const store = {
  generateToken,
  validateToken,
  invalidateToken,
  findUser,
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};

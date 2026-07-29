import { store } from "../lib/store";

describe("KT-23 store soft-delete", () => {
  it("soft-deletes a task and excludes it from lists by default", async () => {
    const username = "user1";

    const before = await store.getAllTasks(username);
    expect(before.length).toBeGreaterThan(0);
    const victim = before[0];

    const deleted = await store.softDeleteTask(username, victim.id);
    expect(deleted).not.toBeNull();
    expect(deleted?.deletedAt).toBeTruthy();

    const after = await store.getAllTasks(username);
    expect(after.find((t) => t.id === victim.id)).toBeUndefined();

    const includeDeleted = await store.getAllTasks(username, undefined, undefined, true);
    expect(includeDeleted.find((t) => t.id === victim.id)).toBeDefined();
  });

  it("restores a soft-deleted task", async () => {
    const username = "user1";

    const tasks = await store.getAllTasks(username, undefined, undefined, true);
    const victim = tasks[0];

    await store.softDeleteTask(username, victim.id);
    const restored = await store.restoreTask(username, victim.id);

    expect(restored).not.toBeNull();
    expect(restored?.deletedAt).toBeNull();

    const after = await store.getAllTasks(username);
    expect(after.find((t) => t.id === victim.id)).toBeDefined();
  });
});

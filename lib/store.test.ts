import { store } from './store';
import { Task } from './types';

// Mock Redis to force in-memory mode
process.env.KV_REST_API_URL = '';
process.env.KV_REST_API_TOKEN = '';

describe('store.getAllTasks', () => {
  const mockTasks: Task[] = [
    {
      id: 't1',
      title: 'Login feature',
      description: 'Implement login API endpoint',
      status: 'todo',
      priority: 'high',
      assignee: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 't2',
      title: 'Write tests',
      description: 'Add unit tests for API routes',
      status: 'in-progress',
      priority: 'medium',
      assignee: 'user1',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 't3',
      title: 'Database migration',
      description: 'Migrate data to new schema',
      status: 'todo',
      priority: 'high',
      assignee: 'admin',
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    },
    {
      id: 't4',
      title: 'Performance testing',
      description: 'Run load tests on API endpoints',
      status: 'done',
      priority: 'low',
      assignee: 'user1',
      createdAt: '2024-01-04T00:00:00Z',
      updatedAt: '2024-01-04T00:00:00Z',
    },
  ];

  beforeEach(() => {
    // Reset in-memory store
    globalThis.__kata_tasks_map = new Map();
    globalThis.__kata_tasks_map.set('testuser', [...mockTasks]);
  });

  describe('Priority filter', () => {
    it('returns only high-priority tasks when priority="high"', async () => {
      const result = await store.getAllTasks('testuser', undefined, undefined, undefined, 'high');
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.priority === 'high')).toBe(true);
    });

    it('returns only low-priority tasks when priority="low"', async () => {
      const result = await store.getAllTasks('testuser', undefined, undefined, undefined, 'low');
      expect(result).toHaveLength(1);
      expect(result[0].priority).toBe('low');
    });

    it('returns only medium-priority tasks when priority="medium"', async () => {
      const result = await store.getAllTasks('testuser', undefined, undefined, undefined, 'medium');
      expect(result).toHaveLength(1);
      expect(result[0].priority).toBe('medium');
    });

    it('returns all tasks when priority=undefined', async () => {
      const result = await store.getAllTasks('testuser', undefined, undefined, undefined, undefined);
      expect(result).toHaveLength(4);
    });
  });

  describe('Search filter', () => {
    it('returns tasks with search term in title', async () => {
      const result = await store.getAllTasks('testuser', undefined, undefined, 'login');
      expect(result).toHaveLength(1);
      expect(result[0].title).toContain('Login');
    });

    it('returns tasks with search term in description', async () => {
      const result = await store.getAllTasks('testuser', undefined, undefined, 'api');
      expect(result).toHaveLength(2);
      expect(result.some((t) => t.description.toLowerCase().includes('api'))).toBe(true);
    });

    it('returns empty array when no tasks match search term', async () => {
      const result = await store.getAllTasks('testuser', undefined, undefined, 'xyz');
      expect(result).toHaveLength(0);
    });

    it('returns all tasks when search=undefined', async () => {
      const result = await store.getAllTasks('testuser', undefined, undefined, undefined);
      expect(result).toHaveLength(4);
    });

    it('performs case-insensitive search', async () => {
      const result = await store.getAllTasks('testuser', undefined, undefined, 'LOGIN');
      expect(result).toHaveLength(1);
      expect(result[0].title.toLowerCase()).toContain('login');
    });
  });

  describe('Combined filters', () => {
    it('returns tasks matching status + priority + search', async () => {
      const result = await store.getAllTasks('testuser', 'todo', undefined, 'api', 'high');
      expect(result).toHaveLength(0); // No "todo + high + api" tasks
    });

    it('returns tasks matching priority + assignee', async () => {
      const result = await store.getAllTasks('testuser', undefined, 'admin', undefined, 'high');
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.assignee === 'admin' && t.priority === 'high')).toBe(true);
    });

    it('returns empty array when no tasks match combined filters', async () => {
      const result = await store.getAllTasks('testuser', 'done', 'admin', 'xyz', 'high');
      expect(result).toHaveLength(0);
    });
  });
});

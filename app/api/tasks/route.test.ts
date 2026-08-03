import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { store } from '@/lib/store';
import { Task } from '@/lib/types';

// Mock the store module
jest.mock('@/lib/store', () => ({
  store: {
    validateToken: jest.fn(),
    getAllTasks: jest.fn(),
    createTask: jest.fn(),
  },
}));

const mockStore = store as jest.Mocked<typeof store>;

describe('GET /api/tasks', () => {
  const mockTasks: Task[] = [
    {
      id: 't1',
      title: 'Login feature',
      description: 'Implement login API',
      status: 'todo',
      priority: 'high',
      assignee: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 't2',
      title: 'Testing',
      description: 'Write API tests',
      status: 'in-progress',
      priority: 'low',
      assignee: 'user1',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.validateToken.mockResolvedValue('testuser');
    mockStore.getAllTasks.mockResolvedValue(mockTasks);
  });

  it('returns 401 without auth token', async () => {
    mockStore.validateToken.mockResolvedValue(null);
    const request = new NextRequest('http://localhost/api/tasks', {
      method: 'GET',
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 200 with tasks when search parameter matches', async () => {
    const request = new NextRequest('http://localhost/api/tasks?search=login', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(mockStore.getAllTasks).toHaveBeenCalledWith('testuser', undefined, undefined, 'login', undefined);
  });

  it('returns 200 with empty array when search has no matches', async () => {
    mockStore.getAllTasks.mockResolvedValue([]);
    const request = new NextRequest('http://localhost/api/tasks?search=xyz', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toEqual([]);
  });

  it('performs case-insensitive search', async () => {
    const request = new NextRequest('http://localhost/api/tasks?search=LOGIN', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(mockStore.getAllTasks).toHaveBeenCalledWith('testuser', undefined, undefined, 'LOGIN', undefined);
  });

  it('returns 400 when search term exceeds 200 characters', async () => {
    const longSearch = 'a'.repeat(201);
    const request = new NextRequest(`http://localhost/api/tasks?search=${longSearch}`, {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });
    const response = await GET(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Search term too long. Maximum 200 characters allowed');
  });

  it('returns 200 with high-priority tasks when priority=high', async () => {
    const request = new NextRequest('http://localhost/api/tasks?priority=high', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(mockStore.getAllTasks).toHaveBeenCalledWith('testuser', undefined, undefined, undefined, 'high');
  });

  it('returns 200 with low-priority tasks when priority=low', async () => {
    const request = new NextRequest('http://localhost/api/tasks?priority=low', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(mockStore.getAllTasks).toHaveBeenCalledWith('testuser', undefined, undefined, undefined, 'low');
  });

  it('returns 400 when priority value is invalid', async () => {
    const request = new NextRequest('http://localhost/api/tasks?priority=invalid', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });
    const response = await GET(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid priority value. Must be low, medium, or high');
  });

  it('returns 200 with tasks matching all filters (status + priority + search)', async () => {
    const request = new NextRequest('http://localhost/api/tasks?status=todo&priority=high&search=api', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(mockStore.getAllTasks).toHaveBeenCalledWith('testuser', 'todo', undefined, 'api', 'high');
  });

  it('returns 200 with all tasks when no filters are applied (backward compatibility)', async () => {
    const request = new NextRequest('http://localhost/api/tasks', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(mockStore.getAllTasks).toHaveBeenCalledWith('testuser', undefined, undefined, undefined, undefined);
    const json = await response.json();
    expect(json.data).toEqual(mockTasks);
  });
});

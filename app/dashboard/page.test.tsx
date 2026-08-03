/**
 * Component tests for Dashboard page
 * Tests task filtering, search, and priority filter functionality
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DashboardPage from './page';
import type { Task } from '@/lib/types';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the utils module
jest.mock('@/lib/utils', () => ({
  isTaskOverdue: jest.fn((task) => {
    // Mock implementation: task is overdue if dueDate is '2026-01-01' and status is not 'done'
    return task.dueDate === '2026-01-01' && task.status !== 'done';
  }),
  getTodayDateString: jest.fn(() => '2026-03-15'),
}));

// Mock components to simplify testing
jest.mock('@/components/TaskCard', () => {
  return function MockTaskCard({ task }: { task: Task }) {
    return <div data-testid="task-card" data-task-id={task.id}>{task.title}</div>;
  };
});

jest.mock('@/components/TaskForm', () => {
  return function MockTaskForm() {
    return <div data-testid="task-form">Task Form</div>;
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('Dashboard Page', () => {
  const mockTasks: Task[] = [
    {
      id: 't1',
      title: 'Overdue Task',
      description: 'This is overdue',
      status: 'todo',
      priority: 'high',
      assignee: 'user1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      dueDate: '2026-01-01', // Overdue based on mock
    },
    {
      id: 't2',
      title: 'In Progress Task',
      description: 'Work in progress',
      status: 'in-progress',
      priority: 'medium',
      assignee: 'user1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      dueDate: '2026-12-31', // Not overdue
    },
    {
      id: 't3',
      title: 'Done Task',
      description: 'Completed',
      status: 'done',
      priority: 'low',
      assignee: 'user1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      dueDate: '2026-01-01', // Has past date but done
    },
    {
      id: 't4',
      title: 'Todo Task',
      description: 'To do',
      status: 'todo',
      priority: 'medium',
      assignee: 'user1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      dueDate: '2026-12-31', // Not overdue
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('token', 'test-token');
    localStorageMock.setItem('username', 'testuser');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: mockTasks }),
    });
  });

  // Core rendering tests
  it('should display all five filter options', () => {
    render(<DashboardPage />);
    
    expect(screen.getByTestId('filter-all')).toBeInTheDocument();
    expect(screen.getByTestId('filter-todo')).toBeInTheDocument();
    expect(screen.getByTestId('filter-in-progress')).toBeInTheDocument();
    expect(screen.getByTestId('filter-done')).toBeInTheDocument();
    expect(screen.getByTestId('filter-overdue')).toBeInTheDocument();
  });

  it('should display add task button', () => {
    render(<DashboardPage />);
    
    expect(screen.getByTestId('add-task-button')).toBeInTheDocument();
  });

  it('should display logout button', () => {
    render(<DashboardPage />);
    
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
  });

  // NEW TESTS FOR TASK-06: Search and Priority Filter functionality

  describe('Search and Priority Filter UI', () => {
    it('renders search input with correct data-testid', () => {
      render(<DashboardPage />);
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
    });

    it('renders priority filter chip group with All/Low/Medium/High buttons', () => {
      render(<DashboardPage />);
      expect(screen.getByTestId('priority-filter')).toBeInTheDocument();
      expect(screen.getByTestId('filter-priority-all')).toBeInTheDocument();
      expect(screen.getByTestId('filter-priority-low')).toBeInTheDocument();
      expect(screen.getByTestId('filter-priority-medium')).toBeInTheDocument();
      expect(screen.getByTestId('filter-priority-high')).toBeInTheDocument();
    });

    it('typing in search input triggers debounced fetch', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);
      
      jest.clearAllMocks();
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'api');

      // Should not fetch immediately (debounced)
      expect(global.fetch).not.toHaveBeenCalled();

      // Wait for debounce (300ms + buffer)
      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('search=api'),
            expect.any(Object)
          );
        },
        { timeout: 500 }
      );
    });

    it('clicking priority filter chip triggers immediate fetch', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      jest.clearAllMocks();

      const highPriorityButton = screen.getByTestId('filter-priority-high');
      await user.click(highPriorityButton);

      // Should fetch immediately (no debounce for priority)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('priority=high'),
          expect.any(Object)
        );
      });
    });

    it('combined filters build correct query string', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      jest.clearAllMocks();

      // Select status
      const todoButton = screen.getByTestId('filter-todo');
      await user.click(todoButton);

      // Select priority
      const highButton = screen.getByTestId('filter-priority-high');
      await user.click(highButton);

      // Type search term
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'api');

      // Wait for debounced fetch with all params
      await waitFor(
        () => {
          const calls = (global.fetch as jest.Mock).mock.calls;
          const lastCall = calls[calls.length - 1];
          expect(lastCall[0]).toContain('status=todo');
          expect(lastCall[0]).toContain('priority=high');
          expect(lastCall[0]).toContain('search=api');
        },
        { timeout: 500 }
      );
    });

    it('displays filter-specific empty message when no tasks match', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const user = userEvent.setup();
      render(<DashboardPage />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'xyz');

      await waitFor(
        () => {
          const emptyState = screen.getByTestId('empty-state');
          expect(emptyState).toHaveTextContent(
            'No tasks match the selected filters. Try adjusting your search or filters.'
          );
        },
        { timeout: 500 }
      );
    });

    it('displays default empty message when no filters active', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(<DashboardPage />);

      await waitFor(() => {
        const emptyState = screen.getByTestId('empty-state');
        expect(emptyState).toHaveTextContent('No tasks found. Add one to get started!');
      });
    });

    it('search input does not trigger fetch immediately (300ms delay)', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      jest.clearAllMocks();

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'a');

      // Should NOT have called fetch yet (debounced)
      expect(global.fetch).not.toHaveBeenCalled();

      // After 300ms+, it should have been called
      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('search=a'),
            expect.any(Object)
          );
        },
        { timeout: 500 }
      );
    });

    it('clearing search input resets to all tasks', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test');
      
      await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test'),
        expect.any(Object)
      ), { timeout: 500 });

      jest.clearAllMocks();
      await user.clear(searchInput);

      // Wait for debounced fetch with empty search (returns to base /api/tasks)
      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith('/api/tasks', expect.any(Object));
        },
        { timeout: 500 }
      );
    });

    it('clicking "All" on priority filter removes priority param from query', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      // First set priority to high
      const highButton = screen.getByTestId('filter-priority-high');
      await user.click(highButton);

      await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('priority=high'),
        expect.any(Object)
      ));

      jest.clearAllMocks();

      // Then click "All"
      const allButton = screen.getByTestId('filter-priority-all');
      await user.click(allButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tasks', expect.any(Object));
      });
    });
  });
});

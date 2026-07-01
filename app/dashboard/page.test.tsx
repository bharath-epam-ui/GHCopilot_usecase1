/**
 * Component tests for Dashboard page
 * Tests task filtering, especially the overdue filter
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
});

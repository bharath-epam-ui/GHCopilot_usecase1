/**
 * Unit tests for date utility functions
 * Tests getTodayDateString() and isTaskOverdue()
 */

import { getTodayDateString, isTaskOverdue } from './utils';
import type { Task } from './types';

describe('getTodayDateString', () => {
  it('should return date in YYYY-MM-DD format', () => {
    const result = getTodayDateString();
    // Matches YYYY-MM-DD pattern
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return a valid date', () => {
    const result = getTodayDateString();
    const date = new Date(result);
    expect(date.toString()).not.toBe('Invalid Date');
  });

  it('should return today\'s date', () => {
    const result = getTodayDateString();
    const today = new Date();
    const expected = today.toISOString().split('T')[0];
    expect(result).toBe(expected);
  });
});

describe('isTaskOverdue', () => {
  // Save original Date
  const RealDate = Date;
  
  beforeEach(() => {
    // Mock Date to return a fixed date (2026-03-15)
    const mockDate = new Date('2026-03-15T00:00:00.000Z');
    global.Date = class extends RealDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          return mockDate as any;
        }
        return new RealDate(...args) as any;
      }
      static now() {
        return mockDate.getTime();
      }
    } as any;
  });

  afterEach(() => {
    // Restore real Date
    global.Date = RealDate;
  });

  it('should return true for past due date with todo status', () => {
    const task: Task = {
      id: 't1',
      title: 'Test Task',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee: 'user1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      dueDate: '2026-03-10', // 5 days ago
    };
    expect(isTaskOverdue(task)).toBe(true);
  });

  it('should return true for past due date with in-progress status', () => {
    const task: Task = {
      id: 't2',
      title: 'Test Task',
      description: '',
      status: 'in-progress',
      priority: 'high',
      assignee: 'user1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      dueDate: '2026-03-01',
    };
    expect(isTaskOverdue(task)).toBe(true);
  });

  it('should return false for past due date with done status', () => {
    const task: Task = {
      id: 't3',
      title: 'Test Task',
      description: '',
      status: 'done',
      priority: 'low',
      assignee: 'user1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      dueDate: '2026-03-10',
    };
    expect(isTaskOverdue(task)).toBe(false);
  });

  it('should return false for future due date', () => {
    const task: Task = {
      id: 't4',
      title: 'Test Task',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee: 'user1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      dueDate: '2026-03-20', // 5 days from now
    };
    expect(isTaskOverdue(task)).toBe(false);
  });

  it('should return false for today\'s due date', () => {
    const task: Task = {
      id: 't5',
      title: 'Test Task',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee: 'user1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      dueDate: '2026-03-15', // Today
    };
    expect(isTaskOverdue(task)).toBe(false);
  });

  it('should return false when no due date is set', () => {
    const task: Task = {
      id: 't6',
      title: 'Test Task',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee: 'user1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      // No dueDate property
    };
    expect(isTaskOverdue(task)).toBe(false);
  });

  it('should return false when due date is undefined', () => {
    const task: Task = {
      id: 't7',
      title: 'Test Task',
      description: '',
      status: 'todo',
      priority: 'medium',
      assignee: 'user1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      dueDate: undefined,
    };
    expect(isTaskOverdue(task)).toBe(false);
  });
});

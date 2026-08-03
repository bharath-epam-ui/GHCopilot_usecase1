/**
 * Component tests for TaskCard
 * Tests due date display and overdue badge functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskCard from './TaskCard';
import type { Task } from '@/lib/types';

// Mock the utils module
jest.mock('@/lib/utils', () => ({
  isTaskOverdue: jest.fn(),
}));

import { isTaskOverdue } from '@/lib/utils';

describe('TaskCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const baseTask: Task = {
    id: 't1',
    title: 'Test Task',
    description: 'Test description',
    status: 'todo',
    priority: 'medium',
    assignee: 'user1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render task with all basic fields', () => {
    render(<TaskCard task={baseTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByTestId('task-status')).toHaveTextContent('To Do');
    expect(screen.getByTestId('task-priority')).toHaveTextContent('medium');
    expect(screen.getByTestId('task-assignee')).toHaveTextContent('user1');
  });

  it('should display due date when present', () => {
    const taskWithDueDate: Task = {
      ...baseTask,
      dueDate: '2026-12-31',
    };

    render(<TaskCard task={taskWithDueDate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const dueDateElement = screen.getByTestId('task-duedate');
    expect(dueDateElement).toBeInTheDocument();
    expect(dueDateElement).toHaveTextContent('Due: Dec 31, 2026');
  });

  it('should not display due date when not present', () => {
    render(<TaskCard task={baseTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.queryByTestId('task-duedate')).not.toBeInTheDocument();
  });

  it('should display overdue badge when task is overdue', () => {
    (isTaskOverdue as jest.Mock).mockReturnValue(true);
    
    const overdueTask: Task = {
      ...baseTask,
      dueDate: '2026-01-01',
      status: 'todo',
    };

    render(<TaskCard task={overdueTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const overdueBadge = screen.getByTestId('task-overdue-badge');
    expect(overdueBadge).toBeInTheDocument();
    expect(overdueBadge).toHaveTextContent('OVERDUE');
    expect(overdueBadge).toHaveClass('bg-red-600', 'text-white');
  });

  it('should not display overdue badge when task is not overdue', () => {
    (isTaskOverdue as jest.Mock).mockReturnValue(false);
    
    const taskNotOverdue: Task = {
      ...baseTask,
      dueDate: '2026-12-31',
      status: 'todo',
    };

    render(<TaskCard task={taskNotOverdue} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.queryByTestId('task-overdue-badge')).not.toBeInTheDocument();
  });

  it('should not display overdue badge for completed tasks', () => {
    (isTaskOverdue as jest.Mock).mockReturnValue(false);
    
    const completedTask: Task = {
      ...baseTask,
      dueDate: '2026-01-01',
      status: 'done',
    };

    render(<TaskCard task={completedTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    expect(screen.queryByTestId('task-overdue-badge')).not.toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(<TaskCard task={baseTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const editButton = screen.getByTestId('edit-task-button');
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(baseTask);
  });

  it('should call onDelete when delete button is clicked', () => {
    render(<TaskCard task={baseTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByTestId('delete-task-button');
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith('t1');
  });

  it('should handle invalid due date gracefully', () => {
    const taskWithInvalidDate: Task = {
      ...baseTask,
      dueDate: 'invalid-date',
    };

    render(<TaskCard task={taskWithInvalidDate} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    // Should still render without crashing
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    // Due date should show formatted output (even if invalid)
    const dueDateElement = screen.getByTestId('task-duedate');
    expect(dueDateElement).toBeInTheDocument();
    expect(dueDateElement).toHaveTextContent(/Due:/);
  });

  it('should format various date formats correctly', () => {
    const testCases = [
      { input: '2026-01-15', expected: 'Jan 15, 2026' },
      { input: '2026-06-30', expected: 'Jun 30, 2026' },
      { input: '2026-12-25', expected: 'Dec 25, 2026' },
    ];

    testCases.forEach(({ input, expected }) => {
      const { unmount } = render(
        <TaskCard
          task={{ ...baseTask, dueDate: input }}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
      
      expect(screen.getByTestId('task-duedate')).toHaveTextContent(`Due: ${expected}`);
      unmount();
    });
  });

  it('should display correct status labels', () => {
    const statuses: Array<{ status: Task['status']; label: string }> = [
      { status: 'todo', label: 'To Do' },
      { status: 'in-progress', label: 'In Progress' },
      { status: 'done', label: 'Done' },
    ];

    statuses.forEach(({ status, label }) => {
      const { unmount } = render(
        <TaskCard
          task={{ ...baseTask, status }}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
      
      expect(screen.getByTestId('task-status')).toHaveTextContent(label);
      unmount();
    });
  });

  it('should display correct priority labels', () => {
    const priorities: Array<{ priority: Task['priority']; label: string }> = [
      { priority: 'low', label: 'low' },
      { priority: 'medium', label: 'medium' },
      { priority: 'high', label: 'high' },
    ];

    priorities.forEach(({ priority, label }) => {
      const { unmount } = render(
        <TaskCard
          task={{ ...baseTask, priority }}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
      
      expect(screen.getByTestId('task-priority')).toHaveTextContent(label);
      unmount();
    });
  });
});

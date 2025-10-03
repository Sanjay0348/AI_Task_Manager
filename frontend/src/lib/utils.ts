import { clsx } from 'clsx';
import { format, isToday, isTomorrow, isYesterday, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: any[]) {
  return clsx(inputs);
}

// Format date for display
export function formatDate(date: string | Date, formatStr: string = 'PP') {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
}

// Format relative time
export function formatRelativeTime(date: string | Date) {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'HH:mm')}`;
  } else if (isTomorrow(dateObj)) {
    return `Tomorrow at ${format(dateObj, 'HH:mm')}`;
  } else if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'HH:mm')}`;
  } else {
    return formatDistanceToNow(dateObj, { addSuffix: true });
  }
}

// Check if task is overdue
export function isTaskOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date();
}

// Get task status color class
export function getTaskStatusColor(status: string) {
  const statusMap = {
    pending: 'status-pending',
    in_progress: 'status-in-progress',
    done: 'status-done',
    cancelled: 'status-cancelled',
  };
  return statusMap[status as keyof typeof statusMap] || 'status-pending';
}

// Get task priority color class
export function getTaskPriorityColor(priority: string) {
  const priorityMap = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
    urgent: 'priority-urgent',
  };
  return priorityMap[priority as keyof typeof priorityMap] || 'priority-medium';
}

// Capitalize first letter
export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Format task title for display (truncate if too long)
export function formatTaskTitle(title: string, maxLength: number = 50) {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
}

// Generate task status options
export const taskStatusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'done', label: 'Done', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

// Generate task priority options
export const taskPriorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-gray-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
];

// Sort tasks by priority and status
export function sortTasks(tasks: any[]) {
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  const statusOrder = { pending: 4, in_progress: 3, done: 1, cancelled: 2 };

  return tasks.sort((a, b) => {
    // First sort by status (active tasks first)
    const statusDiff = statusOrder[b.status as keyof typeof statusOrder] - statusOrder[a.status as keyof typeof statusOrder];
    if (statusDiff !== 0) return statusDiff;

    // Then by priority
    const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    if (priorityDiff !== 0) return priorityDiff;

    // Finally by creation date (newer first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

import { useCallback, useMemo, useState } from 'react';
import type { ID, Priority, Task, TaskStatus, TaskType } from '@/types/domain';
import { taskIsOverdue } from '@/utils/selectors';

export type TaskSortKey = 'rank' | 'priority' | 'dueDate' | 'points' | 'updated' | 'title';
export type TaskGroupKey = 'none' | 'assignee' | 'priority' | 'type' | 'epic';

export interface TaskFilterState {
  search: string;
  projectIds: ID[];
  assigneeIds: ID[];
  types: TaskType[];
  priorities: Priority[];
  statuses: TaskStatus[];
  labelIds: ID[];
  sprintIds: ID[];
  onlyOverdue: boolean;
  onlyBlocked: boolean;
  onlyMine: boolean;
  sort: TaskSortKey;
  group: TaskGroupKey;
}

export const emptyTaskFilters: TaskFilterState = {
  search: '',
  projectIds: [],
  assigneeIds: [],
  types: [],
  priorities: [],
  statuses: [],
  labelIds: [],
  sprintIds: [],
  onlyOverdue: false,
  onlyBlocked: false,
  onlyMine: false,
  sort: 'rank',
  group: 'none',
};

const PRIORITY_ORDER: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function sortTasks(tasks: Task[], sort: TaskSortKey): Task[] {
  const copy = [...tasks];
  switch (sort) {
    case 'priority':
      return copy.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    case 'dueDate':
      return copy.sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
    case 'points':
      return copy.sort((a, b) => (b.storyPoints ?? 0) - (a.storyPoints ?? 0));
    case 'updated':
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case 'title':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'rank':
    default:
      return copy.sort((a, b) => a.rank - b.rank);
  }
}

interface UseTaskFiltersResult {
  filters: TaskFilterState;
  setFilter: <K extends keyof TaskFilterState>(key: K, value: TaskFilterState[K]) => void;
  reset: () => void;
  activeCount: number;
  apply: (tasks: readonly Task[]) => Task[];
}

/**
 * One filter implementation shared by the board, list, backlog and calendar so
 * the same filter chips behave identically everywhere.
 */
export function useTaskFilters(
  initial: Partial<TaskFilterState> = {},
  currentUserId?: ID,
): UseTaskFiltersResult {
  const [filters, setFilters] = useState<TaskFilterState>({ ...emptyTaskFilters, ...initial });

  const setFilter = useCallback(
    <K extends keyof TaskFilterState>(key: K, value: TaskFilterState[K]): void => {
      setFilters((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const reset = useCallback(() => setFilters({ ...emptyTaskFilters, ...initial }), [initial]);

  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count += 1;
    count += filters.projectIds.length ? 1 : 0;
    count += filters.assigneeIds.length ? 1 : 0;
    count += filters.types.length ? 1 : 0;
    count += filters.priorities.length ? 1 : 0;
    count += filters.statuses.length ? 1 : 0;
    count += filters.labelIds.length ? 1 : 0;
    count += filters.sprintIds.length ? 1 : 0;
    count += filters.onlyOverdue ? 1 : 0;
    count += filters.onlyBlocked ? 1 : 0;
    count += filters.onlyMine ? 1 : 0;
    return count;
  }, [filters]);

  const apply = useCallback(
    (tasks: readonly Task[]): Task[] => {
      const query = filters.search.trim().toLowerCase();
      const filtered = tasks.filter((task) => {
        if (query && !`${task.key} ${task.title}`.toLowerCase().includes(query)) return false;
        if (filters.projectIds.length && !filters.projectIds.includes(task.projectId)) return false;
        if (filters.assigneeIds.length && (!task.assigneeId || !filters.assigneeIds.includes(task.assigneeId)))
          return false;
        if (filters.types.length && !filters.types.includes(task.type)) return false;
        if (filters.priorities.length && !filters.priorities.includes(task.priority)) return false;
        if (filters.statuses.length && !filters.statuses.includes(task.status)) return false;
        if (filters.labelIds.length && !task.labelIds.some((id) => filters.labelIds.includes(id))) return false;
        if (filters.sprintIds.length && (!task.sprintId || !filters.sprintIds.includes(task.sprintId))) return false;
        if (filters.onlyOverdue && !taskIsOverdue(task)) return false;
        if (filters.onlyBlocked && task.status !== 'blocked') return false;
        if (filters.onlyMine && task.assigneeId !== currentUserId) return false;
        return true;
      });
      return sortTasks(filtered, filters.sort);
    },
    [filters, currentUserId],
  );

  return { filters, setFilter, reset, activeCount, apply };
}

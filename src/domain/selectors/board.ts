import type { Task, TaskStatus } from '@/types/domain';

export interface BoardColumn {
  status: TaskStatus;
  tasks: Task[];
}

export function selectBoardColumns(tasks: Task[], columns: TaskStatus[]): BoardColumn[] {
  return columns.map(status => ({
    status,
    tasks: tasks.filter(t => t.status === status).sort((a, b) => a.rank - b.rank),
  }));
}

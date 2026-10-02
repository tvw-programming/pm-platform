import type { Task } from '@/types/domain';

export function selectBacklogTasks(tasks: Task[], projectId?: string): Task[] {
  let filtered = tasks.filter(t => !t.sprintId);
  if (projectId) filtered = filtered.filter(t => t.projectId === projectId);
  return filtered.sort((a, b) => a.rank - b.rank);
}

export function selectSprintTasks(tasks: Task[], sprintId: string): Task[] {
  return tasks.filter(t => t.sprintId === sprintId).sort((a, b) => a.rank - b.rank);
}

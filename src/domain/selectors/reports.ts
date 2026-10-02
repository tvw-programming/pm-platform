import type { Task, TaskStatus } from '@/types/domain';

export function selectStatusDistribution(tasks: Task[]): Record<TaskStatus, number> {
  const dist = {} as Record<TaskStatus, number>;
  for (const t of tasks) {
    dist[t.status] = (dist[t.status] ?? 0) + 1;
  }
  return dist;
}

export function selectVelocity(
  tasks: Task[],
  sprints: { id: string; name: string }[],
): { sprintName: string; completed: number }[] {
  return sprints.map(s => ({
    sprintName: s.name,
    completed: tasks
      .filter(t => t.sprintId === s.id && t.status === 'done')
      .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
  }));
}

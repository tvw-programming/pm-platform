import type { Task } from '@/types/domain';

const LATENCY_MS = { min: 200, max: 600 };

function delay(): Promise<void> {
  const ms = LATENCY_MS.min + Math.random() * (LATENCY_MS.max - LATENCY_MS.min);
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const workItemRepo = {
  async getAll(): Promise<Task[]> {
    await delay();
    // In real app, this would be fetch(). For now, return from mock data.
    const { mockTasks } = await import('@/mock-data');
    return mockTasks;
  },
  async getById(id: string): Promise<Task | undefined> {
    await delay();
    const { mockTasks } = await import('@/mock-data');
    return mockTasks.find(t => t.id === id);
  },
  async update(id: string, patch: Partial<Task>): Promise<Task> {
    await delay();
    // Simulate server response
    const { mockTasks } = await import('@/mock-data');
    const task = mockTasks.find(t => t.id === id);
    if (!task) throw new Error(`Task ${id} not found`);
    return { ...task, ...patch, updatedAt: new Date().toISOString() };
  },
};

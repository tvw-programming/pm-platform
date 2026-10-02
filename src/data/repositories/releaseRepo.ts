import type { Release } from '@/types/domain';

const LATENCY_MS = { min: 200, max: 600 };

function delay(): Promise<void> {
  const ms = LATENCY_MS.min + Math.random() * (LATENCY_MS.max - LATENCY_MS.min);
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const releaseRepo = {
  async getAll(): Promise<Release[]> {
    await delay();
    const { releases } = await import('@/mock-data');
    return releases;
  },
  async getById(id: string): Promise<Release | undefined> {
    await delay();
    const { releases } = await import('@/mock-data');
    return releases.find(r => r.id === id);
  },
  async update(id: string, patch: Partial<Release>): Promise<Release> {
    await delay();
    const { releases } = await import('@/mock-data');
    const release = releases.find(r => r.id === id);
    if (!release) throw new Error(`Release ${id} not found`);
    return { ...release, ...patch };
  },
};

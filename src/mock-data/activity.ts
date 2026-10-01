import type { Activity, ActivityKind, DocumentRecord, Notification } from '@/types/domain';
import { mockTasks } from './tasks';
import { projects, daysAgo } from './projects';
import { sprints, releases } from './planning';

const summaryByKind: Record<ActivityKind, (label: string) => string> = {
  created: (l) => `created ${l}`,
  status_changed: (l) => `moved ${l} forward`,
  assigned: (l) => `reassigned ${l}`,
  commented: (l) => `commented on ${l}`,
  moved: (l) => `moved ${l} to another sprint`,
  released: (l) => `shipped ${l}`,
  sprint_started: (l) => `started ${l}`,
  sprint_completed: (l) => `closed ${l}`,
  attachment_added: (l) => `attached a file to ${l}`,
};

const taskKinds: ActivityKind[] = ['created', 'status_changed', 'assigned', 'commented', 'moved', 'attachment_added'];

function hourStamp(daysBack: number, hour: number, minute: number): string {
  return `${daysAgo(daysBack)}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
}

const taskActivity: Activity[] = mockTasks.slice(0, 48).map((task, index) => {
  const kind = taskKinds[index % taskKinds.length]!;
  return {
    id: `ac-t-${index}`,
    kind,
    actorId: task.assigneeId ?? task.reporterId,
    projectId: task.projectId,
    entityType: 'task',
    entityId: task.id,
    entityLabel: task.key,
    summary: summaryByKind[kind](task.key),
    createdAt: hourStamp(Math.floor(index / 5), 9 + (index % 9), (index * 7) % 60),
  };
});

const sprintActivity: Activity[] = sprints.map((sprint, index) => {
  const kind: ActivityKind = sprint.status === 'completed' ? 'sprint_completed' : 'sprint_started';
  return {
    id: `ac-s-${index}`,
    kind,
    actorId: 'u-8',
    projectId: sprint.projectId,
    entityType: 'sprint',
    entityId: sprint.id,
    entityLabel: sprint.name,
    summary: summaryByKind[kind](sprint.name),
    createdAt: `${sprint.status === 'completed' ? sprint.endDate : sprint.startDate}T08:30:00.000Z`,
  };
});

const releaseActivity: Activity[] = releases
  .filter((release) => release.releasedOn !== undefined)
  .map((release, index) => ({
    id: `ac-r-${index}`,
    kind: 'released' as const,
    actorId: release.ownerId,
    projectId: release.projectId,
    entityType: 'release' as const,
    entityId: release.id,
    entityLabel: `${release.name} ${release.version}`,
    summary: summaryByKind.released(`${release.name} ${release.version}`),
    createdAt: `${release.releasedOn}T17:45:00.000Z`,
  }));

const projectActivity: Activity[] = projects.slice(0, 4).map((project, index) => ({
  id: `ac-p-${index}`,
  kind: 'created' as const,
  actorId: project.productOwnerId,
  projectId: project.id,
  entityType: 'project' as const,
  entityId: project.id,
  entityLabel: project.name,
  summary: `set ${project.name} health to ${project.health.replace('_', ' ')}`,
  createdAt: hourStamp(index + 1, 12, 15),
}));

export const activities: Activity[] = [
  ...taskActivity,
  ...sprintActivity,
  ...releaseActivity,
  ...projectActivity,
].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const notifications: Notification[] = [
  {
    id: 'n-1',
    title: 'FRG-5 is blocked',
    body: 'APAC region failover drill is blocked by an open platform incident.',
    createdAt: hourStamp(0, 8, 42),
    read: false,
    severity: 'error',
    link: '/projects/p-forge/board',
  },
  {
    id: 'n-2',
    title: 'Orbit GA readiness at 48%',
    body: 'Two readiness checks remain and the target date is inside three weeks.',
    createdAt: hourStamp(0, 7, 15),
    read: false,
    severity: 'warning',
    link: '/releases',
  },
  {
    id: 'n-3',
    title: 'Priya Nair mentioned you',
    body: '"Agreed on the approach. Please add the accessible summary before you open a PR."',
    createdAt: hourStamp(1, 16, 5),
    read: false,
    severity: 'info',
    link: '/my-work',
  },
  {
    id: 'n-4',
    title: 'ATL Sprint 14 closed',
    body: '45 of 44 committed points completed. Velocity trending up.',
    createdAt: hourStamp(3, 18, 0),
    read: true,
    severity: 'success',
    link: '/sprints',
  },
  {
    id: 'n-5',
    title: 'Atlas Foundations 3.3.2 shipped',
    body: 'Deployed to production with no incidents.',
    createdAt: hourStamp(23, 17, 45),
    read: true,
    severity: 'success',
    link: '/releases',
  },
  {
    id: 'n-6',
    title: 'New risk logged on Orbit',
    body: 'Metrics store query latency above SLA at p95.',
    createdAt: hourStamp(11, 10, 30),
    read: true,
    severity: 'warning',
    link: '/projects/p-orbit/overview',
  },
];

export const documents: DocumentRecord[] = [
  {
    id: 'd-1',
    title: 'Atlas Workspace Revamp — PRD',
    kind: 'prd',
    projectId: 'p-atlas',
    authorId: 'u-1',
    updatedAt: hourStamp(2, 11, 20),
    excerpt:
      'Problem statement, target personas, success metrics and the three-phase rollout plan for the rebuilt workspace shell.',
    tags: ['prd', 'core-experience'],
  },
  {
    id: 'd-2',
    title: 'Unified task surface — technical design',
    kind: 'spec',
    projectId: 'p-atlas',
    authorId: 'u-4',
    updatedAt: hourStamp(5, 9, 5),
    excerpt:
      'One task model shared by board, list and calendar; a single filter contract; and the virtualisation strategy for large boards.',
    tags: ['architecture', 'frontend'],
  },
  {
    id: 'd-3',
    title: 'Accessibility conformance checklist',
    kind: 'runbook',
    projectId: 'p-atlas',
    authorId: 'u-7',
    updatedAt: hourStamp(1, 15, 40),
    excerpt: 'WCAG 2.2 AA criteria mapped to components, with the keyboard drag-and-drop pattern we standardised on.',
    tags: ['accessibility', 'qa'],
  },
  {
    id: 'd-4',
    title: 'Metrics store architecture',
    kind: 'spec',
    projectId: 'p-orbit',
    authorId: 'u-6',
    updatedAt: hourStamp(8, 13, 12),
    excerpt: 'Columnar storage layout, daily rollup jobs, retention policy and the typed query layer contract.',
    tags: ['data', 'architecture'],
  },
  {
    id: 'd-5',
    title: 'Orbit launch plan',
    kind: 'notes',
    projectId: 'p-orbit',
    authorId: 'u-3',
    updatedAt: hourStamp(4, 10, 0),
    excerpt: 'Packaging, pricing, enablement and the staged rollout from canary to GA.',
    tags: ['launch', 'growth'],
  },
  {
    id: 'd-6',
    title: 'Permissions service migration runbook',
    kind: 'runbook',
    projectId: 'p-forge',
    authorId: 'u-6',
    updatedAt: hourStamp(0, 9, 55),
    excerpt: 'Dual-write setup, shadow comparison procedure, read cutover steps and the rollback path.',
    tags: ['platform', 'runbook'],
  },
  {
    id: 'd-7',
    title: 'Multi-region failover drill report',
    kind: 'notes',
    projectId: 'p-forge',
    authorId: 'u-10',
    updatedAt: hourStamp(6, 16, 30),
    excerpt: 'Results from the EU and US drills, including the two findings that gate the APAC run.',
    tags: ['reliability'],
  },
  {
    id: 'd-8',
    title: 'Beacon onboarding research synthesis',
    kind: 'design',
    projectId: 'p-beacon',
    authorId: 'u-5',
    updatedAt: hourStamp(9, 14, 25),
    excerpt: 'Eleven interviews with new admins; three activation blockers and the checklist model that came out of them.',
    tags: ['research', 'onboarding'],
  },
  {
    id: 'd-9',
    title: 'Canvas v3 token contract',
    kind: 'spec',
    projectId: 'p-canvas',
    authorId: 'u-11',
    updatedAt: hourStamp(3, 12, 45),
    excerpt: 'Naming scheme, light and dark value pairs, and the migration path from v2 component props.',
    tags: ['design-system', 'tokens'],
  },
  {
    id: 'd-10',
    title: 'ATL Sprint 14 retrospective',
    kind: 'retro',
    projectId: 'p-atlas',
    authorId: 'u-2',
    updatedAt: hourStamp(3, 17, 10),
    excerpt: 'What worked: pairing rotation. What did not: late design handoff. Three actions carried into Sprint 15.',
    tags: ['retro', 'core-experience'],
  },
  {
    id: 'd-11',
    title: 'Pulse post-launch review',
    kind: 'retro',
    projectId: 'p-pulse',
    authorId: 'u-3',
    updatedAt: hourStamp(9, 11, 0),
    excerpt: 'Adoption at 38% of weekly actives, crash-free rate 99.7%, and the two features we would cut in hindsight.',
    tags: ['mobile', 'retro'],
  },
  {
    id: 'd-12',
    title: 'Relay connector contracts',
    kind: 'spec',
    projectId: 'p-relay',
    authorId: 'u-6',
    updatedAt: hourStamp(21, 10, 20),
    excerpt: 'Payload schemas, signature verification and the versioning policy for outbound webhooks.',
    tags: ['integrations', 'api'],
  },
];

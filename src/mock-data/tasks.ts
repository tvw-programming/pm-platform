import type {
  Attachment,
  ChecklistItem,
  Comment,
  Priority,
  Subtask,
  Task,
  TaskDependency,
  TaskStatus,
  TaskType,
} from '@/types/domain';
import { PRIORITIES, TASK_STATUSES, TASK_TYPES } from '@/types/domain';
import { labels, projects, daysAgo, daysFromToday } from './projects';
import { sprints, releases } from './planning';
import { users } from './people';

/** Deterministic LCG so the fixture set is stable between reloads. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const rand = createRandom(20260101);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)]!;
}

function pickMany<T>(items: readonly T[], max: number): T[] {
  const count = Math.floor(rand() * (max + 1));
  const pool = [...items];
  const out: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]!);
  }
  return out;
}

function chance(probability: number): boolean {
  return rand() < probability;
}

interface TitleSeed {
  title: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
}

/** Curated per-project work so titles read like a real backlog rather than
 *  "Task 47". Statuses are hand-set to produce a believable flow distribution. */
const seedsByProject: Record<string, TitleSeed[]> = {
  'p-atlas': [
    { title: 'Collapsible sidebar remembers state per workspace', type: 'story', status: 'done', priority: 'high' },
    { title: 'Workspace switcher keyboard navigation', type: 'story', status: 'done', priority: 'medium' },
    { title: 'Saved views persist filter and sort state', type: 'story', status: 'in_progress', priority: 'critical' },
    { title: 'Board column virtualisation for 500+ cards', type: 'improvement', status: 'in_progress', priority: 'high' },
    { title: 'Task detail drawer traps focus correctly', type: 'bug', status: 'in_review', priority: 'critical' },
    { title: 'Drag-and-drop has no keyboard equivalent', type: 'bug', status: 'blocked', priority: 'critical' },
    { title: 'Breadcrumb truncation on narrow viewports', type: 'bug', status: 'todo', priority: 'low' },
    { title: 'Global search returns stale project results', type: 'bug', status: 'in_progress', priority: 'high' },
    { title: 'Unified filter contract across board and list', type: 'story', status: 'in_review', priority: 'high' },
    { title: 'Inline title editing with optimistic rollback', type: 'story', status: 'todo', priority: 'medium' },
    { title: 'Reduce shell bundle below 180kb gzipped', type: 'improvement', status: 'todo', priority: 'medium' },
    { title: 'Remove legacy navigation feature flag', type: 'task', status: 'backlog', priority: 'low' },
    { title: 'Contrast audit for status and priority chips', type: 'task', status: 'in_progress', priority: 'high' },
    { title: 'Spike: offline draft persistence options', type: 'spike', status: 'done', priority: 'medium' },
    { title: 'Tablet board horizontal scroll momentum', type: 'bug', status: 'todo', priority: 'medium' },
    { title: 'Announce drag results to screen readers', type: 'story', status: 'blocked', priority: 'high' },
    { title: 'Quick create dialog validation messages', type: 'improvement', status: 'done', priority: 'low' },
    { title: 'Notification centre groups by project', type: 'story', status: 'backlog', priority: 'medium' },
    { title: 'Theme toggle respects system preference', type: 'story', status: 'done', priority: 'low' },
    { title: 'Deep links restore board filters', type: 'story', status: 'in_progress', priority: 'medium' },
    { title: 'Audit unused design tokens in the shell', type: 'task', status: 'backlog', priority: 'low' },
    { title: 'Empty state copy for filtered-out columns', type: 'improvement', status: 'todo', priority: 'low' },
    { title: 'Undo for destructive card actions', type: 'story', status: 'todo', priority: 'high' },
    { title: 'Permission-denied state on restricted projects', type: 'story', status: 'in_review', priority: 'medium' },
  ],
  'p-orbit': [
    { title: 'Funnel builder step reordering', type: 'story', status: 'done', priority: 'high' },
    { title: 'Cohort retention grid with weekly buckets', type: 'story', status: 'in_progress', priority: 'critical' },
    { title: 'p95 latency above 2s on 90-day windows', type: 'bug', status: 'blocked', priority: 'critical' },
    { title: 'Daily rollup job backfill for new tenants', type: 'task', status: 'in_progress', priority: 'high' },
    { title: 'Scheduled digest email template', type: 'story', status: 'todo', priority: 'medium' },
    { title: 'Export funnel results to CSV', type: 'story', status: 'done', priority: 'medium' },
    { title: 'Timezone handling in cohort boundaries', type: 'bug', status: 'in_review', priority: 'high' },
    { title: 'Metrics query layer type generation', type: 'improvement', status: 'done', priority: 'high' },
    { title: 'Spike: columnar store evaluation', type: 'spike', status: 'done', priority: 'high' },
    { title: 'Chart empty and no-data states', type: 'improvement', status: 'todo', priority: 'low' },
    { title: 'Reconcile funnel counts with warehouse', type: 'task', status: 'done', priority: 'critical' },
    { title: 'Digest unsubscribe handling', type: 'task', status: 'backlog', priority: 'low' },
    { title: 'Load test harness at 3x peak', type: 'task', status: 'in_progress', priority: 'high' },
    { title: 'Segment picker supports saved segments', type: 'story', status: 'backlog', priority: 'medium' },
    { title: 'Accessible text summaries for every chart', type: 'story', status: 'todo', priority: 'high' },
    { title: 'Cache invalidation on event schema change', type: 'bug', status: 'todo', priority: 'high' },
    { title: 'In-app help for funnel definitions', type: 'task', status: 'backlog', priority: 'low' },
  ],
  'p-forge': [
    { title: 'Permissions dual-write behind feature flag', type: 'story', status: 'done', priority: 'critical' },
    { title: 'Shadow diff reporting for policy decisions', type: 'story', status: 'in_progress', priority: 'critical' },
    { title: 'Read cutover runbook and rollback', type: 'task', status: 'in_review', priority: 'critical' },
    { title: 'APAC region failover drill', type: 'task', status: 'blocked', priority: 'critical' },
    { title: 'Tenant isolation integration tests', type: 'task', status: 'done', priority: 'high' },
    { title: 'Cross-region replication lag alerting', type: 'story', status: 'in_progress', priority: 'high' },
    { title: 'Policy evaluation latency regression', type: 'bug', status: 'in_progress', priority: 'critical' },
    { title: 'Audit log retention policy', type: 'task', status: 'todo', priority: 'medium' },
    { title: 'Deprecate inherited ACL table reads', type: 'improvement', status: 'backlog', priority: 'medium' },
    { title: 'Automate SOC 2 access-review evidence', type: 'story', status: 'backlog', priority: 'medium' },
    { title: 'Secrets rotation without restart', type: 'improvement', status: 'done', priority: 'high' },
    { title: 'Spike: cell-based tenancy model', type: 'spike', status: 'todo', priority: 'medium' },
    { title: 'Health check returns 200 during drain', type: 'bug', status: 'done', priority: 'high' },
    { title: 'Runbook: region evacuation', type: 'task', status: 'done', priority: 'high' },
    { title: 'Terraform module for the third region', type: 'task', status: 'in_review', priority: 'high' },
    { title: 'Permission-denied responses leak resource names', type: 'bug', status: 'todo', priority: 'critical' },
  ],
  'p-beacon': [
    { title: 'Checklist engine driven by activation events', type: 'story', status: 'in_progress', priority: 'critical' },
    { title: 'Role selection during invite flow', type: 'story', status: 'done', priority: 'high' },
    { title: 'Activation milestone instrumentation', type: 'task', status: 'in_progress', priority: 'high' },
    { title: 'Dismissible checklist with resume', type: 'story', status: 'todo', priority: 'medium' },
    { title: 'Tour anchor targets survive layout changes', type: 'story', status: 'backlog', priority: 'medium' },
    { title: 'Empty workspace sample data generator', type: 'story', status: 'in_review', priority: 'medium' },
    { title: 'Checklist copy review with content design', type: 'task', status: 'todo', priority: 'low' },
    { title: 'Pilot cohort feature flag targeting', type: 'task', status: 'done', priority: 'high' },
    { title: 'Onboarding progress not persisted on refresh', type: 'bug', status: 'blocked', priority: 'high' },
    { title: 'Support playbook for pilot accounts', type: 'task', status: 'backlog', priority: 'low' },
    { title: 'Spike: localisation approach for checklists', type: 'spike', status: 'backlog', priority: 'medium' },
    { title: 'Activation dashboard for the growth team', type: 'story', status: 'todo', priority: 'medium' },
  ],
  'p-canvas': [
    { title: 'Define the token contract and naming scheme', type: 'story', status: 'in_progress', priority: 'high' },
    { title: 'Dark-mode parity audit across components', type: 'task', status: 'todo', priority: 'high' },
    { title: 'Visual regression snapshots in both themes', type: 'task', status: 'done', priority: 'high' },
    { title: 'Document accessibility contract per component', type: 'task', status: 'todo', priority: 'medium' },
    { title: 'Migrate badge and chip to v3 tokens', type: 'improvement', status: 'backlog', priority: 'medium' },
    { title: 'Spike: component docs generation', type: 'spike', status: 'todo', priority: 'low' },
    { title: 'Focus ring inconsistent on icon buttons', type: 'bug', status: 'backlog', priority: 'medium' },
    { title: 'Elevation ramp reduced to five levels', type: 'improvement', status: 'in_review', priority: 'low' },
  ],
  'p-relay': [
    { title: 'Webhook delivery with retry and backoff', type: 'story', status: 'in_progress', priority: 'high' },
    { title: 'Versioned REST surface for tasks', type: 'story', status: 'todo', priority: 'medium' },
    { title: 'Calendar connector OAuth flow', type: 'story', status: 'backlog', priority: 'medium' },
    { title: 'Chat connector message formatting', type: 'story', status: 'backlog', priority: 'low' },
    { title: 'Signature verification for outbound payloads', type: 'task', status: 'done', priority: 'high' },
    { title: 'Rate limiting per integration key', type: 'improvement', status: 'blocked', priority: 'medium' },
    { title: 'Connector contract review notes', type: 'task', status: 'done', priority: 'low' },
  ],
  'p-pulse': [
    { title: 'Approvals list with swipe actions', type: 'story', status: 'done', priority: 'high' },
    { title: 'Standup update composer', type: 'story', status: 'done', priority: 'medium' },
    { title: 'Notification triage grouping', type: 'story', status: 'done', priority: 'medium' },
    { title: 'Crash on cold start without network', type: 'bug', status: 'done', priority: 'critical' },
    { title: 'Post-launch adoption review', type: 'task', status: 'done', priority: 'low' },
  ],
};

const epicTitles: Record<string, string> = {
  'p-atlas': 'Unified task surface',
  'p-orbit': 'Funnel and retention exploration',
  'p-forge': 'Permissions service rewrite',
  'p-beacon': 'Role-aware onboarding checklists',
  'p-canvas': 'Token pipeline and theming contract',
  'p-relay': 'Public API and webhooks',
  'p-pulse': 'Mobile companion v1',
};

const commentBodies = [
  'Pulled this into the current sprint — the dependency landed this morning.',
  'Left notes on the spec. The second edge case needs a product decision before we build.',
  'Reproduced on staging with a 1200-row board. Profiling points at the layout pass, not the data fetch.',
  'Design review done. One change: the empty state should keep the filter chips visible.',
  'Blocked until the shadow diff is clean. I would not cut over before then.',
  'Scoped this down to the happy path so we can ship in this release and follow up next sprint.',
  'Agreed on the approach. Please add the accessible summary before you open a PR.',
  'This duplicates earlier work in the list view. Reusing that hook instead of a new one.',
  'QA found two regressions in dark mode. Details in the linked run.',
  'Moving to next sprint — capacity is already over with the drill prep.',
];

const attachmentNames = [
  ['spec-v3.pdf', 'application/pdf', 284_104],
  ['board-profiling.png', 'image/png', 1_042_880],
  ['query-plan.txt', 'text/plain', 8_214],
  ['design-review.fig', 'application/octet-stream', 4_209_152],
  ['load-test-results.csv', 'text/csv', 61_440],
  ['failover-drill-notes.md', 'text/markdown', 12_288],
];

const checklistTemplates: string[][] = [
  ['Write the spec', 'Design review', 'Implement', 'Unit tests', 'Accessibility pass'],
  ['Reproduce', 'Root cause', 'Fix', 'Add regression test'],
  ['Draft approach', 'Review with team', 'Implement behind flag', 'Enable for internal'],
  ['Collect requirements', 'Prototype', 'Validate with users'],
];

function checklistFor(index: number): ChecklistItem[] {
  if (!chance(0.62)) return [];
  const template = checklistTemplates[index % checklistTemplates.length]!;
  const doneCount = Math.floor(rand() * (template.length + 1));
  return template.map((label, i) => ({ id: `cl-${index}-${i}`, label, done: i < doneCount }));
}

const tasks: Task[] = [];
const subtasks: Subtask[] = [];
const comments: Comment[] = [];
const attachments: Attachment[] = [];

const epicIdByProject: Record<string, string> = {};
let counter = 0;

/* Epics first so stories can point at them. */
for (const project of projects) {
  counter += 1;
  const epicId = `tk-${counter}`;
  epicIdByProject[project.id] = epicId;
  const seedCount = seedsByProject[project.id]?.length ?? 0;
  tasks.push({
    id: epicId,
    key: `${project.key}-1`,
    title: epicTitles[project.id] ?? `${project.name} delivery`,
    description: `Epic tracking the ${epicTitles[project.id] ?? project.name} workstream. Child items carry the detailed acceptance criteria.`,
    type: 'epic',
    status: project.status === 'completed' ? 'done' : 'in_progress',
    priority: project.priority,
    projectId: project.id,
    reporterId: project.productOwnerId,
    assigneeId: project.productOwnerId,
    labelIds: [],
    storyPoints: undefined,
    startDate: project.startDate,
    dueDate: project.targetReleaseDate,
    createdAt: `${project.startDate}T09:00:00.000Z`,
    updatedAt: `${daysAgo(2)}T11:30:00.000Z`,
    checklist: [],
    dependencies: [],
    customFields: { 'cf-target-segment': 'Enterprise' },
    rank: 0,
  });
  // Keep epic progress loosely tied to how much work the project carries.
  void seedCount;
}

let keyIndexByProject: Record<string, number> = {};
for (const project of projects) keyIndexByProject[project.id] = 1;

for (const project of projects) {
  const seeds = seedsByProject[project.id] ?? [];
  const projectSprints = sprints.filter((s) => s.projectId === project.id);
  const projectReleases = releases.filter((r) => r.projectId === project.id);
  const memberIds = project.memberIds;

  seeds.forEach((seed, index) => {
    counter += 1;
    keyIndexByProject[project.id] = (keyIndexByProject[project.id] ?? 1) + 1;
    const id = `tk-${counter}`;
    const isDone = seed.status === 'done';
    const isBlocked = seed.status === 'blocked';
    const createdOffset = 20 + Math.floor(rand() * 90);
    const assigneeId = chance(0.9) ? pick(memberIds) : undefined;

    // Overdue work only makes sense for items that are not finished.
    const dueOffset = isDone
      ? -(2 + Math.floor(rand() * 25))
      : chance(0.22)
        ? -(1 + Math.floor(rand() * 9))
        : 1 + Math.floor(rand() * 45);

    const activeSprint = projectSprints.find((s) => s.status === 'active');
    const sprintId = isDone
      ? projectSprints.filter((s) => s.status === 'completed').at(-1)?.id
      : seed.status === 'backlog'
        ? undefined
        : chance(0.78)
          ? (activeSprint?.id ?? projectSprints.at(-1)?.id)
          : projectSprints.find((s) => s.status === 'planned')?.id;

    const task: Task = {
      id,
      key: `${project.key}-${keyIndexByProject[project.id]}`,
      title: seed.title,
      description: `**Context**\n\n${seed.title} came out of the ${project.productArea} review. The current behaviour does not meet the agreed bar for the ${project.name} release.\n\n**Acceptance criteria**\n\n- Behaviour matches the spec for the primary path\n- Keyboard and screen-reader parity verified\n- Telemetry event emitted on completion\n- No regression in the existing suite`,
      type: seed.type,
      status: seed.status,
      priority: seed.priority,
      projectId: project.id,
      sprintId,
      releaseId: chance(0.7) ? projectReleases.find((r) => r.status !== 'released')?.id ?? projectReleases[0]?.id : undefined,
      epicId: seed.type === 'epic' ? undefined : epicIdByProject[project.id],
      assigneeId,
      reporterId: pick(memberIds),
      labelIds: pickMany(labels, 3).map((l) => l.id),
      storyPoints: seed.type === 'spike' || chance(0.86) ? pick([1, 2, 3, 5, 8, 13]) : undefined,
      dueDate: daysFromToday(dueOffset),
      startDate: daysAgo(createdOffset - 4),
      createdAt: `${daysAgo(createdOffset)}T08:${String(10 + (index % 45)).padStart(2, '0')}:00.000Z`,
      updatedAt: `${daysAgo(Math.max(0, Math.floor(rand() * 9)))}T14:05:00.000Z`,
      completedAt: isDone ? `${daysFromToday(dueOffset)}T16:20:00.000Z` : undefined,
      blockedReason: isBlocked
        ? pick([
            'Waiting on the upstream dependency to land.',
            'Needs a product decision on the edge-case behaviour.',
            'Blocked by an open platform incident.',
            'Awaiting security review sign-off.',
          ])
        : undefined,
      checklist: checklistFor(counter),
      dependencies: [],
      customFields:
        seed.type === 'bug'
          ? { 'cf-impact': pick(['Blocker', 'Major', 'Moderate', 'Minor']), 'cf-effort': pick([1, 2, 3, 5]) }
          : { 'cf-needs-design': chance(0.4), 'cf-effort': pick([1, 2, 3, 5, 8]) },
      rank: index * 100,
    };

    tasks.push(task);

    /* Subtasks */
    if (chance(0.45)) {
      const count = 1 + Math.floor(rand() * 3);
      for (let i = 0; i < count; i += 1) {
        subtasks.push({
          id: `st-${id}-${i}`,
          taskId: id,
          title: pick([
            'Write the unit tests',
            'Update the API contract',
            'Add telemetry event',
            'Document the behaviour',
            'Verify on tablet breakpoint',
            'Review with design',
          ]),
          status: isDone ? 'done' : pick(['todo', 'in_progress', 'done'] as const),
          assigneeId: chance(0.8) ? pick(memberIds) : undefined,
        });
      }
    }

    /* Comments */
    const commentCount = Math.floor(rand() * 4);
    for (let i = 0; i < commentCount; i += 1) {
      const author = pick(memberIds);
      comments.push({
        id: `cm-${id}-${i}`,
        taskId: id,
        authorId: author,
        body: pick(commentBodies),
        createdAt: `${daysAgo(1 + Math.floor(rand() * 20))}T${String(9 + i).padStart(2, '0')}:24:00.000Z`,
        mentionedUserIds: chance(0.3) ? [pick(memberIds.filter((m) => m !== author)) ?? author] : [],
      });
    }

    /* Attachments */
    if (chance(0.3)) {
      const [fileName, mimeType, sizeBytes] = pick(attachmentNames) as [string, string, number];
      attachments.push({
        id: `at-${id}`,
        taskId: id,
        fileName,
        mimeType,
        sizeBytes,
        uploadedById: pick(memberIds),
        uploadedAt: `${daysAgo(2 + Math.floor(rand() * 18))}T10:12:00.000Z`,
      });
    }
  });
}

/* Dependencies: wire a handful of realistic blocks/blocked_by pairs. */
const blockedTasks = tasks.filter((t) => t.status === 'blocked');
for (const blocked of blockedTasks) {
  const candidates = tasks.filter(
    (t) => t.projectId === blocked.projectId && t.id !== blocked.id && t.status !== 'blocked',
  );
  if (candidates.length === 0) continue;
  const blocker = pick(candidates);
  const dep: TaskDependency = { id: `dep-${blocked.id}`, kind: 'blocked_by', targetTaskId: blocker.id };
  blocked.dependencies.push(dep);
  blocker.dependencies.push({ id: `dep-${blocker.id}-${blocked.id}`, kind: 'blocks', targetTaskId: blocked.id });
}
for (const task of tasks.filter((_, i) => i % 11 === 0).slice(0, 12)) {
  const candidates = tasks.filter((t) => t.projectId === task.projectId && t.id !== task.id);
  if (candidates.length === 0) continue;
  task.dependencies.push({ id: `dep-rel-${task.id}`, kind: 'relates_to', targetTaskId: pick(candidates).id });
}

/* Defensive: every reporter/assignee must resolve to a real user. */
const userIds = new Set(users.map((u) => u.id));
for (const task of tasks) {
  if (!userIds.has(task.reporterId)) task.reporterId = users[0]!.id;
  if (task.assigneeId && !userIds.has(task.assigneeId)) task.assigneeId = undefined;
}

export const mockTasks: Task[] = tasks;
export const mockSubtasks: Subtask[] = subtasks;
export const mockComments: Comment[] = comments;
export const mockAttachments: Attachment[] = attachments;

export const ALL_TASK_STATUSES = TASK_STATUSES;
export const ALL_TASK_TYPES = TASK_TYPES;
export const ALL_PRIORITIES = PRIORITIES;

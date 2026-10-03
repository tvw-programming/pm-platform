import type {
  Activity,
  Attachment,
  Comment,
  DocumentRecord,
  ID,
  Label,
  Milestone,
  Notification,
  Priority,
  Project,
  Release,
  Risk,
  RoadmapItem,
  Sprint,
  Subtask,
  Task,
  TaskStatus,
  TaskType,
  Team,
  User,
  Workspace,
  CustomFieldDefinition,
} from '@/types/domain';
import {
  activities as seedActivities,
  customFieldDefinitions as seedCustomFields,
  documents as seedDocuments,
  labels as seedLabels,
  milestones as seedMilestones,
  mockAttachments,
  mockComments,
  mockSubtasks,
  mockTasks,
  notifications as seedNotifications,
  projects as seedProjects,
  releases as seedReleases,
  risks as seedRisks,
  roadmapItems as seedRoadmapItems,
  sprints as seedSprints,
  teams as seedTeams,
  users as seedUsers,
  workspaces as seedWorkspaces,
  CURRENT_USER_ID,
  DEFAULT_WORKSPACE_ID,
} from '@/mock-data';

export interface NewTaskInput {
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  projectId: ID;
  assigneeId?: ID;
  sprintId?: ID;
  storyPoints?: number;
  dueDate?: string;
  labelIds: ID[];
}

export interface NewSprintInput {
  name: string;
  goal: string;
  projectId: ID;
  teamId: ID;
  startDate: string;
  endDate: string;
  capacityPoints: number;
}

export interface NewRoadmapItemInput {
  title: string;
  description: string;
  kind: RoadmapItem['kind'];
  projectId: ID;
  productArea: string;
  teamId: ID;
  ownerId: ID;
  startDate: string;
  endDate: string;
  priority: Priority;
}

export interface NewProjectInput {
  name: string;
  key: string;
  description: string;
  productOwnerId: ID;
  priority: Priority;
  targetReleaseDate: string;
  productArea: string;
  teamIds: ID[];
}

export interface WorkspaceState {
  currentUserId: ID;
  activeWorkspaceId: ID;
  workspaces: Workspace[];
  users: User[];
  teams: Team[];
  projects: Project[];
  tasks: Task[];
  subtasks: Subtask[];
  comments: Comment[];
  attachments: Attachment[];
  labels: Label[];
  customFields: CustomFieldDefinition[];
  sprints: Sprint[];
  releases: Release[];
  milestones: Milestone[];
  roadmapItems: RoadmapItem[];
  risks: Risk[];
  activities: Activity[];
  notifications: Notification[];
  documents: DocumentRecord[];
  /** Columns are state so "add column" can extend the board. */
  boardColumns: TaskStatus[];
  archivedTaskIds: ID[];
}

export type WorkspaceAction =
  | { type: 'workspace/switch'; workspaceId: ID }
  | { type: 'task/create'; input: NewTaskInput }
  | { type: 'task/upsertMany'; tasks: Task[] }
  | { type: 'task/update'; taskId: ID; patch: Partial<Task> }
  | { type: 'task/setStatus'; taskId: ID; status: TaskStatus; rank?: number }
  | { type: 'task/reorder'; taskId: ID; status: TaskStatus; rank: number }
  | { type: 'task/assignSprint'; taskId: ID; sprintId?: ID }
  | { type: 'task/duplicate'; taskId: ID }
  | { type: 'task/archive'; taskId: ID }
  | { type: 'task/restore'; taskId: ID }
  | { type: 'task/delete'; taskId: ID }
  | { type: 'task/toggleChecklistItem'; taskId: ID; itemId: ID }
  | { type: 'task/addChecklistItem'; taskId: ID; label: string }
  | { type: 'task/addDependency'; taskId: ID; targetTaskId: ID; kind: 'blocks' | 'blocked_by' | 'relates_to' }
  | { type: 'task/removeDependency'; taskId: ID; dependencyId: ID }
  | { type: 'task/addComment'; taskId: ID; body: string; mentionedUserIds: ID[] }
  | { type: 'task/addSubtask'; taskId: ID; title: string }
  | { type: 'task/toggleSubtask'; subtaskId: ID }
  | { type: 'task/schedule'; taskId: ID; dueDate: string }
  | { type: 'board/addColumn'; status: TaskStatus }
  | { type: 'sprint/create'; input: NewSprintInput }
  | { type: 'sprint/update'; sprintId: ID; patch: Partial<Sprint> }
  | { type: 'project/create'; input: NewProjectInput }
  | { type: 'roadmap/create'; input: NewRoadmapItemInput }
  | { type: 'roadmap/update'; itemId: ID; patch: Partial<RoadmapItem> }
  | { type: 'release/toggleReadiness'; releaseId: ID; checkId: ID }
  | { type: 'release/update'; releaseId: ID; patch: Partial<Release> }
  | { type: 'notification/markRead'; id: ID }
  | { type: 'notification/markAllRead' }
  | { type: 'state/replace'; state: WorkspaceState };

export const initialWorkspaceState: WorkspaceState = {
  currentUserId: CURRENT_USER_ID,
  activeWorkspaceId: DEFAULT_WORKSPACE_ID,
  workspaces: seedWorkspaces,
  users: seedUsers,
  teams: seedTeams,
  projects: seedProjects,
  tasks: mockTasks,
  subtasks: mockSubtasks,
  comments: mockComments,
  attachments: mockAttachments,
  labels: seedLabels,
  customFields: seedCustomFields,
  sprints: seedSprints,
  releases: seedReleases,
  milestones: seedMilestones,
  roadmapItems: seedRoadmapItems,
  risks: seedRisks,
  activities: seedActivities,
  notifications: seedNotifications,
  documents: seedDocuments,
  boardColumns: ['backlog', 'todo', 'in_progress', 'in_review', 'blocked', 'done'],
  archivedTaskIds: [],
};

let sequence = 1000;
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function nextKeyFor(state: WorkspaceState, projectId: ID): string {
  const project = state.projects.find((p) => p.id === projectId);
  const prefix = project?.key ?? 'TSK';
  const highest = state.tasks
    .filter((t) => t.projectId === projectId)
    .reduce((max, task) => {
      const parsed = Number.parseInt(task.key.split('-')[1] ?? '0', 10);
      return Number.isNaN(parsed) ? max : Math.max(max, parsed);
    }, 0);
  return `${prefix}-${highest + 1}`;
}

function logActivity(state: WorkspaceState, activity: Omit<Activity, 'id' | 'createdAt'>): Activity[] {
  const entry: Activity = { ...activity, id: nextId('ac'), createdAt: nowIso() };
  return [entry, ...state.activities].slice(0, 400);
}

function patchTask(state: WorkspaceState, taskId: ID, patch: Partial<Task>): Task[] {
  return state.tasks.map((task) => (task.id === taskId ? { ...task, ...patch, updatedAt: nowIso() } : task));
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'state/replace':
      return action.state;

    case 'workspace/switch':
      return { ...state, activeWorkspaceId: action.workspaceId };

    case 'task/upsertMany': {
      const incoming = action.tasks;
      const byId = new Map(state.tasks.map((t) => [t.id, t]));
      for (const t of incoming) {
        byId.set(t.id, { ...byId.get(t.id), ...t, updatedAt: nowIso() });
      }
      return {
        ...state,
        tasks: Array.from(byId.values()),
        activities: logActivity(state, {
          kind: 'created',
          actorId: state.currentUserId,
          projectId: incoming[0]?.projectId ?? state.projects[0]?.id ?? '',
          entityType: 'task',
          entityId: incoming[0]?.id ?? '',
          entityLabel: incoming[0]?.key ?? 'plan',
          summary: `Imported ${incoming.length} agent-planned tasks`,
        }),
      };
    }

    case 'task/create': {
      const { input } = action;
      const task: Task = {
        id: nextId('tk'),
        key: nextKeyFor(state, input.projectId),
        title: input.title,
        description: input.description,
        type: input.type,
        status: input.status,
        priority: input.priority,
        projectId: input.projectId,
        sprintId: input.sprintId,
        assigneeId: input.assigneeId,
        assigneeKind: 'human',
        reporterId: state.currentUserId,
        labelIds: input.labelIds,
        storyPoints: input.storyPoints,
        dueDate: input.dueDate,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        checklist: [],
        dependencies: [],
        customFields: {},
        rank: -Date.now(),
      };
      return {
        ...state,
        tasks: [task, ...state.tasks],
        activities: logActivity(state, {
          kind: 'created',
          actorId: state.currentUserId,
          projectId: task.projectId,
          entityType: 'task',
          entityId: task.id,
          entityLabel: task.key,
          summary: `created ${task.key}`,
        }),
      };
    }

    case 'task/update':
      return { ...state, tasks: patchTask(state, action.taskId, action.patch) };

    case 'task/setStatus': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      const patch: Partial<Task> = {
        status: action.status,
        completedAt: action.status === 'done' ? nowIso() : undefined,
        blockedReason: action.status === 'blocked' ? (task.blockedReason ?? 'Moved to blocked on the board.') : undefined,
      };
      if (action.rank !== undefined) patch.rank = action.rank;
      return {
        ...state,
        tasks: patchTask(state, action.taskId, patch),
        activities: logActivity(state, {
          kind: 'status_changed',
          actorId: state.currentUserId,
          projectId: task.projectId,
          entityType: 'task',
          entityId: task.id,
          entityLabel: task.key,
          summary: `moved ${task.key} to ${action.status.replace('_', ' ')}`,
        }),
      };
    }

    case 'task/reorder':
      return { ...state, tasks: patchTask(state, action.taskId, { status: action.status, rank: action.rank }) };

    case 'task/assignSprint': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      return {
        ...state,
        tasks: patchTask(state, action.taskId, {
          sprintId: action.sprintId,
          status: action.sprintId && task.status === 'backlog' ? 'todo' : task.status,
        }),
        activities: logActivity(state, {
          kind: 'moved',
          actorId: state.currentUserId,
          projectId: task.projectId,
          entityType: 'task',
          entityId: task.id,
          entityLabel: task.key,
          summary: action.sprintId
            ? `moved ${task.key} into ${state.sprints.find((s) => s.id === action.sprintId)?.name ?? 'a sprint'}`
            : `moved ${task.key} back to the backlog`,
        }),
      };
    }

    case 'task/duplicate': {
      const source = state.tasks.find((t) => t.id === action.taskId);
      if (!source) return state;
      const copy: Task = {
        ...source,
        id: nextId('tk'),
        key: nextKeyFor(state, source.projectId),
        title: `${source.title} (copy)`,
        status: 'backlog',
        createdAt: nowIso(),
        updatedAt: nowIso(),
        completedAt: undefined,
        dependencies: [],
        rank: -Date.now(),
      };
      return { ...state, tasks: [copy, ...state.tasks] };
    }

    case 'task/archive':
      return { ...state, archivedTaskIds: [...state.archivedTaskIds, action.taskId] };

    case 'task/restore':
      return { ...state, archivedTaskIds: state.archivedTaskIds.filter((id) => id !== action.taskId) };

    case 'task/delete':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.taskId),
        subtasks: state.subtasks.filter((s) => s.taskId !== action.taskId),
        comments: state.comments.filter((c) => c.taskId !== action.taskId),
        attachments: state.attachments.filter((a) => a.taskId !== action.taskId),
        archivedTaskIds: state.archivedTaskIds.filter((id) => id !== action.taskId),
      };

    case 'task/toggleChecklistItem':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? {
                ...task,
                updatedAt: nowIso(),
                checklist: task.checklist.map((item) =>
                  item.id === action.itemId ? { ...item, done: !item.done } : item,
                ),
              }
            : task,
        ),
      };

    case 'task/addChecklistItem':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? {
                ...task,
                updatedAt: nowIso(),
                checklist: [...task.checklist, { id: nextId('cl'), label: action.label, done: false }],
              }
            : task,
        ),
      };

    case 'task/addDependency':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? {
                ...task,
                updatedAt: nowIso(),
                dependencies: [
                  ...task.dependencies,
                  { id: nextId('dep'), kind: action.kind, targetTaskId: action.targetTaskId },
                ],
              }
            : task,
        ),
      };

    case 'task/removeDependency':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? { ...task, dependencies: task.dependencies.filter((d) => d.id !== action.dependencyId) }
            : task,
        ),
      };

    case 'task/addComment': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      const comment: Comment = {
        id: nextId('cm'),
        taskId: action.taskId,
        authorId: state.currentUserId,
        body: action.body,
        createdAt: nowIso(),
        mentionedUserIds: action.mentionedUserIds,
      };
      return {
        ...state,
        comments: [...state.comments, comment],
        activities: logActivity(state, {
          kind: 'commented',
          actorId: state.currentUserId,
          projectId: task.projectId,
          entityType: 'task',
          entityId: task.id,
          entityLabel: task.key,
          summary: `commented on ${task.key}`,
        }),
      };
    }

    case 'task/addSubtask':
      return {
        ...state,
        subtasks: [
          ...state.subtasks,
          { id: nextId('st'), taskId: action.taskId, title: action.title, status: 'todo' },
        ],
      };

    case 'task/toggleSubtask':
      return {
        ...state,
        subtasks: state.subtasks.map((subtask) =>
          subtask.id === action.subtaskId
            ? { ...subtask, status: subtask.status === 'done' ? 'todo' : 'done' }
            : subtask,
        ),
      };

    case 'task/schedule':
      return { ...state, tasks: patchTask(state, action.taskId, { dueDate: action.dueDate }) };

    case 'board/addColumn':
      return state.boardColumns.includes(action.status)
        ? state
        : { ...state, boardColumns: [...state.boardColumns, action.status] };

    case 'sprint/create': {
      const sprint: Sprint = {
        id: nextId('s'),
        ...action.input,
        status: 'planned',
        committedPoints: 0,
        completedPoints: 0,
      };
      return {
        ...state,
        sprints: [...state.sprints, sprint],
        activities: logActivity(state, {
          kind: 'sprint_started',
          actorId: state.currentUserId,
          projectId: sprint.projectId,
          entityType: 'sprint',
          entityId: sprint.id,
          entityLabel: sprint.name,
          summary: `planned ${sprint.name}`,
        }),
      };
    }

    case 'sprint/update':
      return {
        ...state,
        sprints: state.sprints.map((sprint) =>
          sprint.id === action.sprintId ? { ...sprint, ...action.patch } : sprint,
        ),
      };

    case 'project/create': {
      const project: Project = {
        id: nextId('p'),
        key: action.input.key.toUpperCase(),
        name: action.input.name,
        description: action.input.description,
        status: 'planning',
        health: 'on_track',
        priority: action.input.priority,
        productOwnerId: action.input.productOwnerId,
        teamIds: action.input.teamIds,
        memberIds: Array.from(
          new Set([
            action.input.productOwnerId,
            ...state.teams.filter((t) => action.input.teamIds.includes(t.id)).flatMap((t) => t.memberIds),
          ]),
        ),
        startDate: nowIso().slice(0, 10),
        targetReleaseDate: action.input.targetReleaseDate,
        progress: 0,
        color: '#0E8F86',
        productArea: action.input.productArea,
        workspaceId: state.activeWorkspaceId,
      };
      return {
        ...state,
        projects: [...state.projects, project],
        activities: logActivity(state, {
          kind: 'created',
          actorId: state.currentUserId,
          projectId: project.id,
          entityType: 'project',
          entityId: project.id,
          entityLabel: project.name,
          summary: `created project ${project.name}`,
        }),
      };
    }

    case 'roadmap/create': {
      const item: RoadmapItem = {
        id: nextId('rm'),
        ...action.input,
        progress: 0,
        health: 'on_track',
        dependsOnIds: [],
      };
      return {
        ...state,
        roadmapItems: [...state.roadmapItems, item],
        activities: logActivity(state, {
          kind: 'created',
          actorId: state.currentUserId,
          projectId: item.projectId,
          entityType: 'roadmap_item',
          entityId: item.id,
          entityLabel: item.title,
          summary: `added ${item.title} to the roadmap`,
        }),
      };
    }

    case 'roadmap/update':
      return {
        ...state,
        roadmapItems: state.roadmapItems.map((item) =>
          item.id === action.itemId ? { ...item, ...action.patch } : item,
        ),
      };

    case 'release/toggleReadiness':
      return {
        ...state,
        releases: state.releases.map((release) =>
          release.id === action.releaseId
            ? {
                ...release,
                readiness: release.readiness.map((check) =>
                  check.id === action.checkId ? { ...check, done: !check.done } : check,
                ),
              }
            : release,
        ),
      };

    case 'release/update':
      return {
        ...state,
        releases: state.releases.map((release) =>
          release.id === action.releaseId ? { ...release, ...action.patch } : release,
        ),
      };

    case 'notification/markRead':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      };

    case 'notification/markAllRead':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };

    default:
      return state;
  }
}

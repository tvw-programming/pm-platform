# Domain Types Reference

## Core Types (`src/types/domain.ts`)

### Enums

```ts
TASK_STATUSES   = ['backlog','todo','in_progress','in_review','blocked','done']
TASK_TYPES      = ['story','bug','task','improvement','epic','spike']
PRIORITIES      = ['critical','high','medium','low']
PROJECT_STATUSES = ['planning','active','on_hold','completed','archived']
SPRINT_STATUSES = ['planned','active','completed']
RELEASE_STATUSES = ['planned','in_development','in_testing','released','cancelled']
DEPLOYMENT_STATUSES = ['not_started','staging','canary','production','rolled_back']
ROADMAP_ITEM_KINDS = ['initiative','epic','feature','milestone','release']
WORKSPACE_ROLES = ['owner','admin','member','viewer']
AVAILABILITY    = ['available','busy','on_leave','overloaded']
```

### User

```ts
interface User {
  id: ID;
  name: string;
  email: string;
  avatarColor: string;        // hex for avatar background
  initials: string;           // 2-char fallback
  jobTitle: string;
  department: string;
  role: WorkspaceRole;
  teamIds: ID[];
  skills: string[];
  availability: Availability;
  capacityHoursPerWeek: number;
  allocatedHoursPerWeek: number;
  location: string;
}
```

### Task

```ts
interface Task {
  id: ID;
  key: string;                // e.g. "CGEN-42"
  title: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  projectId: ID;
  sprintId?: ID;
  releaseId?: ID;
  assigneeId?: ID;
  reporterId: ID;
  labelIds: ID[];
  estimate?: number;          // story points
  timeSpentMinutes: number;
  description?: string;
  acceptanceCriteria?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
  dueDate?: ISODate;
  subtasks: Subtask[];
  comments: Comment[];
  attachments: Attachment[];
  dependencies: TaskDependency[];
  checklist: ChecklistItem[];
}
```

### Sprint

```ts
interface Sprint {
  id: ID;
  projectId: ID;
  name: string;
  status: SprintStatus;
  startDate: ISODate;
  endDate: ISODate;
  goal?: string;
  committedPoints: number;
  completedPoints: number;
  velocity: number;
}
```

### Release

```ts
interface Release {
  id: ID;
  projectId: ID;
  version: string;            // e.g. "v2.4.0"
  name: string;
  status: ReleaseStatus;
  health: HealthLevel;
  targetDate: ISODate;
  actualDate?: ISODate;
  deploymentStage: DeploymentStatus;
  taskIds: ID[];
  risks: RiskItem[];
  changeLog: string;
}
```

---

## Chat Types (`src/types/chat.ts`)

```ts
type ChatMode = 'normal' | 'work_event';
type TicketKind = 'approve_reject' | 'review' | 'ack' | 'action_done';
type TicketStatus = 'pending' | 'approved' | 'rejected' | 'acknowledged' | 'done' | 'skipped';
type SkipReason = 'SKIPPED_ROLE_ABSENT' | '';

interface ChatMessage {
  id: string;
  run_id: string;
  author_id: string;
  author_name: string;
  author_roles: string[];
  mode: ChatMode;
  event_type?: string;
  playbook_id?: string;
  template_id?: string;
  body: string;
  artifact_refs: string[];
  created_at: string;
}

interface ChatTicket {
  id: string;
  run_id: string;
  playbook_instance_id: string;
  role_id: string;
  user_id: string;
  kind: TicketKind;
  status: TicketStatus;
  skipped_reason: SkipReason;
  parent_message_id: string;
  comment: string;
  due_by?: string;
  resolved_at?: string;
}

interface RosterEntry {
  id: string;
  run_id: string;
  role_id: string;
  user_id: string;
  user_name: string;
  present: boolean;
  // enriched server-side:
  role_label?: string;
  track?: string;
  seniority?: string;
}

interface RoleDef {
  id: string;
  label: string;
  seniority: string;
  track: string;
  optional: boolean;
  default_fallback: string[];
}
```

---

## Workspace State Shape

```ts
interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  products: Product[];
  activeProductId: string;
  projects: Project[];
  tasks: Task[];
  sprints: Sprint[];
  releases: Release[];
  teams: Team[];
  users: User[];
  labels: Label[];
  customFields: CustomField[];
  boardColumns: TaskStatus[];
  roadmapItems: RoadmapItem[];
  calendarEvents: CalendarEvent[];
  activities: ActivityEvent[];
  detailDrawer: { open: boolean; taskId: string | null };
}
```

All transitions are in `src/state/workspaceReducer.ts`.

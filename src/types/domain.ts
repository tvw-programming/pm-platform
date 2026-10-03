/**
 * Core domain models for CGen.
 * All identifiers are branded-ish string aliases to keep call sites readable
 * while remaining structurally simple for mock data.
 */

export type ID = string;
export type ISODate = string;

/* ------------------------------------------------------------------ enums */

export const TASK_STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'blocked',
  'done',
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_TYPES = ['story', 'bug', 'task', 'improvement', 'epic', 'spike'] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const HEALTH_LEVELS = ['on_track', 'at_risk', 'off_track'] as const;
export type HealthLevel = (typeof HEALTH_LEVELS)[number];

export const SPRINT_STATUSES = ['planned', 'active', 'completed'] as const;
export type SprintStatus = (typeof SPRINT_STATUSES)[number];

export const RELEASE_STATUSES = ['planned', 'in_development', 'in_testing', 'released', 'cancelled'] as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

export const DEPLOYMENT_STATUSES = ['not_started', 'staging', 'canary', 'production', 'rolled_back'] as const;
export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

export const ROADMAP_ITEM_KINDS = ['initiative', 'epic', 'feature', 'milestone', 'release'] as const;
export type RoadmapItemKind = (typeof ROADMAP_ITEM_KINDS)[number];

export const RISK_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type RiskSeverity = (typeof RISK_SEVERITIES)[number];

export const RISK_STATUSES = ['open', 'mitigating', 'resolved', 'accepted'] as const;
export type RiskStatus = (typeof RISK_STATUSES)[number];

export const AVAILABILITY = ['available', 'busy', 'on_leave', 'overloaded'] as const;
export type Availability = (typeof AVAILABILITY)[number];

export const WORKSPACE_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const CALENDAR_EVENT_KINDS = ['task', 'milestone', 'release', 'sprint'] as const;
export type CalendarEventKind = (typeof CALENDAR_EVENT_KINDS)[number];

export const DEPENDENCY_KINDS = ['blocks', 'blocked_by', 'relates_to'] as const;
export type DependencyKind = (typeof DEPENDENCY_KINDS)[number];

/* ----------------------------------------------------------------- people */

export interface User {
  id: ID;
  name: string;
  email: string;
  avatarColor: string;
  initials: string;
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

export interface Team {
  id: ID;
  name: string;
  key: string;
  description: string;
  leadId: ID;
  memberIds: ID[];
  department: string;
  color: string;
}

/* --------------------------------------------------------------- taxonomy */

export interface Label {
  id: ID;
  name: string;
  color: string;
}

export interface CustomFieldDefinition {
  id: ID;
  name: string;
  kind: 'text' | 'number' | 'select' | 'date' | 'boolean';
  options?: string[];
  appliesTo: TaskType[];
}

export type CustomFieldValue = string | number | boolean | null;

/* --------------------------------------------------------------- projects */

export interface Risk {
  id: ID;
  title: string;
  description: string;
  severity: RiskSeverity;
  status: RiskStatus;
  ownerId: ID;
  projectId: ID;
  releaseId?: ID;
  identifiedOn: ISODate;
  mitigation: string;
}

export interface ProjectAgentConfig {
  repoUrl?: string;
  primaryCwd?: string;
  softTokenBudget?: number;
  hardTokenBudget?: number;
  tokensUsed?: number;
  budgetPaused?: boolean;
}

export interface Project {
  id: ID;
  key: string;
  name: string;
  description: string;
  status: ProjectStatus;
  health: HealthLevel;
  priority: Priority;
  productOwnerId: ID;
  teamIds: ID[];
  memberIds: ID[];
  startDate: ISODate;
  targetReleaseDate: ISODate;
  progress: number;
  color: string;
  productArea: string;
  workspaceId: ID;
  agentConfig?: ProjectAgentConfig;
}

export interface Workspace {
  id: ID;
  name: string;
  slug: string;
  plan: 'starter' | 'growth' | 'enterprise';
  color: string;
}

/* ------------------------------------------------------------------ tasks */

export interface ChecklistItem {
  id: ID;
  label: string;
  done: boolean;
}

export interface Subtask {
  id: ID;
  taskId: ID;
  title: string;
  status: TaskStatus;
  assigneeId?: ID;
}

export interface Comment {
  id: ID;
  taskId: ID;
  authorId: ID;
  body: string;
  createdAt: ISODate;
  mentionedUserIds: ID[];
}

export interface Attachment {
  id: ID;
  taskId: ID;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  uploadedById: ID;
  uploadedAt: ISODate;
}

export interface TaskDependency {
  id: ID;
  kind: DependencyKind;
  targetTaskId: ID;
}

export type AssigneeKind = 'human' | 'agent';

export interface TaskExecutionPolicy {
  mode: 'normal' | 'strict';
  commentRequired: boolean;
  maxReviewRounds: number;
  reviewRoundsUsed?: number;
  status?: 'idle' | 'in_review' | 'awaiting_approval' | 'escalated' | 'cleared';
}

export interface Task {
  id: ID;
  key: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  projectId: ID;
  sprintId?: ID;
  releaseId?: ID;
  epicId?: ID;
  parentId?: ID;
  /** Polymorphic assignee: human user id when assigneeKind=human (default). */
  assigneeId?: ID;
  assigneeKind?: AssigneeKind;
  /** Set when assigneeKind === 'agent' — references AgentInstance.id */
  assigneeAgentId?: ID;
  assigneeAgentName?: string;
  assigneeRoleId?: string;
  reporterId: ID;
  labelIds: ID[];
  storyPoints?: number;
  dueDate?: ISODate;
  startDate?: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
  completedAt?: ISODate;
  blockedReason?: string;
  checklist: ChecklistItem[];
  dependencies: TaskDependency[];
  customFields: Record<ID, CustomFieldValue>;
  rank: number;
  origin?: 'manual' | 'routine' | 'plan' | 'handoff';
  executionPolicy?: TaskExecutionPolicy;
}

/* ---------------------------------------------------------------- sprints */

export interface Sprint {
  id: ID;
  name: string;
  goal: string;
  projectId: ID;
  teamId: ID;
  startDate: ISODate;
  endDate: ISODate;
  status: SprintStatus;
  capacityPoints: number;
  committedPoints: number;
  completedPoints: number;
}

export interface BurndownPoint {
  date: ISODate;
  remaining: number;
  ideal: number;
}

export interface VelocityPoint {
  sprintName: string;
  committed: number;
  completed: number;
}

/* --------------------------------------------------------------- releases */

export interface ReadinessCheck {
  id: ID;
  label: string;
  done: boolean;
  ownerId: ID;
}

export interface Milestone {
  id: ID;
  name: string;
  description: string;
  date: ISODate;
  projectId: ID;
  releaseId?: ID;
  completed: boolean;
}

export interface Release {
  id: ID;
  version: string;
  name: string;
  description: string;
  projectId: ID;
  ownerId: ID;
  targetDate: ISODate;
  releasedOn?: ISODate;
  status: ReleaseStatus;
  deploymentStatus: DeploymentStatus;
  progress: number;
  readiness: ReadinessCheck[];
  notes: string;
}

/* ---------------------------------------------------------------- roadmap */

export interface RoadmapItem {
  id: ID;
  title: string;
  description: string;
  kind: RoadmapItemKind;
  projectId: ID;
  productArea: string;
  teamId: ID;
  ownerId: ID;
  startDate: ISODate;
  endDate: ISODate;
  progress: number;
  priority: Priority;
  health: HealthLevel;
  dependsOnIds: ID[];
  releaseId?: ID;
}

/* --------------------------------------------------------------- calendar */

export interface CalendarEvent {
  id: ID;
  title: string;
  kind: CalendarEventKind;
  start: ISODate;
  end: ISODate;
  allDay: boolean;
  projectId: ID;
  sourceId: ID;
  assigneeId?: ID;
  status?: TaskStatus;
  priority?: Priority;
}

/* -------------------------------------------------------------- activity  */

export const ACTIVITY_KINDS = [
  'created',
  'status_changed',
  'assigned',
  'commented',
  'moved',
  'released',
  'sprint_started',
  'sprint_completed',
  'attachment_added',
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export interface Activity {
  id: ID;
  kind: ActivityKind;
  actorId: ID;
  projectId: ID;
  entityType: 'task' | 'project' | 'sprint' | 'release' | 'roadmap_item';
  entityId: ID;
  entityLabel: string;
  summary: string;
  createdAt: ISODate;
}

export interface Notification {
  id: ID;
  title: string;
  body: string;
  createdAt: ISODate;
  read: boolean;
  severity: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

export interface DocumentRecord {
  id: ID;
  title: string;
  kind: 'spec' | 'prd' | 'design' | 'runbook' | 'retro' | 'notes';
  projectId: ID;
  authorId: ID;
  updatedAt: ISODate;
  excerpt: string;
  tags: string[];
}

/* --------------------------------------------------------- CGen work items */

// Branded ID types for type safety
export type WorkItemId = string & { readonly __brand: 'WorkItemId' };
export type ProductId = string & { readonly __brand: 'ProductId' };
export type ReleaseId = string & { readonly __brand: 'ReleaseId' };
export type SprintId = string & { readonly __brand: 'SprintId' };
export type UserId = string & { readonly __brand: 'UserId' };
export type TeamId = string & { readonly __brand: 'TeamId' };
export type LabelId = string & { readonly __brand: 'LabelId' };
export type CategoryId = string & { readonly __brand: 'CategoryId' };
export type StatusId = string & { readonly __brand: 'StatusId' };

// Work Item Types
export const WORK_ITEM_TYPES = ['IDEA', 'EPIC', 'FEATURE', 'BUG', 'TASK'] as const;
export type WorkItemType = (typeof WORK_ITEM_TYPES)[number];

// Idea stages for the pipeline
export const IDEA_STAGES = ['new', 'under_review', 'accepted', 'rejected', 'merged'] as const;
export type IdeaStage = (typeof IDEA_STAGES)[number];

// QA and Architecture statuses
export const QA_STATUSES = ['not_started', 'in_progress', 'passed', 'failed'] as const;
export type QaStatus = (typeof QA_STATUSES)[number];

export const ARCHITECTURE_STATUSES = ['not_reviewed', 'in_review', 'approved', 'changes_requested'] as const;
export type ArchitectureStatus = (typeof ARCHITECTURE_STATUSES)[number];

// Severity for bugs
export const SEVERITIES = ['blocker', 'critical', 'major', 'minor', 'trivial'] as const;
export type Severity = (typeof SEVERITIES)[number];

// Estimates
export interface Estimates {
  initial?: number;
  detailed?: number;
  actual?: number;
  remaining?: number;
}

// Design assets
export interface DesignAsset {
  id: ID;
  name: string;
  url: string;
  type: 'figma' | 'sketch' | 'image' | 'pdf';
}

// Integration references
export interface IntegrationRef {
  provider: 'github' | 'jira' | 'zendesk' | 'figma' | 'slack';
  externalId: string;
  url?: string;
  label?: string;
  prCount?: number;
  issueCount?: number;
}

// Role-based access
export const PERSONA_ROLES = ['CEO', 'CTO', 'PM', 'ARCHITECT', 'SR_DEV', 'JR_DEV', 'DESIGNER', 'QA', 'DEVOPS'] as const;
export type PersonaRole = (typeof PERSONA_ROLES)[number];

export type Permission =
  | 'roadmap.view' | 'roadmap.edit'
  | 'idea.triage' | 'idea.vote'
  | 'release.approve' | 'release.deploy'
  | 'finance.view'
  | 'sprint.manage' | 'sprint.view'
  | 'design.approve' | 'design.view'
  | 'backlog.manage' | 'backlog.view'
  | 'settings.manage'
  | 'reports.view'
  | 'team.manage'
  | 'workitem.create' | 'workitem.edit' | 'workitem.delete'
  | 'architecture.review'
  | 'qa.manage';

export const ROLE_PERMISSIONS: Record<PersonaRole, readonly Permission[]> = {
  CEO: ['roadmap.view', 'roadmap.edit', 'finance.view', 'reports.view', 'release.approve', 'sprint.view', 'backlog.view', 'design.view', 'idea.vote'],
  CTO: ['roadmap.view', 'roadmap.edit', 'reports.view', 'release.approve', 'sprint.view', 'sprint.manage', 'backlog.view', 'backlog.manage', 'design.view', 'architecture.review', 'workitem.create', 'workitem.edit', 'idea.triage', 'idea.vote', 'team.manage', 'settings.manage'],
  PM: ['roadmap.view', 'roadmap.edit', 'reports.view', 'release.approve', 'sprint.view', 'sprint.manage', 'backlog.view', 'backlog.manage', 'design.view', 'workitem.create', 'workitem.edit', 'workitem.delete', 'idea.triage', 'idea.vote', 'team.manage', 'finance.view'],
  ARCHITECT: ['roadmap.view', 'reports.view', 'sprint.view', 'backlog.view', 'backlog.manage', 'design.view', 'architecture.review', 'workitem.create', 'workitem.edit', 'idea.vote'],
  SR_DEV: ['roadmap.view', 'sprint.view', 'sprint.manage', 'backlog.view', 'backlog.manage', 'workitem.create', 'workitem.edit', 'idea.vote', 'reports.view'],
  JR_DEV: ['sprint.view', 'backlog.view', 'workitem.create', 'workitem.edit', 'idea.vote'],
  DESIGNER: ['roadmap.view', 'sprint.view', 'backlog.view', 'design.view', 'design.approve', 'workitem.create', 'workitem.edit', 'idea.vote'],
  QA: ['sprint.view', 'backlog.view', 'qa.manage', 'workitem.create', 'workitem.edit', 'release.approve', 'reports.view'],
  DEVOPS: ['sprint.view', 'backlog.view', 'release.deploy', 'workitem.create', 'workitem.edit', 'reports.view', 'settings.manage'],
};

// WorkItem discriminated union
interface WorkItemBase {
  readonly id: WorkItemId;
  readonly key: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  productId: string;
  assigneeId?: string;
  reporterId: string;
  teamId?: string;
  labels: string[];
  estimates: Estimates;
  counts: { comments: number; todos: number; attachments: number; votes: number };
  integrations: IntegrationRef[];
  createdAt: ISODate;
  updatedAt: ISODate;
  dueDate?: ISODate;
  dependencies: { blocks: WorkItemId[]; blockedBy: WorkItemId[] };
}

export type WorkItem =
  | (WorkItemBase & { type: 'IDEA'; stage: IdeaStage; categoryId?: CategoryId; mergedInto?: WorkItemId })
  | (WorkItemBase & { type: 'EPIC'; releaseId?: string; childIds: WorkItemId[] })
  | (WorkItemBase & { type: 'FEATURE'; epicId?: WorkItemId; releaseId?: string; sprintId?: string; qaStatus: QaStatus; architectureStatus: ArchitectureStatus; designAssets: DesignAsset[] })
  | (WorkItemBase & { type: 'BUG'; severity: Severity; sprintId?: string; foundInReleaseId?: string })
  | (WorkItemBase & { type: 'TASK'; parentId?: WorkItemId; sprintId?: string });

// Feedback entity for intake
export interface FeedbackItem {
  id: ID;
  title: string;
  description: string;
  source: 'zendesk' | 'intercom' | 'slack' | 'email' | 'survey' | 'internal';
  sourceRef?: string;
  submittedAt: ISODate;
  submittedBy?: string;
  votes: number;
  linkedWorkItemId?: ID;
  status: 'new' | 'reviewed' | 'linked' | 'dismissed';
  projectId: ID;
  tags: string[];
}

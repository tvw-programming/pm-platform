/**
 * Core domain models for Meridian.
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
  assigneeId?: ID;
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

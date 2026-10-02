/**
 * CGen design tokens.
 *
 * Single source of truth for brand colour, semantic status colour, radius,
 * elevation and chart palettes. Nothing in the component tree should hardcode
 * a hex value — it should read from the theme (which is built from these) or
 * from the helper maps exported here.
 */

import type {
  Availability,
  DeploymentStatus,
  HealthLevel,
  Priority,
  ProjectStatus,
  ReleaseStatus,
  RiskSeverity,
  RoadmapItemKind,
  SprintStatus,
  TaskStatus,
  TaskType,
} from '@/types/domain';

/* ----------------------------------------------------------------- brand  */

/** CGen's accent: an iris violet paired with a cool slate neutral ramp. */
export const brand = {
  50: '#F0EFFE',
  100: '#DEDBFD',
  300: '#A9A2F6',
  500: '#5A4BE0',
  600: '#4A3CC9',
  700: '#3B2FA6',
} as const;

export const slate = {
  0: '#FFFFFF',
  25: '#FBFBFD',
  50: '#F5F6F9',
  100: '#ECEEF3',
  200: '#DDE1E9',
  400: '#8D96A8',
  600: '#5A6377',
  800: '#2A3040',
  900: '#171B26',
  950: '#0E111A',
} as const;

export const semantic = {
  success: '#1E8F5E',
  successSoft: '#E4F4EA',
  warning: '#B8690C',
  warningSoft: '#FDF0DB',
  error: '#C13A3A',
  errorSoft: '#FBE8E6',
  info: '#4A7BD4',
  infoSoft: '#E5F1F9',
} as const;

/* ---------------------------------------------------------------- shape   */

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 20,
  pill: 999,
} as const;

/** Flat, low-contrast elevation ramp — enterprise density without drop-shadow
 *  noise. Index matches MUI's 0-24 scale positions we actually use. */
export const shadowRamp = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(23, 27, 38, 0.06)',
  sm: '0 1px 3px 0 rgba(23, 27, 38, 0.08), 0 1px 2px -1px rgba(23, 27, 38, 0.06)',
  md: '0 4px 10px -2px rgba(23, 27, 38, 0.10), 0 2px 4px -2px rgba(23, 27, 38, 0.06)',
  lg: '0 12px 24px -6px rgba(23, 27, 38, 0.14), 0 4px 8px -4px rgba(23, 27, 38, 0.08)',
  xl: '0 24px 48px -12px rgba(23, 27, 38, 0.22)',
} as const;

export const layout = {
  sidebarWidth: 264,
  sidebarCollapsedWidth: 68,
  appBarHeight: 60,
  taskDrawerWidth: 520,
  detailDrawerWidth: 440,
  contentMaxWidth: 1680,
} as const;

/* ---------------------------------------------------- domain colour maps  */

export interface StatusToken {
  label: string;
  color: string;
  soft: string;
}

export const taskStatusTokens: Record<TaskStatus, StatusToken> = {
  backlog: { label: 'Backlog', color: '#8D96A8', soft: slate[100] },
  todo: { label: 'To Do', color: '#4A7BD4', soft: semantic.infoSoft },
  in_progress: { label: 'In Progress', color: '#B8690C', soft: semantic.warningSoft },
  in_review: { label: 'In Review', color: '#7B4FD0', soft: '#F0EFFE' },
  blocked: { label: 'Blocked', color: '#C13A3A', soft: semantic.errorSoft },
  done: { label: 'Done', color: '#1E8F5E', soft: semantic.successSoft },
};

export const taskTypeTokens: Record<TaskType, StatusToken> = {
  story: { label: 'Story', color: '#5A4BE0', soft: brand[50] },
  bug: { label: 'Bug', color: '#C13A3A', soft: semantic.errorSoft },
  task: { label: 'Task', color: '#5A6377', soft: slate[100] },
  improvement: { label: 'Improvement', color: '#5A4BE0', soft: brand[50] },
  epic: { label: 'Epic', color: '#0E7C86', soft: '#E5F5F6' },
  spike: { label: 'Spike', color: '#7B4FD0', soft: '#F0EFFE' },
};

export const priorityTokens: Record<Priority, StatusToken> = {
  critical: { label: 'Critical', color: '#B4232A', soft: '#FBE1DE' },
  high: { label: 'High', color: '#D2680D', soft: semantic.warningSoft },
  medium: { label: 'Medium', color: '#2F6FD0', soft: semantic.infoSoft },
  low: { label: 'Low', color: '#5A6377', soft: slate[100] },
};

export const projectStatusTokens: Record<ProjectStatus, StatusToken> = {
  planning: { label: 'Planning', color: '#4A7BD4', soft: semantic.infoSoft },
  active: { label: 'Active', color: brand[500], soft: brand[50] },
  on_hold: { label: 'On Hold', color: '#B8690C', soft: semantic.warningSoft },
  completed: { label: 'Completed', color: semantic.success, soft: semantic.successSoft },
  archived: { label: 'Archived', color: '#8D96A8', soft: slate[100] },
};

export const healthTokens: Record<HealthLevel, StatusToken> = {
  on_track: { label: 'On Track', color: semantic.success, soft: semantic.successSoft },
  at_risk: { label: 'At Risk', color: semantic.warning, soft: semantic.warningSoft },
  off_track: { label: 'Off Track', color: semantic.error, soft: semantic.errorSoft },
};

export const sprintStatusTokens: Record<SprintStatus, StatusToken> = {
  planned: { label: 'Planned', color: '#4A7BD4', soft: semantic.infoSoft },
  active: { label: 'Active', color: brand[500], soft: brand[50] },
  completed: { label: 'Completed', color: semantic.success, soft: semantic.successSoft },
};

export const releaseStatusTokens: Record<ReleaseStatus, StatusToken> = {
  planned: { label: 'Planned', color: '#8D96A8', soft: slate[100] },
  in_development: { label: 'In Development', color: brand[500], soft: brand[50] },
  in_testing: { label: 'In Testing', color: '#7B4FD0', soft: '#F0EFFE' },
  released: { label: 'Released', color: semantic.success, soft: semantic.successSoft },
  cancelled: { label: 'Cancelled', color: semantic.error, soft: semantic.errorSoft },
};

export const deploymentStatusTokens: Record<DeploymentStatus, StatusToken> = {
  not_started: { label: 'Not Started', color: '#8D96A8', soft: slate[100] },
  staging: { label: 'Staging', color: '#4A7BD4', soft: semantic.infoSoft },
  canary: { label: 'Canary', color: semantic.warning, soft: semantic.warningSoft },
  production: { label: 'Production', color: semantic.success, soft: semantic.successSoft },
  rolled_back: { label: 'Rolled Back', color: semantic.error, soft: semantic.errorSoft },
};

export const riskSeverityTokens: Record<RiskSeverity, StatusToken> = {
  low: { label: 'Low', color: '#5A6377', soft: slate[100] },
  medium: { label: 'Medium', color: semantic.warning, soft: semantic.warningSoft },
  high: { label: 'High', color: '#D2680D', soft: semantic.warningSoft },
  critical: { label: 'Critical', color: '#B4232A', soft: '#FBE1DE' },
};

export const availabilityTokens: Record<Availability, StatusToken> = {
  available: { label: 'Available', color: semantic.success, soft: semantic.successSoft },
  busy: { label: 'Busy', color: semantic.warning, soft: semantic.warningSoft },
  on_leave: { label: 'On Leave', color: '#8D96A8', soft: slate[100] },
  overloaded: { label: 'Overloaded', color: semantic.error, soft: semantic.errorSoft },
};

export const roadmapKindTokens: Record<RoadmapItemKind, StatusToken> = {
  initiative: { label: 'Initiative', color: '#7B4FD0', soft: '#F0EFFE' },
  epic: { label: 'Epic', color: '#0E7C86', soft: '#E5F5F6' },
  feature: { label: 'Feature', color: brand[500], soft: brand[50] },
  milestone: { label: 'Milestone', color: semantic.warning, soft: semantic.warningSoft },
  release: { label: 'Release', color: semantic.info, soft: semantic.infoSoft },
};

/* ----------------------------------------------------------------- charts */

/** Categorical series palette — ordered for maximum adjacent separation and
 *  checked to stay legible on both light and dark surfaces. */
export const chartPalette = [
  '#5A4BE0',
  '#0E7C86',
  '#D2680D',
  '#2F6FD0',
  '#7B4FD0',
  '#1E8F5E',
  '#C13A3A',
  '#8D96A8',
] as const;

export const chartGrid = { light: slate[200], dark: '#2A3545' } as const;

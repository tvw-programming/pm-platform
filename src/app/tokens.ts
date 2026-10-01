/**
 * Meridian design tokens.
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

/** Meridian's accent: a deep teal that is not used by any of the obvious
 *  competitors, paired with a cool graphite neutral ramp. */
export const brand = {
  50: '#E6F5F3',
  100: '#C0E7E2',
  200: '#92D6CE',
  300: '#5FC2B7',
  400: '#2FAEA1',
  500: '#0E8F86',
  600: '#0B766F',
  700: '#095E58',
  800: '#064741',
  900: '#04302C',
} as const;

/** Secondary accent used sparingly for roadmap / initiative emphasis. */
export const accent = {
  50: '#EFEAFE',
  100: '#D8CDFC',
  200: '#BBA8F8',
  300: '#9C82F3',
  400: '#8064EC',
  500: '#6A4BE0',
  600: '#573BBF',
  700: '#452E99',
  800: '#342274',
  900: '#241851',
} as const;

export const graphite = {
  25: '#FBFCFD',
  50: '#F5F7F9',
  100: '#EBEEF2',
  200: '#DCE1E8',
  300: '#C2CAD4',
  400: '#98A3B2',
  500: '#6F7C8D',
  600: '#53606F',
  700: '#3C4754',
  800: '#28313B',
  900: '#191F26',
  950: '#0E1216',
} as const;

export const semantic = {
  success: '#1B8A4B',
  successSoft: '#E4F4EA',
  warning: '#B4720A',
  warningSoft: '#FDF0DB',
  error: '#C3362B',
  errorSoft: '#FBE8E6',
  info: '#1E6FA8',
  infoSoft: '#E5F1F9',
} as const;

/* ---------------------------------------------------------------- shape   */

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

/** Flat, low-contrast elevation ramp — enterprise density without drop-shadow
 *  noise. Index matches MUI's 0-24 scale positions we actually use. */
export const shadowRamp = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(16, 24, 32, 0.05)',
  sm: '0 1px 3px 0 rgba(16, 24, 32, 0.08), 0 1px 2px -1px rgba(16, 24, 32, 0.06)',
  md: '0 4px 10px -2px rgba(16, 24, 32, 0.10), 0 2px 4px -2px rgba(16, 24, 32, 0.06)',
  lg: '0 12px 24px -6px rgba(16, 24, 32, 0.14), 0 4px 8px -4px rgba(16, 24, 32, 0.08)',
  xl: '0 24px 48px -12px rgba(16, 24, 32, 0.22)',
} as const;

export const layout = {
  sidebarWidth: 256,
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
  backlog: { label: 'Backlog', color: graphite[500], soft: graphite[100] },
  todo: { label: 'To Do', color: '#1E6FA8', soft: semantic.infoSoft },
  in_progress: { label: 'In Progress', color: brand[500], soft: brand[50] },
  in_review: { label: 'In Review', color: accent[500], soft: accent[50] },
  blocked: { label: 'Blocked', color: semantic.error, soft: semantic.errorSoft },
  done: { label: 'Done', color: semantic.success, soft: semantic.successSoft },
};

export const taskTypeTokens: Record<TaskType, StatusToken> = {
  story: { label: 'Story', color: '#1B8A4B', soft: semantic.successSoft },
  bug: { label: 'Bug', color: '#C3362B', soft: semantic.errorSoft },
  task: { label: 'Task', color: '#1E6FA8', soft: semantic.infoSoft },
  improvement: { label: 'Improvement', color: brand[600], soft: brand[50] },
  epic: { label: 'Epic', color: accent[600], soft: accent[50] },
  spike: { label: 'Spike', color: '#B4720A', soft: semantic.warningSoft },
};

export const priorityTokens: Record<Priority, StatusToken> = {
  critical: { label: 'Critical', color: '#9B1C13', soft: '#FBE1DE' },
  high: { label: 'High', color: '#C3362B', soft: semantic.errorSoft },
  medium: { label: 'Medium', color: '#B4720A', soft: semantic.warningSoft },
  low: { label: 'Low', color: graphite[500], soft: graphite[100] },
};

export const projectStatusTokens: Record<ProjectStatus, StatusToken> = {
  planning: { label: 'Planning', color: '#1E6FA8', soft: semantic.infoSoft },
  active: { label: 'Active', color: brand[500], soft: brand[50] },
  on_hold: { label: 'On Hold', color: '#B4720A', soft: semantic.warningSoft },
  completed: { label: 'Completed', color: semantic.success, soft: semantic.successSoft },
  archived: { label: 'Archived', color: graphite[500], soft: graphite[100] },
};

export const healthTokens: Record<HealthLevel, StatusToken> = {
  on_track: { label: 'On Track', color: semantic.success, soft: semantic.successSoft },
  at_risk: { label: 'At Risk', color: semantic.warning, soft: semantic.warningSoft },
  off_track: { label: 'Off Track', color: semantic.error, soft: semantic.errorSoft },
};

export const sprintStatusTokens: Record<SprintStatus, StatusToken> = {
  planned: { label: 'Planned', color: '#1E6FA8', soft: semantic.infoSoft },
  active: { label: 'Active', color: brand[500], soft: brand[50] },
  completed: { label: 'Completed', color: semantic.success, soft: semantic.successSoft },
};

export const releaseStatusTokens: Record<ReleaseStatus, StatusToken> = {
  planned: { label: 'Planned', color: graphite[500], soft: graphite[100] },
  in_development: { label: 'In Development', color: brand[500], soft: brand[50] },
  in_testing: { label: 'In Testing', color: accent[500], soft: accent[50] },
  released: { label: 'Released', color: semantic.success, soft: semantic.successSoft },
  cancelled: { label: 'Cancelled', color: semantic.error, soft: semantic.errorSoft },
};

export const deploymentStatusTokens: Record<DeploymentStatus, StatusToken> = {
  not_started: { label: 'Not Started', color: graphite[500], soft: graphite[100] },
  staging: { label: 'Staging', color: '#1E6FA8', soft: semantic.infoSoft },
  canary: { label: 'Canary', color: semantic.warning, soft: semantic.warningSoft },
  production: { label: 'Production', color: semantic.success, soft: semantic.successSoft },
  rolled_back: { label: 'Rolled Back', color: semantic.error, soft: semantic.errorSoft },
};

export const riskSeverityTokens: Record<RiskSeverity, StatusToken> = {
  low: { label: 'Low', color: graphite[500], soft: graphite[100] },
  medium: { label: 'Medium', color: semantic.warning, soft: semantic.warningSoft },
  high: { label: 'High', color: '#C3362B', soft: semantic.errorSoft },
  critical: { label: 'Critical', color: '#9B1C13', soft: '#FBE1DE' },
};

export const availabilityTokens: Record<Availability, StatusToken> = {
  available: { label: 'Available', color: semantic.success, soft: semantic.successSoft },
  busy: { label: 'Busy', color: semantic.warning, soft: semantic.warningSoft },
  on_leave: { label: 'On Leave', color: graphite[500], soft: graphite[100] },
  overloaded: { label: 'Overloaded', color: semantic.error, soft: semantic.errorSoft },
};

export const roadmapKindTokens: Record<RoadmapItemKind, StatusToken> = {
  initiative: { label: 'Initiative', color: accent[600], soft: accent[50] },
  epic: { label: 'Epic', color: accent[400], soft: accent[50] },
  feature: { label: 'Feature', color: brand[500], soft: brand[50] },
  milestone: { label: 'Milestone', color: semantic.warning, soft: semantic.warningSoft },
  release: { label: 'Release', color: semantic.info, soft: semantic.infoSoft },
};

/* ----------------------------------------------------------------- charts */

/** Categorical series palette — ordered for maximum adjacent separation and
 *  checked to stay legible on both light and dark surfaces. */
export const chartPalette = [
  '#0E8F86',
  '#6A4BE0',
  '#1E6FA8',
  '#B4720A',
  '#1B8A4B',
  '#C3362B',
  '#2FAEA1',
  '#9C82F3',
] as const;

export const chartGrid = { light: graphite[200], dark: '#2C3540' } as const;

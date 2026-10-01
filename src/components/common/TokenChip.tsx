import Chip, { type ChipProps } from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';
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
import {
  availabilityTokens,
  deploymentStatusTokens,
  healthTokens,
  priorityTokens,
  projectStatusTokens,
  releaseStatusTokens,
  riskSeverityTokens,
  roadmapKindTokens,
  sprintStatusTokens,
  taskStatusTokens,
  taskTypeTokens,
  type StatusToken,
} from '@/app/tokens';

interface TokenChipProps extends Omit<ChipProps, 'color' | 'label'> {
  token: StatusToken;
  /** `solid` is reserved for the single most important signal on a surface. */
  emphasis?: 'soft' | 'solid' | 'outline';
  labelOverride?: string;
}

/**
 * One chip primitive drives every status/priority/type badge so colour and
 * contrast behaviour stay identical across the app and across themes.
 */
export function TokenChip({
  token,
  emphasis = 'soft',
  labelOverride,
  size = 'small',
  ...rest
}: TokenChipProps): React.JSX.Element {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const soft = isDark ? alpha(token.color, 0.22) : token.soft;
  const text = isDark ? theme.palette.getContrastText(alpha(token.color, 0.9)) : token.color;

  const styles =
    emphasis === 'solid'
      ? { backgroundColor: token.color, color: theme.palette.getContrastText(token.color), borderColor: token.color }
      : emphasis === 'outline'
        ? { backgroundColor: 'transparent', color: isDark ? token.color : token.color, borderColor: alpha(token.color, 0.5) }
        : { backgroundColor: soft, color: isDark ? lighten(token.color) : text, borderColor: 'transparent' };

  return (
    <Chip
      size={size}
      variant="outlined"
      label={labelOverride ?? token.label}
      {...rest}
      sx={[{ borderWidth: 1, borderStyle: 'solid', ...styles }, ...(Array.isArray(rest.sx) ? rest.sx : [rest.sx])]}
    />
  );
}

/** Dark-mode chip text needs lifting off the saturated base to stay legible. */
function lighten(hex: string): string {
  const value = hex.replace('#', '');
  const num = Number.parseInt(value, 16);
  const r = Math.min(255, Math.round(((num >> 16) & 255) * 0.45 + 255 * 0.55));
  const g = Math.min(255, Math.round(((num >> 8) & 255) * 0.45 + 255 * 0.55));
  const b = Math.min(255, Math.round((num & 255) * 0.45 + 255 * 0.55));
  return `rgb(${r}, ${g}, ${b})`;
}

export const StatusChip = (p: { status: TaskStatus } & Omit<TokenChipProps, 'token'>): React.JSX.Element => {
  const { status, ...rest } = p;
  return <TokenChip token={taskStatusTokens[status]} {...rest} />;
};

export const TypeChip = (p: { type: TaskType } & Omit<TokenChipProps, 'token'>): React.JSX.Element => {
  const { type, ...rest } = p;
  return <TokenChip token={taskTypeTokens[type]} {...rest} />;
};

export const PriorityChip = (p: { priority: Priority } & Omit<TokenChipProps, 'token'>): React.JSX.Element => {
  const { priority, ...rest } = p;
  return <TokenChip token={priorityTokens[priority]} {...rest} />;
};

export const ProjectStatusChip = (p: { status: ProjectStatus } & Omit<TokenChipProps, 'token'>): React.JSX.Element => {
  const { status, ...rest } = p;
  return <TokenChip token={projectStatusTokens[status]} {...rest} />;
};

export const HealthChip = (p: { health: HealthLevel } & Omit<TokenChipProps, 'token'>): React.JSX.Element => {
  const { health, ...rest } = p;
  return <TokenChip token={healthTokens[health]} {...rest} />;
};

export const SprintStatusChip = (p: { status: SprintStatus } & Omit<TokenChipProps, 'token'>): React.JSX.Element => {
  const { status, ...rest } = p;
  return <TokenChip token={sprintStatusTokens[status]} {...rest} />;
};

export const ReleaseStatusChip = (p: { status: ReleaseStatus } & Omit<TokenChipProps, 'token'>): React.JSX.Element => {
  const { status, ...rest } = p;
  return <TokenChip token={releaseStatusTokens[status]} {...rest} />;
};

export const DeploymentChip = (p: { status: DeploymentStatus } & Omit<TokenChipProps, 'token'>): React.JSX.Element => {
  const { status, ...rest } = p;
  return <TokenChip token={deploymentStatusTokens[status]} {...rest} />;
};

export const RiskChip = (p: { severity: RiskSeverity } & Omit<TokenChipProps, 'token'>): React.JSX.Element => {
  const { severity, ...rest } = p;
  return <TokenChip token={riskSeverityTokens[severity]} {...rest} />;
};

export const AvailabilityChip = (p: { availability: Availability } & Omit<TokenChipProps, 'token'>): React.JSX.Element => {
  const { availability, ...rest } = p;
  return <TokenChip token={availabilityTokens[availability]} {...rest} />;
};

export const RoadmapKindChip = (p: { kind: RoadmapItemKind } & Omit<TokenChipProps, 'token'>): React.JSX.Element => {
  const { kind, ...rest } = p;
  return <TokenChip token={roadmapKindTokens[kind]} {...rest} />;
};

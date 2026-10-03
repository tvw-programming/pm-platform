import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import { Bot } from 'lucide-react';
import type { Task, User } from '@/types/domain';
import { UserAvatar } from '@/components/common/UserAvatar';

const ROLE_COLORS: Record<string, string> = {
  senior_fe: '#4A7BD4',
  senior_be: '#1E8F5E',
  qa_lead: '#EA580C',
  project_manager: '#5A4BE0',
  full_stack_em: '#7C3AED',
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AI';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

interface AgentAssigneeProps {
  task: Task;
  humanUser?: User;
  size?: number;
  showName?: boolean;
}

/** Renders human UserAvatar or an agent avatar + optional policy chip. */
export function AgentAssignee({
  task,
  humanUser,
  size = 22,
  showName = false,
}: AgentAssigneeProps): React.JSX.Element {
  const isAgent = task.assigneeKind === 'agent';
  const color = ROLE_COLORS[task.assigneeRoleId ?? ''] ?? '#5A4BE0';
  const name = task.assigneeAgentName || task.assigneeRoleId?.replace(/_/g, ' ') || 'Agent';
  const policy = task.executionPolicy?.status;

  if (!isAgent) {
    return (
      <Stack direction="row" spacing={0.75} alignItems="center">
        <UserAvatar user={humanUser} size={size} />
        {showName ? (
          <Typography variant="body2" noWrap>
            {humanUser?.name ?? 'Unassigned'}
          </Typography>
        ) : null}
      </Stack>
    );
  }

  const avatar = (
    <Avatar
      aria-label={name}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        bgcolor: alpha(color, 0.18),
        color,
        border: '1px solid',
        borderColor: alpha(color, 0.4),
      }}
    >
      {initialsFrom(name)}
    </Avatar>
  );

  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Tooltip title={`${name} · AI · ${task.assigneeRoleId ?? 'agent'}`}>
        <span style={{ display: 'inline-flex' }}>{avatar}</span>
      </Tooltip>
      {showName ? (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap>{name}</Typography>
          <Chip icon={<Bot size={10} />} label="AI" size="small" color="primary" sx={{ height: 18, fontSize: '0.5625rem' }} />
        </Stack>
      ) : (
        <Chip label="AI" size="small" color="primary" sx={{ height: 16, fontSize: '0.5rem', fontWeight: 700 }} />
      )}
      {policy && policy !== 'idle' ? (
        <Chip
          label={policy.replace(/_/g, ' ')}
          size="small"
          color={policy === 'escalated' ? 'error' : policy === 'awaiting_approval' ? 'warning' : 'default'}
          sx={{ height: 16, fontSize: '0.5rem' }}
        />
      ) : null}
    </Stack>
  );
}

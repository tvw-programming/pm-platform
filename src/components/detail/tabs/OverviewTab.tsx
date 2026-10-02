import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import type { ID } from '@/types/domain';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { StatusChip, PriorityChip, TypeChip } from '@/components/common/TokenChip';
import { UserAvatar } from '@/components/common/UserAvatar';
import { formatDate, formatShortDate } from '@/utils/format';

interface OverviewTabProps {
  taskId: string;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ minHeight: 32 }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 100, flexShrink: 0, fontWeight: 600 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Stack>
  );
}

export default function OverviewTab({ taskId }: OverviewTabProps): React.JSX.Element {
  const { state, taskById, userById, projectById } = useWorkspace();
  const task = taskById(taskId);

  const sprint = useMemo(
    () => (task?.sprintId ? state.sprints.find((s) => s.id === task.sprintId) : undefined),
    [state.sprints, task?.sprintId],
  );

  const assignee = userById(task?.assigneeId);
  const reporter = userById(task?.reporterId);
  const project = projectById(task?.projectId);

  if (!task) {
    return (
      <Typography variant="body2" color="text.secondary">
        Task not found.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <FieldRow label="Status">
        <StatusChip status={task.status} />
      </FieldRow>
      <FieldRow label="Priority">
        <PriorityChip priority={task.priority} />
      </FieldRow>
      <FieldRow label="Type">
        <TypeChip type={task.type} />
      </FieldRow>
      <FieldRow label="Assignee">
        <Stack direction="row" spacing={1} alignItems="center">
          <UserAvatar user={assignee} size={22} />
          <Typography variant="body2">{assignee?.name ?? 'Unassigned'}</Typography>
        </Stack>
      </FieldRow>
      <FieldRow label="Reporter">
        <Typography variant="body2">{reporter?.name ?? '—'}</Typography>
      </FieldRow>

      <Divider />

      <FieldRow label="Project">
        <Typography variant="body2">{project ? `${project.key} — ${project.name}` : '—'}</Typography>
      </FieldRow>
      <FieldRow label="Sprint">
        <Typography variant="body2">{sprint?.name ?? 'Backlog'}</Typography>
      </FieldRow>
      <FieldRow label="Story Points">
        <Typography variant="body2">{task.storyPoints ?? '—'}</Typography>
      </FieldRow>
      <FieldRow label="Due Date">
        <Typography variant="body2">{task.dueDate ? formatShortDate(task.dueDate) : '—'}</Typography>
      </FieldRow>

      <Divider />

      {task.dependencies.length > 0 ? (
        <FieldRow label="Dependencies">
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {task.dependencies.map((dep) => (
              <Chip key={dep.id} size="small" label={`${dep.kind.replace('_', ' ')} ${dep.targetTaskId}`} variant="outlined" />
            ))}
          </Stack>
        </FieldRow>
      ) : null}

      <Stack spacing={0.5} sx={{ pt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Created {formatDate(task.createdAt)}
        </Typography>
        {task.completedAt ? (
          <Typography variant="caption" color="text.secondary">
            Completed {formatDate(task.completedAt)}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}

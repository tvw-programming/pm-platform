import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import { CircleSlash, ListChecks, MessageSquare, Paperclip, TriangleAlert } from 'lucide-react';
import type { Task } from '@/types/domain';
import { priorityTokens, taskTypeTokens } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { AgentAssignee } from '@/components/common/AgentAssignee';
import { PriorityChip, TypeChip } from '@/components/common/TokenChip';
import { formatShortDate } from '@/utils/format';
import { checklistProgress, taskIsOverdue } from '@/utils/selectors';

interface TaskCardProps {
  task: Task;
  onOpen: (taskId: string) => void;
  dragging?: boolean;
  /** Spread onto the card so dnd-kit can own pointer and keyboard activation. */
  dragHandleProps?: Record<string, unknown>;
  showProject?: boolean;
}

export function TaskCard({
  task,
  onOpen,
  dragging = false,
  dragHandleProps,
  showProject = false,
}: TaskCardProps): React.JSX.Element {
  const { state, userById, projectById } = useWorkspace();
  const assignee = userById(task.assigneeId);
  const project = projectById(task.projectId);
  const checklist = checklistProgress(task);
  const overdue = taskIsOverdue(task);
  const commentCount = state.comments.filter((c) => c.taskId === task.id).length;
  const attachmentCount = state.attachments.filter((a) => a.taskId === task.id).length;
  const cardLabels = state.labels.filter((l) => task.labelIds.includes(l.id));

  return (
    <Card
      {...dragHandleProps}
      role="button"
      tabIndex={0}
      aria-label={`${task.key}: ${task.title}. ${taskTypeTokens[task.type].label}, ${priorityTokens[task.priority].label} priority${overdue ? ', overdue' : ''}`}
      onClick={() => onOpen(task.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          // Space is reserved by dnd-kit for lifting, so only Enter opens.
          if (event.key === 'Enter') {
            event.preventDefault();
            onOpen(task.id);
          }
        }
      }}
      sx={{
        cursor: 'pointer',
        opacity: dragging ? 0.45 : 1,
        borderLeft: '3px solid',
        borderLeftColor: task.status === 'blocked' ? 'error.main' : overdue ? 'warning.main' : 'transparent',
        transition: 'box-shadow 140ms ease, transform 140ms ease',
        '&:hover': { boxShadow: 3 },
        '&:focus-visible': { boxShadow: 5 },
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 0.75 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary' }}
            >
              {task.key}
            </Typography>
            {showProject && project ? (
              <Typography variant="caption" color="text.disabled" noWrap>
                · {project.key}
              </Typography>
            ) : null}
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {task.status === 'blocked' ? (
              <Tooltip title={task.blockedReason ?? 'Blocked'}>
                <Box sx={{ display: 'flex', color: 'error.main' }}>
                  <CircleSlash size={13} aria-label="Blocked" />
                </Box>
              </Tooltip>
            ) : null}
            {overdue ? (
              <Tooltip title={`Overdue — due ${formatShortDate(task.dueDate)}`}>
                <Box sx={{ display: 'flex', color: 'warning.main' }}>
                  <TriangleAlert size={13} aria-label="Overdue" />
                </Box>
              </Tooltip>
            ) : null}
          </Stack>
        </Stack>

        <Typography variant="body2" sx={{ fontWeight: 550, lineHeight: 1.4, mb: 1 }}>
          {task.title}
        </Typography>

        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: cardLabels.length ? 0.75 : 1 }}>
          <TypeChip type={task.type} />
          <PriorityChip priority={task.priority} />
          {task.origin === 'plan' ? (
            <Chip size="small" label="Plan" sx={{ height: 19, fontSize: 10.5 }} />
          ) : null}
          {task.executionPolicy?.status && task.executionPolicy.status !== 'idle' ? (
            <Chip
              size="small"
              label={task.executionPolicy.status.replace(/_/g, ' ')}
              color={task.executionPolicy.status === 'awaiting_approval' ? 'warning' : 'default'}
              sx={{ height: 19, fontSize: 10.5 }}
            />
          ) : null}
        </Stack>

        {cardLabels.length > 0 ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
            {cardLabels.slice(0, 3).map((label) => (
              <Chip
                key={label.id}
                size="small"
                label={label.name}
                sx={{
                  height: 19,
                  fontSize: 10.5,
                  bgcolor: (t) => alpha(label.color, t.palette.mode === 'light' ? 0.14 : 0.24),
                  color: label.color,
                }}
              />
            ))}
            {cardLabels.length > 3 ? (
              <Chip size="small" label={`+${cardLabels.length - 3}`} sx={{ height: 19, fontSize: 10.5 }} />
            ) : null}
          </Stack>
        ) : null}

        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
            {task.storyPoints !== undefined ? (
              <Tooltip title={`${task.storyPoints} story points`}>
                <Box
                  sx={{
                    minWidth: 20,
                    px: 0.5,
                    height: 18,
                    borderRadius: 0.75,
                    bgcolor: 'action.hover',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {task.storyPoints}
                </Box>
              </Tooltip>
            ) : null}
            {checklist.total > 0 ? (
              <Tooltip title={`Checklist ${checklist.done} of ${checklist.total}`}>
                <Stack direction="row" spacing={0.25} alignItems="center">
                  <ListChecks size={12} aria-hidden />
                  <Typography variant="caption">
                    {checklist.done}/{checklist.total}
                  </Typography>
                </Stack>
              </Tooltip>
            ) : null}
            {commentCount > 0 ? (
              <Stack direction="row" spacing={0.25} alignItems="center">
                <MessageSquare size={12} aria-hidden />
                <Typography variant="caption">{commentCount}</Typography>
              </Stack>
            ) : null}
            {attachmentCount > 0 ? (
              <Stack direction="row" spacing={0.25} alignItems="center">
                <Paperclip size={12} aria-hidden />
                <Typography variant="caption">{attachmentCount}</Typography>
              </Stack>
            ) : null}
          </Stack>

          <Stack direction="row" spacing={0.75} alignItems="center">
            {task.dueDate ? (
              <Typography variant="caption" color={overdue ? 'error.main' : 'text.secondary'} fontWeight={overdue ? 700 : 400}>
                {formatShortDate(task.dueDate)}
              </Typography>
            ) : null}
            <AgentAssignee task={task} humanUser={assignee} size={22} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

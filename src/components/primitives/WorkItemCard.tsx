import { memo, type KeyboardEvent } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { MessageSquare, Paperclip, CheckSquare, ThumbsUp } from 'lucide-react';
import type { Task } from '@/types/domain';
import { StatusChip } from './StatusChip';
import { PriorityChip } from './PriorityChip';
import { TypeChip } from './TypeChip';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useWorkspace } from '@/state/WorkspaceProvider';

type CardDensity = 'compact' | 'standard' | 'rich';

interface WorkItemCardProps {
  task: Task;
  density?: CardDensity;
  onClick?: (taskId: string) => void;
  isDragging?: boolean;
}

interface CountBadgeProps {
  icon: typeof MessageSquare;
  count: number;
  label: string;
}

const CountBadge = memo(function CountBadge({ icon: Icon, count, label }: CountBadgeProps) {
  if (count === 0) return null;
  return (
    <Tooltip title={`${count} ${label}`}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: 'text.secondary' }}>
        <Icon size={12} />
        <Typography variant="caption" sx={{ fontSize: '0.6875rem', lineHeight: 1 }}>
          {count}
        </Typography>
      </Box>
    </Tooltip>
  );
});

export const WorkItemCard = memo(function WorkItemCard({
  task,
  density = 'standard',
  onClick,
  isDragging = false,
}: WorkItemCardProps) {
  const { userById, state } = useWorkspace();
  const assignee = userById(task.assigneeId);
  const commentCount = state.comments.filter((c) => c.taskId === task.id).length;
  const attachmentCount = state.attachments.filter((a) => a.taskId === task.id).length;
  const checklistTotal = task.checklist.length;
  const checklistDone = task.checklist.filter((c) => c.done).length;

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick(task.id);
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(task.id)}
      onKeyDown={handleKeyDown}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        opacity: isDragging ? 0.6 : 1,
        transform: isDragging ? 'rotate(2deg)' : 'none',
        transition: 'box-shadow 150ms ease, transform 150ms ease',
        '&:hover': onClick
          ? { borderColor: 'primary.main', boxShadow: '0 2px 8px rgba(90, 75, 224, 0.12)' }
          : {},
        p: density === 'compact' ? 1.25 : 1.75,
      }}
    >
      {/* Header row: key + type */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
        <Typography
          variant="caption"
          sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 600, fontSize: '0.6875rem' }}
        >
          {task.key}
        </Typography>
        {density !== 'compact' && <TypeChip type={task.type} />}
      </Box>

      {/* Title */}
      <Typography
        variant={density === 'compact' ? 'body2' : 'subtitle2'}
        sx={{
          fontWeight: 600,
          mb: density === 'compact' ? 0.5 : 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {task.title}
      </Typography>

      {/* Chips row */}
      {density !== 'compact' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
          <StatusChip status={task.status} />
          <PriorityChip priority={task.priority} />
        </Box>
      )}

      {/* Footer: counts + assignee */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
        <CountBadge icon={MessageSquare} count={commentCount} label="comments" />
        <CountBadge icon={Paperclip} count={attachmentCount} label="attachments" />
        {checklistTotal > 0 && (
          <CountBadge
            icon={CheckSquare}
            count={checklistDone}
            label={`${checklistDone}/${checklistTotal} checklist items`}
          />
        )}
        {task.storyPoints != null && (
          <Tooltip title={`${task.storyPoints} story points`}>
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'action.hover',
                px: 0.75,
                py: 0.125,
                borderRadius: 0.5,
                fontWeight: 700,
                fontSize: '0.625rem',
                color: 'text.secondary',
              }}
            >
              {task.storyPoints}
            </Typography>
          </Tooltip>
        )}
        <Box sx={{ flex: 1 }} />
        {assignee && (
          <UserAvatar user={assignee} size={density === 'compact' ? 20 : 24} />
        )}
      </Box>
    </Card>
  );
});

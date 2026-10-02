import { memo } from 'react';
import Chip from '@mui/material/Chip';
import type { TaskStatus } from '@/types/domain';
import { taskStatusTokens } from '@/app/tokens';

interface StatusChipProps {
  status: TaskStatus;
  size?: 'small' | 'medium';
}

export const StatusChip = memo(function StatusChip({ status, size = 'small' }: StatusChipProps) {
  const token = taskStatusTokens[status];
  return (
    <Chip
      label={token.label}
      size={size}
      sx={{
        bgcolor: token.soft,
        color: token.color,
        fontWeight: 600,
        fontSize: '0.6875rem',
      }}
    />
  );
});

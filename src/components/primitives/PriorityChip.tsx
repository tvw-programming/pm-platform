import { memo } from 'react';
import Chip from '@mui/material/Chip';
import type { Priority } from '@/types/domain';
import { priorityTokens } from '@/app/tokens';

interface PriorityChipProps {
  priority: Priority;
  size?: 'small' | 'medium';
}

export const PriorityChip = memo(function PriorityChip({ priority, size = 'small' }: PriorityChipProps) {
  const token = priorityTokens[priority];
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

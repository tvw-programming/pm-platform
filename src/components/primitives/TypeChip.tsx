import { memo } from 'react';
import Chip from '@mui/material/Chip';
import type { TaskType } from '@/types/domain';
import { taskTypeTokens } from '@/app/tokens';

interface TypeChipProps {
  type: TaskType;
  size?: 'small' | 'medium';
}

export const TypeChip = memo(function TypeChip({ type, size = 'small' }: TypeChipProps) {
  const token = taskTypeTokens[type];
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

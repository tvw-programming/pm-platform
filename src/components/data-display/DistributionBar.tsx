import { memo } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export interface DistributionSegment {
  label: string;
  value: number;
  color: string;
}

interface DistributionBarProps {
  segments: DistributionSegment[];
  height?: number;
}

export const DistributionBar = memo(function DistributionBar({
  segments,
  height = 6,
}: DistributionBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  const summary = segments
    .filter((s) => s.value > 0)
    .map((s) => `${s.label}: ${s.value} (${Math.round((s.value / total) * 100)}%)`)
    .join(', ');

  return (
    <Tooltip
      title={
        <Box>
          {segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                <Typography variant="caption">
                  {s.label}: {s.value} ({Math.round((s.value / total) * 100)}%)
                </Typography>
              </Box>
            ))}
        </Box>
      }
    >
      <Box
        role="meter"
        aria-label={summary}
        sx={{
          display: 'flex',
          height,
          borderRadius: height / 2,
          overflow: 'hidden',
          bgcolor: 'action.hover',
        }}
      >
        {segments.map((segment) => {
          const pct = (segment.value / total) * 100;
          if (pct === 0) return null;
          return (
            <Box
              key={segment.label}
              sx={{
                width: `${pct}%`,
                bgcolor: segment.color,
                transition: 'width 200ms ease',
                minWidth: pct > 0 ? 2 : 0,
              }}
            />
          );
        })}
      </Box>
    </Tooltip>
  );
});

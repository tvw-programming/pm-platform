import { memo } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

interface CapacityBarProps {
  committed: number;
  inFlight: number;
  total: number;
  unit?: string;
  showLabel?: boolean;
}

const COLORS = {
  committed: '#1E8F5E',
  inFlight: '#4A7BD4',
  over: '#D2680D',
};

export const CapacityBar = memo(function CapacityBar({
  committed,
  inFlight,
  total,
  unit = 'days',
  showLabel = true,
}: CapacityBarProps) {
  const used = committed + inFlight;
  const isOver = used > total;
  const committedPct = total > 0 ? Math.min((committed / total) * 100, 100) : 0;
  const inFlightPct = total > 0 ? Math.min((inFlight / total) * 100, 100 - committedPct) : 0;
  const overPct = isOver && total > 0 ? Math.min(((used - total) / total) * 100, 20) : 0;

  const summary = `${used} of ${total} ${unit} used (${committed} committed, ${inFlight} in-flight${isOver ? `, ${used - total} over capacity` : ''})`;

  return (
    <Tooltip title={summary}>
      <Box sx={{ width: '100%' }}>
        {showLabel && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {used} / {total} {unit}
            </Typography>
            {isOver && (
              <Typography variant="caption" sx={{ color: COLORS.over, fontWeight: 600 }}>
                +{used - total} over
              </Typography>
            )}
          </Box>
        )}
        <Box
          role="meter"
          aria-label={summary}
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={total}
          sx={{
            display: 'flex',
            height: 6,
            borderRadius: 1,
            bgcolor: 'action.hover',
            overflow: 'visible',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              width: `${committedPct}%`,
              bgcolor: COLORS.committed,
              borderRadius: '4px 0 0 4px',
              transition: 'width 200ms ease',
            }}
          />
          <Box
            sx={{
              width: `${inFlightPct}%`,
              bgcolor: COLORS.inFlight,
              transition: 'width 200ms ease',
            }}
          />
          {overPct > 0 && (
            <Box
              sx={{
                width: `${overPct}%`,
                bgcolor: COLORS.over,
                borderRadius: '0 4px 4px 0',
                transition: 'width 200ms ease',
              }}
            />
          )}
        </Box>
      </Box>
    </Tooltip>
  );
});

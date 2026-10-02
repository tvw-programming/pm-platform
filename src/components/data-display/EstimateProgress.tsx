import { memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

interface EstimateProgressProps {
  initial?: number;
  detailed?: number;
  actual?: number;
  remaining?: number;
  unit?: string;
}

export const EstimateProgress = memo(function EstimateProgress({
  initial,
  detailed,
  actual = 0,
  remaining = 0,
  unit = 'h',
}: EstimateProgressProps) {
  const estimate = detailed ?? initial ?? 0;
  const total = actual + remaining;
  const progress = total > 0 ? (actual / total) * 100 : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 0.75 }}>
        {initial != null && (
          <Box>
            <Typography variant="caption" color="text.secondary">Initial</Typography>
            <Typography variant="body2" fontWeight={600}>{initial}{unit}</Typography>
          </Box>
        )}
        {detailed != null && (
          <Box>
            <Typography variant="caption" color="text.secondary">Detailed</Typography>
            <Typography variant="body2" fontWeight={600}>{detailed}{unit}</Typography>
          </Box>
        )}
        <Box>
          <Typography variant="caption" color="text.secondary">Actual</Typography>
          <Typography variant="body2" fontWeight={600}>{actual}{unit}</Typography>
        </Box>
        {remaining > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary">Remaining</Typography>
            <Typography variant="body2" fontWeight={600}>{remaining}{unit}</Typography>
          </Box>
        )}
      </Box>
      {estimate > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(progress, 100)}
            color={actual > estimate ? 'warning' : 'primary'}
            sx={{ flex: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32, textAlign: 'right' }}>
            {Math.round(progress)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
});

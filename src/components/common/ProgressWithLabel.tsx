import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

interface ProgressWithLabelProps {
  value: number;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  size?: 'sm' | 'md';
  showValue?: boolean;
}

export function ProgressWithLabel({
  value,
  label,
  color = 'primary',
  size = 'md',
  showValue = true,
}: ProgressWithLabelProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <Box sx={{ width: '100%' }}>
      {label || showValue ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          {label ? (
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          ) : (
            <span />
          )}
          {showValue ? (
            <Typography variant="caption" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {clamped}%
            </Typography>
          ) : null}
        </Stack>
      ) : null}
      <LinearProgress
        variant="determinate"
        value={clamped}
        color={color}
        aria-label={label ?? 'Progress'}
        sx={{ height: size === 'sm' ? 4 : 6 }}
      />
    </Box>
  );
}

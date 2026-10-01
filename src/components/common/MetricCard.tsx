import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  caption?: string;
  icon?: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'error' | 'info';
  delta?: { value: number; label: string };
  progress?: number;
  onClick?: () => void;
}

const toneColor = {
  default: 'primary.main',
  success: 'success.main',
  warning: 'warning.main',
  error: 'error.main',
  info: 'info.main',
} as const;

export function MetricCard({
  label,
  value,
  caption,
  icon,
  tone = 'default',
  delta,
  progress,
  onClick,
}: MetricCardProps): React.JSX.Element {
  const interactive = Boolean(onClick);

  return (
    <Card
      component={interactive ? 'button' : 'div'}
      onClick={onClick}
      aria-label={interactive ? `${label}: ${value}` : undefined}
      sx={{
        width: '100%',
        textAlign: 'left',
        font: 'inherit',
        cursor: interactive ? 'pointer' : 'default',
        '&:hover': interactive ? { boxShadow: 3, borderColor: 'primary.main' } : undefined,
      }}
    >
      <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Typography variant="overline" color="text.secondary" component="p">
            {label}
          </Typography>
          {icon ? (
            <Box
              aria-hidden
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1.5,
                display: 'grid',
                placeItems: 'center',
                color: toneColor[tone],
                bgcolor: (t) =>
                  alpha(
                    tone === 'default'
                      ? t.palette.primary.main
                      : tone === 'success'
                        ? t.palette.success.main
                        : tone === 'warning'
                          ? t.palette.warning.main
                          : tone === 'error'
                            ? t.palette.error.main
                            : t.palette.info.main,
                    0.1,
                  ),
              }}
            >
              {icon}
            </Box>
          ) : null}
        </Stack>

        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 0.5 }}>
          <Typography variant="h2" component="p" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </Typography>
          {delta ? (
            <Tooltip title={delta.label}>
              <Stack
                direction="row"
                spacing={0.25}
                alignItems="center"
                sx={{ color: delta.value >= 0 ? 'success.main' : 'error.main' }}
              >
                {delta.value >= 0 ? <TrendingUp size={14} aria-hidden /> : <TrendingDown size={14} aria-hidden />}
                <Typography variant="caption" fontWeight={700}>
                  {Math.abs(delta.value)}%
                </Typography>
              </Stack>
            </Tooltip>
          ) : null}
        </Stack>

        {caption ? (
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.25 }}>
            {caption}
          </Typography>
        ) : null}

        {progress !== undefined ? (
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, progress))}
            aria-label={`${label} progress`}
            sx={{ mt: 1.5 }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

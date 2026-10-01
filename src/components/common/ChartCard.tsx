import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { ResponsiveContainer } from 'recharts';
import type { ReactElement, ReactNode } from 'react';
import { chartGrid } from '@/app/tokens';

interface ChartCardProps {
  title: string;
  subheader?: string;
  action?: ReactNode;
  height?: number;
  /** Text equivalent of the chart, exposed to assistive technology. */
  summary: string;
  children: ReactElement;
  empty?: boolean;
  emptyNode?: ReactNode;
}

export function ChartCard({
  title,
  subheader,
  action,
  height = 280,
  summary,
  children,
  empty = false,
  emptyNode,
}: ChartCardProps): React.JSX.Element {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={title} subheader={subheader} action={action} />
      <CardContent sx={{ flex: 1, pt: 0.5 }}>
        {empty ? (
          (emptyNode ?? (
            <Box sx={{ height, display: 'grid', placeItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No data for the selected filters.
              </Typography>
            </Box>
          ))
        ) : (
          <>
            <Box sx={{ width: '100%', height }} role="img" aria-label={`${title}. ${summary}`}>
              <ResponsiveContainer width="100%" height="100%">
                {children}
              </ResponsiveContainer>
            </Box>
            {/* Screen-reader and print fallback for the visual series. */}
            <Typography
              variant="caption"
              color="text.secondary"
              component="p"
              sx={{ mt: 1, display: 'block' }}
            >
              {summary}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Shared Recharts axis/grid/tooltip styling driven by the active theme. */
export function useChartTheme(): {
  gridStroke: string;
  axisStroke: string;
  tickStyle: { fontSize: number; fill: string };
  tooltipStyle: React.CSSProperties;
} {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    gridStroke: isDark ? chartGrid.dark : chartGrid.light,
    axisStroke: theme.palette.text.disabled,
    tickStyle: { fontSize: 11, fill: theme.palette.text.secondary },
    tooltipStyle: {
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 8,
      fontSize: 12,
      boxShadow: theme.shadows[8],
      color: theme.palette.text.primary,
    },
  };
}

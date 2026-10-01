import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import { CalendarDays, Diamond, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DeadlineRow } from '@/utils/selectors';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useUi } from '@/state/UiProvider';
import { EmptyState } from '@/components/common/States';
import { daysUntil, formatShortDate } from '@/utils/format';
import { paths } from '@/app/navigation';

const KIND_ICON = {
  task: CalendarDays,
  milestone: Diamond,
  release: Rocket,
} as const;

export function DeadlinesList({ rows, maxHeight = 420 }: { rows: DeadlineRow[]; maxHeight?: number }): React.JSX.Element {
  const { projectById } = useWorkspace();
  const { openTask } = useUi();
  const navigate = useNavigate();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader title="Upcoming deadlines" subheader="Next three weeks, overdue first" />
      <CardContent sx={{ pt: 0.5, px: 1, flex: 1, overflowY: 'auto', maxHeight }}>
        {rows.length === 0 ? (
          <EmptyState dense title="Nothing due soon" description="No tasks, milestones or releases land in the next three weeks." />
        ) : (
          <Stack spacing={0.25}>
            {rows.map((row) => {
              const Icon = KIND_ICON[row.kind];
              const project = projectById(row.projectId);
              const days = daysUntil(row.date);
              return (
                <ListItemButton
                  key={`${row.kind}-${row.id}`}
                  onClick={() => {
                    if (row.kind === 'task') openTask(row.id);
                    else if (row.kind === 'release') navigate(paths.release(row.id));
                    else navigate(paths.calendar);
                  }}
                  sx={{ borderRadius: 1.5, alignItems: 'flex-start', py: 1 }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      mt: 0.25,
                      mr: 1.25,
                      color: row.overdue ? 'error.main' : 'text.secondary',
                      display: 'flex',
                    }}
                  >
                    <Icon size={15} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 550 }}>
                      {row.label}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                      {project ? <Chip size="small" label={project.key} sx={{ height: 18, fontSize: 10.5 }} /> : null}
                      <Typography variant="caption" color={row.overdue ? 'error.main' : 'text.secondary'}>
                        {formatShortDate(row.date)}
                        {days !== undefined
                          ? row.overdue
                            ? ` · ${Math.abs(days)}d overdue`
                            : days === 0
                              ? ' · today'
                              : ` · in ${days}d`
                          : ''}
                      </Typography>
                    </Stack>
                  </Box>
                </ListItemButton>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

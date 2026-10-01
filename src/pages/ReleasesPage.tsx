import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import type { ID, Release } from '@/types/domain';
import { PageHeader } from '@/components/common/PageHeader';
import { DeploymentChip, ReleaseStatusChip } from '@/components/common/TokenChip';
import { ProgressWithLabel } from '@/components/common/ProgressWithLabel';
import { UserAvatar } from '@/components/common/UserAvatar';
import { EmptyState } from '@/components/common/States';
import { MetricCard } from '@/components/common/MetricCard';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { paths } from '@/app/navigation';
import { daysUntil, formatShortDate } from '@/utils/format';
import { releaseReadiness, isDone } from '@/utils/selectors';

type ReleaseTab = 'upcoming' | 'active' | 'completed' | 'all';

interface ReleasesPageProps {
  projectId?: ID;
  embedded?: boolean;
}

export function ReleasesPage({ projectId, embedded = false }: ReleasesPageProps): React.JSX.Element {
  const { state } = useWorkspace();
  const [tab, setTab] = useState<ReleaseTab>('upcoming');

  const scoped = useMemo(
    () => state.releases.filter((release) => (projectId ? release.projectId === projectId : true)),
    [state.releases, projectId],
  );

  const buckets = useMemo(
    () => ({
      upcoming: scoped.filter((r) => r.status === 'planned'),
      active: scoped.filter((r) => r.status === 'in_development' || r.status === 'in_testing'),
      completed: scoped.filter((r) => r.status === 'released' || r.status === 'cancelled'),
      all: scoped,
    }),
    [scoped],
  );

  const rows = [...buckets[tab]].sort((a, b) => a.targetDate.localeCompare(b.targetDate));

  return (
    <Box>
      {!embedded ? (
        <PageHeader
          title="Releases"
          description="Readiness, deployment state and scope for every release in flight."
        />
      ) : null}

      {!embedded ? (
        <Box
          sx={{
            display: 'grid',
            '& > *': { minWidth: 0 },
            gap: 2,
            mb: 3,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          }}
        >
          <MetricCard label="In flight" value={buckets.active.length} caption="In development or testing" />
          <MetricCard label="Planned" value={buckets.upcoming.length} caption="Not started yet" />
          <MetricCard label="Shipped" value={buckets.completed.length} caption="Released or cancelled" tone="success" />
          <MetricCard
            label="Checks outstanding"
            value={buckets.active.reduce((total, r) => total + r.readiness.filter((c) => !c.done).length, 0)}
            caption="Across active releases"
            tone="warning"
          />
        </Box>
      ) : null}

      <Tabs
        value={tab}
        onChange={(_, value: ReleaseTab) => setTab(value)}
        sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab value="upcoming" label={`Upcoming (${buckets.upcoming.length})`} />
        <Tab value="active" label={`Active (${buckets.active.length})`} />
        <Tab value="completed" label={`Completed (${buckets.completed.length})`} />
        <Tab value="all" label={`All (${buckets.all.length})`} />
      </Tabs>

      {rows.length === 0 ? (
        <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
          <EmptyState title="No releases here" description="Nothing in this bucket for the current scope." />
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            '& > *': { minWidth: 0 },
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' },
          }}
        >
          {rows.map((release) => (
            <ReleaseSummaryCard key={release.id} release={release} />
          ))}
        </Box>
      )}
    </Box>
  );
}

function ReleaseSummaryCard({ release }: { release: Release }): React.JSX.Element {
  const navigate = useNavigate();
  const { visibleTasks, userById, projectById } = useWorkspace();
  const scopeTasks = visibleTasks.filter((task) => task.releaseId === release.id);
  const readiness = releaseReadiness(release);
  const days = daysUntil(release.targetDate);
  const project = projectById(release.projectId);

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea
        onClick={() => navigate(paths.release(release.id))}
        sx={{ height: '100%', alignItems: 'stretch' }}
        aria-label={`Open ${release.name} ${release.version}`}
      >
        <CardContent sx={{ p: 2.25 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Chip size="small" label={`v${release.version}`} sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
                <Typography variant="caption" color="text.secondary">
                  {project?.key}
                </Typography>
              </Stack>
              <Typography variant="h5" sx={{ mt: 0.75 }} noWrap>
                {release.name}
              </Typography>
            </Box>
            <ReleaseStatusChip status={release.status} />
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.75, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {release.description}
          </Typography>

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.75 }}>
            <DeploymentChip status={release.deploymentStatus} />
            <Chip size="small" variant="outlined" label={`${scopeTasks.length} items`} />
            <Chip size="small" variant="outlined" label={`${scopeTasks.filter((t) => t.type === 'bug').length} bugs`} />
          </Stack>

          <ProgressWithLabel value={release.progress} label="Scope complete" size="sm" />
          <Box sx={{ mt: 1 }}>
            <ProgressWithLabel
              value={readiness}
              label="Readiness checks"
              size="sm"
              color={readiness >= 70 ? 'success' : 'warning'}
            />
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
              <UserAvatar user={userById(release.ownerId)} size={22} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {userById(release.ownerId)?.name ?? '—'}
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              color={days !== undefined && days < 0 && release.status !== 'released' ? 'error.main' : 'text.secondary'}
            >
              {release.releasedOn
                ? `shipped ${formatShortDate(release.releasedOn)}`
                : `target ${formatShortDate(release.targetDate)}${days !== undefined ? ` · ${days < 0 ? `${Math.abs(days)}d late` : `in ${days}d`}` : ''}`}
            </Typography>
          </Stack>

          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.75, display: 'block' }}>
            {scopeTasks.filter(isDone).length} of {scopeTasks.length} scope items complete
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

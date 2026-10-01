import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import { Plus } from 'lucide-react';
import { PROJECT_TABS, paths, type ProjectTabId } from '@/app/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { HealthChip, PriorityChip, ProjectStatusChip, RiskChip } from '@/components/common/TokenChip';
import { ProgressWithLabel } from '@/components/common/ProgressWithLabel';
import { UserAvatar, UserAvatarStack } from '@/components/common/UserAvatar';
import { EmptyState } from '@/components/common/States';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { StatusDistributionChart } from '@/components/dashboard/DashboardCharts';
import { BoardPage } from './BoardPage';
import { CalendarPage } from './CalendarPage';
import { RoadmapPage } from './RoadmapPage';
import { BacklogPage } from './BacklogPage';
import { SprintsPage } from './SprintsPage';
import { ReleasesPage } from './ReleasesPage';
import { DocumentsPage } from './DocumentsPage';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useUi } from '@/state/UiProvider';
import { formatDate, percent } from '@/utils/format';
import { projectStats, upcomingDeadlines } from '@/utils/selectors';
import { DeadlinesList } from '@/components/dashboard/DeadlinesList';

export function ProjectWorkspacePage(): React.JSX.Element {
  const { projectId, tab } = useParams<{ projectId: string; tab?: string }>();
  const navigate = useNavigate();
  const { state, visibleTasks, userById } = useWorkspace();
  const { openCreateTask } = useUi();

  const project = state.projects.find((p) => p.id === projectId);
  const activeTab = (PROJECT_TABS.find((t) => t.id === tab)?.id ?? 'overview') as ProjectTabId;

  const stats = useMemo(
    () => (project ? projectStats(visibleTasks, project.id) : undefined),
    [visibleTasks, project],
  );

  const projectTasks = useMemo(
    () => visibleTasks.filter((task) => task.projectId === project?.id),
    [visibleTasks, project?.id],
  );
  const risks = useMemo(
    () => state.risks.filter((risk) => risk.projectId === project?.id),
    [state.risks, project?.id],
  );
  const activity = useMemo(
    () => state.activities.filter((a) => a.projectId === project?.id),
    [state.activities, project?.id],
  );
  const deadlines = useMemo(
    () =>
      upcomingDeadlines(
        projectTasks,
        state.milestones.filter((m) => m.projectId === project?.id),
        state.releases.filter((r) => r.projectId === project?.id),
      ),
    [projectTasks, state.milestones, state.releases, project?.id],
  );

  if (!project || !stats) {
    return (
      <EmptyState
        title="Project not found"
        description="This project may have been archived, or the link is out of date."
        action={
          <Button variant="contained" onClick={() => navigate(paths.projects)}>
            Back to projects
          </Button>
        }
      />
    );
  }

  const members = state.users.filter((u) => project.memberIds.includes(u.id));
  const owner = userById(project.productOwnerId);
  const blockers = projectTasks.filter((task) => task.status === 'blocked');

  return (
    <Box>
      <PageHeader
        title={project.name}
        description={project.description}
        meta={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <Chip size="small" label={project.key} sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
            <ProjectStatusChip status={project.status} />
            <HealthChip health={project.health} />
            <PriorityChip priority={project.priority} />
            <Chip size="small" variant="outlined" label={project.productArea} />
            <Stack direction="row" spacing={0.75} alignItems="center">
              <UserAvatar user={owner} size={22} />
              <Typography variant="caption" color="text.secondary">
                {owner?.name ?? 'No owner'}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Target {formatDate(project.targetReleaseDate)}
            </Typography>
          </Stack>
        }
        actions={
          <Button
            variant="contained"
            startIcon={<Plus size={15} />}
            onClick={() => openCreateTask({ projectId: project.id, status: 'todo' })}
          >
            Add task
          </Button>
        }
      />

      <Tabs
        value={activeTab}
        onChange={(_, value: ProjectTabId) => navigate(paths.project(project.id, value))}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {PROJECT_TABS.map((item) => (
          <Tab key={item.id} value={item.id} label={item.label} />
        ))}
      </Tabs>

      {activeTab === 'overview' ? (
        <Box>
          <Box
            sx={{
              display: 'grid',
              '& > *': { minWidth: 0 },
              gap: 2,
              mb: 3,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
            }}
          >
            <MetricCard label="Progress" value={`${stats.progress}%`} caption={`${stats.done} of ${stats.total} tasks`} progress={stats.progress} />
            <MetricCard label="In flight" value={stats.inProgress} caption="In progress or review" tone="info" />
            <MetricCard label="Blocked" value={stats.blocked} caption="Needs a decision" tone={stats.blocked ? 'error' : 'default'} />
            <MetricCard label="Overdue" value={stats.overdue} caption="Past due date" tone={stats.overdue ? 'warning' : 'default'} />
            <MetricCard
              label="Story points"
              value={stats.points}
              caption={`${stats.donePoints} completed (${percent(stats.donePoints, stats.points)}%)`}
              progress={percent(stats.donePoints, stats.points)}
            />
          </Box>

          <Box sx={{ display: 'grid', '& > *': { minWidth: 0 }, gap: 2, mb: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr', xl: '1fr 1fr 1fr' } }}>
            <Card>
              <CardHeader title="Project detail" subheader="Ownership, dates and team" />
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={1.5}>
                  <DetailRow label="Project key" value={project.key} />
                  <DetailRow label="Product owner" value={owner?.name ?? '—'} />
                  <DetailRow label="Product area" value={project.productArea} />
                  <DetailRow label="Started" value={formatDate(project.startDate)} />
                  <DetailRow label="Target release" value={formatDate(project.targetReleaseDate)} />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ width: 120, flexShrink: 0 }}>
                      Teams
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {project.teamIds.map((id) => (
                        <Chip key={id} size="small" variant="outlined" label={state.teams.find((t) => t.id === id)?.name ?? id} />
                      ))}
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ width: 120, flexShrink: 0 }}>
                      Team
                    </Typography>
                    <UserAvatarStack users={members} max={8} size={26} />
                  </Stack>
                  <Divider />
                  <ProgressWithLabel
                    value={stats.progress}
                    label="Task completion"
                    color={project.health === 'on_track' ? 'primary' : project.health === 'at_risk' ? 'warning' : 'error'}
                  />
                </Stack>
              </CardContent>
            </Card>

            <StatusDistributionChart tasks={projectTasks} />

            <Card>
              <CardHeader title="Risks and blockers" subheader={`${risks.filter((r) => r.status !== 'resolved').length} open risks · ${blockers.length} blocked items`} />
              <CardContent sx={{ pt: 0, maxHeight: 420, overflowY: 'auto' }}>
                {risks.length === 0 && blockers.length === 0 ? (
                  <EmptyState dense title="Nothing flagged" description="No open risks or blocked work on this project." />
                ) : (
                  <Stack spacing={1.25}>
                    {risks.map((risk) => (
                      <Box key={risk.id} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                          <RiskChip severity={risk.severity} />
                          <Chip size="small" variant="outlined" label={risk.status.replace('_', ' ')} />
                          <Typography variant="caption" color="text.secondary">
                            {userById(risk.ownerId)?.name}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={600}>
                          {risk.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {risk.description}
                        </Typography>
                        <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.5 }}>
                          Mitigation: {risk.mitigation}
                        </Typography>
                      </Box>
                    ))}
                    {blockers.length > 0 ? (
                      <Alert severity="error" sx={{ mt: 0.5 }}>
                        {blockers.length} blocked {blockers.length === 1 ? 'item' : 'items'}:{' '}
                        {blockers.map((task) => task.key).join(', ')}
                      </Alert>
                    ) : null}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'grid', '& > *': { minWidth: 0 }, gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
            <DeadlinesList rows={deadlines} />
            <ActivityFeed activities={activity} title="Project activity" />
          </Box>
        </Box>
      ) : null}

      {activeTab === 'board' ? <BoardPage projectId={project.id} embedded forcedView="board" /> : null}
      {activeTab === 'list' ? <BoardPage projectId={project.id} embedded forcedView="list" /> : null}
      {activeTab === 'calendar' ? <CalendarPage projectId={project.id} embedded /> : null}
      {activeTab === 'timeline' || activeTab === 'roadmap' ? <RoadmapPage projectId={project.id} embedded /> : null}
      {activeTab === 'backlog' ? <BacklogPage projectId={project.id} embedded /> : null}
      {activeTab === 'sprints' ? <SprintsPage projectId={project.id} embedded /> : null}
      {activeTab === 'releases' ? <ReleasesPage projectId={project.id} embedded /> : null}
      {activeTab === 'documents' ? <DocumentsPage projectId={project.id} embedded /> : null}
      {activeTab === 'activity' ? (
        <Box sx={{ maxWidth: 760 }}>
          <ActivityFeed activities={activity} title="All project activity" limit={60} maxHeight={760} />
        </Box>
      ) : null}
    </Box>
  );
}

function DetailRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <Stack direction="row" spacing={1} alignItems="baseline">
      <Typography variant="caption" color="text.secondary" sx={{ width: 120, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

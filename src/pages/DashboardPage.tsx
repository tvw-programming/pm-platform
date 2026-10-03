import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import ListItemButton from '@mui/material/ListItemButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import {
  CircleCheck,
  CircleSlash,
  FolderKanban,
  GanttChartSquare,
  Layers,
  Plus,
  Rocket,
  SquareCheck,
  TriangleAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { ProgressWithLabel } from '@/components/common/ProgressWithLabel';
import { HealthChip, ReleaseStatusChip } from '@/components/common/TokenChip';
import { ProjectProgressChart, StatusDistributionChart, TeamWorkloadChart } from '@/components/dashboard/DashboardCharts';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { DeadlinesList } from '@/components/dashboard/DeadlinesList';
import { AgentOpsStrip } from '@/components/dashboard/AgentOpsStrip';
import { EmptyState } from '@/components/common/States';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useUi } from '@/state/UiProvider';
import { paths } from '@/app/navigation';
import { formatShortDate, percent } from '@/utils/format';
import { isDone, releaseReadiness, taskIsOverdue, upcomingDeadlines } from '@/utils/selectors';

export function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { state, visibleTasks, currentUser, projectById } = useWorkspace();
  const { openCreateTask, openCreateProject, openCreateSprint, openCreateRoadmapItem, openTask } = useUi();

  const metrics = useMemo(() => {
    const activeProjects = state.projects.filter((p) => p.status === 'active');
    const myTasks = visibleTasks.filter((t) => t.assigneeId === currentUser.id);
    const done = visibleTasks.filter(isDone);
    const overdue = visibleTasks.filter(taskIsOverdue);
    const blocked = visibleTasks.filter((t) => t.status === 'blocked');
    const activeSprints = state.sprints.filter((s) => s.status === 'active');
    const upcomingReleases = state.releases.filter((r) => r.status !== 'released' && r.status !== 'cancelled');
    const healthScore = percent(
      state.projects.filter((p) => p.health === 'on_track').length,
      state.projects.filter((p) => p.status !== 'archived').length,
    );
    return {
      activeProjects,
      myOpen: myTasks.filter((t) => !isDone(t)).length,
      doneCount: done.length,
      overdue,
      blocked,
      activeSprints,
      upcomingReleases,
      healthScore,
      completionRate: percent(done.length, visibleTasks.length),
    };
  }, [state.projects, state.sprints, state.releases, visibleTasks, currentUser.id]);

  const deadlines = useMemo(
    () => upcomingDeadlines(visibleTasks, state.milestones, state.releases),
    [visibleTasks, state.milestones, state.releases],
  );

  const atRiskProjects = state.projects.filter((p) => p.health !== 'on_track' && p.status === 'active');

  return (
    <Box>
      <AgentOpsStrip />
      <PageHeader
        title={`Good to see you, ${currentUser.name.split(' ')[0]}`}
        description="A delivery snapshot across every active project in this workspace."
        actions={
          <>
            <Button variant="outlined" color="inherit" startIcon={<FolderKanban size={15} />} onClick={openCreateProject}>
              Create project
            </Button>
            <Button variant="outlined" color="inherit" startIcon={<Layers size={15} />} onClick={() => openCreateSprint()}>
              Plan sprint
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<GanttChartSquare size={15} />}
              onClick={() => openCreateRoadmapItem()}
            >
              Roadmap item
            </Button>
            <Button variant="contained" startIcon={<Plus size={15} />} onClick={() => openCreateTask()}>
              Add task
            </Button>
          </>
        }
      />

      {atRiskProjects.length > 0 ? (
        <Alert severity="warning" icon={<TriangleAlert size={18} />} sx={{ mb: 3 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>
            {atRiskProjects.length} active {atRiskProjects.length === 1 ? 'project needs' : 'projects need'} attention
          </AlertTitle>
          {atRiskProjects.map((project) => project.name).join(', ')} — review risks and blockers before the next
          delivery checkpoint.
        </Alert>
      ) : null}

      {/* Summary cards */}
      <Box
        sx={{
          display: 'grid',
          '& > *': { minWidth: 0 },
          gap: 2,
          mb: 3,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
            xl: 'repeat(7, 1fr)',
          },
        }}
      >
        <MetricCard
          label="Active projects"
          value={metrics.activeProjects.length}
          caption={`${state.projects.length} total in workspace`}
          icon={<FolderKanban size={16} />}
          onClick={() => navigate(paths.projects)}
        />
        <MetricCard
          label="My open work"
          value={metrics.myOpen}
          caption="Assigned and not done"
          icon={<SquareCheck size={16} />}
          tone="info"
          onClick={() => navigate(paths.myWork)}
        />
        <MetricCard
          label="Completed"
          value={metrics.doneCount}
          caption={`${metrics.completionRate}% of all tasks`}
          icon={<CircleCheck size={16} />}
          tone="success"
          progress={metrics.completionRate}
        />
        <MetricCard
          label="Overdue"
          value={metrics.overdue.length}
          caption="Past due and still open"
          icon={<TriangleAlert size={16} />}
          tone={metrics.overdue.length > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          label="Blocked"
          value={metrics.blocked.length}
          caption="Needs an unblock decision"
          icon={<CircleSlash size={16} />}
          tone={metrics.blocked.length > 0 ? 'error' : 'default'}
        />
        <MetricCard
          label="Active sprints"
          value={metrics.activeSprints.length}
          caption={`${metrics.activeSprints.reduce((t, s) => t + s.committedPoints, 0)} points committed`}
          icon={<Layers size={16} />}
          onClick={() => navigate(paths.sprints)}
        />
        <MetricCard
          label="Product health"
          value={`${metrics.healthScore}%`}
          caption="Projects reporting on track"
          icon={<Rocket size={16} />}
          tone={metrics.healthScore >= 70 ? 'success' : metrics.healthScore >= 40 ? 'warning' : 'error'}
          progress={metrics.healthScore}
        />
      </Box>

      {/* Charts */}
      <Box
        sx={{
          display: 'grid',
          '& > *': { minWidth: 0 },
          gap: 2,
          mb: 3,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' },
        }}
      >
        <ProjectProgressChart tasks={visibleTasks} projects={state.projects.filter((p) => p.status !== 'archived')} />
        <StatusDistributionChart tasks={visibleTasks} />
        <TeamWorkloadChart tasks={visibleTasks} users={state.users} teams={state.teams} />
      </Box>

      {/* Lists */}
      <Box
        sx={{
          display: 'grid',
          '& > *': { minWidth: 0 },
          gap: 2,
          mb: 3,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' },
        }}
      >
        <DeadlinesList rows={deadlines} />
        <ActivityFeed activities={state.activities} />
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardHeader title="Blocked work" subheader="Items that need a decision to move" />
          <CardContent sx={{ pt: 0.5, px: 1, flex: 1, overflowY: 'auto', maxHeight: 420 }}>
            {metrics.blocked.length === 0 ? (
              <EmptyState dense title="Nothing blocked" description="Every open item has a clear path forward." />
            ) : (
              <Stack spacing={0.25}>
                {metrics.blocked.map((task) => (
                  <ListItemButton
                    key={task.id}
                    onClick={() => openTask(task.id)}
                    sx={{ borderRadius: 1.5, alignItems: 'flex-start', py: 1 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 550 }}>
                        {task.key} · {task.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {task.blockedReason ?? 'Blocked'}
                      </Typography>
                      <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
                        <Chip size="small" label={projectById(task.projectId)?.key ?? '—'} sx={{ height: 18, fontSize: 10.5 }} />
                        {task.dueDate ? (
                          <Typography variant="caption" color="text.disabled">
                            due {formatShortDate(task.dueDate)}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Box>
                  </ListItemButton>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Releases + project health */}
      <Box sx={{ display: 'grid', '& > *': { minWidth: 0 }, gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
        <Card>
          <CardHeader title="Upcoming releases" subheader="Readiness against the target date" />
          <CardContent sx={{ pt: 0.5 }}>
            {metrics.upcomingReleases.length === 0 ? (
              <EmptyState dense title="No releases in flight" />
            ) : (
              <Stack spacing={2} divider={<Divider flexItem />}>
                {metrics.upcomingReleases.map((release) => (
                  <Box key={release.id}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 0.75 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {release.name} {release.version}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {projectById(release.projectId)?.key} · target {formatShortDate(release.targetDate)}
                        </Typography>
                      </Box>
                      <ReleaseStatusChip status={release.status} />
                    </Stack>
                    <ProgressWithLabel
                      value={releaseReadiness(release)}
                      label="Readiness checks"
                      color={releaseReadiness(release) >= 70 ? 'success' : 'warning'}
                      size="sm"
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Project health" subheader="Progress and reported health" />
          <CardContent sx={{ pt: 0.5 }}>
            <Stack spacing={2} divider={<Divider flexItem />}>
              {state.projects
                .filter((p) => p.status !== 'archived')
                .map((project) => (
                  <Box key={project.id}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 0.75 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {project.key} · {project.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          target {formatShortDate(project.targetReleaseDate)}
                        </Typography>
                      </Box>
                      <HealthChip health={project.health} />
                    </Stack>
                    <ProgressWithLabel
                      value={project.progress}
                      color={project.health === 'on_track' ? 'primary' : project.health === 'at_risk' ? 'warning' : 'error'}
                      size="sm"
                    />
                  </Box>
                ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

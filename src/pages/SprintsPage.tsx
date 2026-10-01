import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import { Pencil, Plus, TriangleAlert } from 'lucide-react';
import type { ID, Sprint } from '@/types/domain';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { SprintStatusChip } from '@/components/common/TokenChip';
import { ProgressWithLabel } from '@/components/common/ProgressWithLabel';
import { BurndownChart, VelocityChart } from '@/components/sprints/SprintCharts';
import { SprintDialog } from '@/components/sprints/SprintDialog';
import { TaskListTable } from '@/components/tasks/TaskListTable';
import { EmptyState } from '@/components/common/States';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useUi } from '@/state/UiProvider';
import { formatShortDate, percent } from '@/utils/format';
import { isDone, sumPoints } from '@/utils/selectors';

interface SprintsPageProps {
  projectId?: ID;
  embedded?: boolean;
}

export function SprintsPage({ projectId, embedded = false }: SprintsPageProps): React.JSX.Element {
  const { state, visibleTasks } = useWorkspace();
  const { openTask } = useUi();
  const [projectFilter, setProjectFilter] = useState<ID | 'all'>(projectId ?? 'all');
  const [sprintDialog, setSprintDialog] = useState<{ open: boolean; sprint?: Sprint }>({ open: false });

  const scopedProjectId = projectId ?? (projectFilter === 'all' ? undefined : projectFilter);

  const sprints = useMemo(
    () =>
      state.sprints
        .filter((sprint) => (scopedProjectId ? sprint.projectId === scopedProjectId : true))
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [state.sprints, scopedProjectId],
  );

  const activeSprints = sprints.filter((sprint) => sprint.status === 'active');
  const [focusSprintId, setFocusSprintId] = useState<ID | null>(null);
  const focusSprint = sprints.find((s) => s.id === focusSprintId) ?? activeSprints[0] ?? sprints[0];

  const focusTasks = useMemo(
    () => (focusSprint ? visibleTasks.filter((task) => task.sprintId === focusSprint.id) : []),
    [visibleTasks, focusSprint],
  );

  const unestimated = focusTasks.filter((task) => task.storyPoints === undefined).length;
  const completedPoints = sumPoints(focusTasks.filter(isDone));
  const plannedPoints = sumPoints(focusTasks);

  return (
    <Box>
      {!embedded ? (
        <PageHeader
          title="Sprints"
          description="Iteration health across the workspace: commitment, completion and the burndown that explains both."
          actions={
            <Button variant="contained" startIcon={<Plus size={15} />} onClick={() => setSprintDialog({ open: true })}>
              Create sprint
            </Button>
          }
        />
      ) : null}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
        {!projectId ? (
          <TextField
            select
            label="Project"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value as ID | 'all')}
            sx={{ width: { xs: '100%', md: 240 } }}
          >
            <MenuItem value="all">All projects</MenuItem>
            {state.projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.key} · {project.name}
              </MenuItem>
            ))}
          </TextField>
        ) : null}
        <TextField
          select
          label="Focus sprint"
          value={focusSprint?.id ?? ''}
          onChange={(e) => setFocusSprintId(e.target.value)}
          sx={{ width: { xs: '100%', md: 240 } }}
          disabled={sprints.length === 0}
        >
          {sprints.map((sprint) => (
            <MenuItem key={sprint.id} value={sprint.id}>
              {sprint.name}
            </MenuItem>
          ))}
        </TextField>
        {embedded ? (
          <Button variant="outlined" color="inherit" startIcon={<Plus size={15} />} onClick={() => setSprintDialog({ open: true })}>
            Create sprint
          </Button>
        ) : null}
      </Stack>

      {sprints.length === 0 ? (
        <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
          <EmptyState
            title="No sprints yet"
            description="Create the first sprint to start tracking commitment and velocity."
            action={
              <Button variant="contained" startIcon={<Plus size={15} />} onClick={() => setSprintDialog({ open: true })}>
                Create sprint
              </Button>
            }
          />
        </Paper>
      ) : (
        <>
          {focusSprint ? (
            <>
              <Box
                sx={{
                  display: 'grid',
                  '& > *': { minWidth: 0 },
                  gap: 2,
                  mb: 3,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                }}
              >
                <MetricCard
                  label="Planned points"
                  value={plannedPoints}
                  caption={`Capacity ${focusSprint.capacityPoints}`}
                  progress={percent(plannedPoints, focusSprint.capacityPoints)}
                  tone={plannedPoints > focusSprint.capacityPoints ? 'error' : 'default'}
                />
                <MetricCard
                  label="Completed points"
                  value={completedPoints}
                  caption={`${percent(completedPoints, plannedPoints)}% of plan`}
                  tone="success"
                  progress={percent(completedPoints, plannedPoints)}
                />
                <MetricCard label="Items in sprint" value={focusTasks.length} caption={`${focusTasks.filter(isDone).length} done`} />
                <MetricCard
                  label="Unestimated"
                  value={unestimated}
                  caption="Needs sizing"
                  tone={unestimated > 0 ? 'warning' : 'default'}
                />
              </Box>

              {unestimated > 0 ? (
                <Alert severity="warning" icon={<TriangleAlert size={16} />} sx={{ mb: 2.5 }}>
                  {unestimated} {unestimated === 1 ? 'item has' : 'items have'} no estimate in {focusSprint.name}. The
                  burndown and capacity figures understate the real commitment until they are sized.
                </Alert>
              ) : null}

              <Box
                sx={{
                  display: 'grid',
                  '& > *': { minWidth: 0 },
                  gap: 2,
                  mb: 3,
                  gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
                }}
              >
                <BurndownChart sprint={focusSprint} tasks={focusTasks} />
                <VelocityChart sprints={sprints} tasks={visibleTasks} />
              </Box>

              <Card sx={{ mb: 3 }}>
                <CardHeader
                  title={`${focusSprint.name} — work in this sprint`}
                  subheader={focusSprint.goal}
                  action={
                    <Tooltip title="Edit sprint">
                      <IconButton onClick={() => setSprintDialog({ open: true, sprint: focusSprint })} aria-label="Edit sprint">
                        <Pencil size={16} />
                      </IconButton>
                    </Tooltip>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  <TaskListTable tasks={focusTasks} onOpenTask={openTask} showProject={!projectId} height={480} />
                </CardContent>
              </Card>
            </>
          ) : null}

          <Typography variant="h4" component="h2" sx={{ mb: 1.5 }}>
            All sprints
          </Typography>
          <Box
            sx={{
              display: 'grid',
              '& > *': { minWidth: 0 },
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' },
            }}
          >
            {sprints.map((sprint) => {
              const sprintTasks = visibleTasks.filter((task) => task.sprintId === sprint.id);
              const planned = sumPoints(sprintTasks);
              const done = sumPoints(sprintTasks.filter(isDone));
              return (
                <Card key={sprint.id}>
                  <CardContent sx={{ p: 2.25 }}>
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" noWrap>
                          {sprint.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatShortDate(sprint.startDate)} – {formatShortDate(sprint.endDate)}
                        </Typography>
                      </Box>
                      <SprintStatusChip status={sprint.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, minHeight: 40 }}>
                      {sprint.goal}
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.25 }}>
                      <Chip size="small" label={`${sprintTasks.length} items`} />
                      <Chip size="small" label={`${planned} pts planned`} />
                      <Chip size="small" variant="outlined" label={`${done} pts done`} />
                    </Stack>
                    <ProgressWithLabel
                      value={percent(done, planned)}
                      label="Completion"
                      color={sprint.status === 'completed' ? 'success' : 'primary'}
                      size="sm"
                    />
                    <Button size="small" sx={{ mt: 1.5 }} onClick={() => setFocusSprintId(sprint.id)}>
                      Focus this sprint
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </>
      )}

      {sprintDialog.open ? (
        <SprintDialog
          open
          onClose={() => setSprintDialog({ open: false })}
          defaultProjectId={scopedProjectId}
          sprint={sprintDialog.sprint}
        />
      ) : null}
    </Box>
  );
}

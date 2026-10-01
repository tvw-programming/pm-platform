import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { ID } from '@/types/domain';
import { chartPalette, priorityTokens } from '@/app/tokens';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { ChartCard, useChartTheme } from '@/components/common/ChartCard';
import { ProjectProgressChart, StatusDistributionChart, TeamWorkloadChart } from '@/components/dashboard/DashboardCharts';
import { BurndownChart, VelocityChart } from '@/components/sprints/SprintCharts';
import { ProgressWithLabel } from '@/components/common/ProgressWithLabel';
import { EmptyState } from '@/components/common/States';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useToast } from '@/state/ToastProvider';
import { formatShortDate, percent } from '@/utils/format';
import { countByPriority, flowMetrics, isDone, taskIsOverdue, workloadByUser, releaseReadiness } from '@/utils/selectors';

export function ReportsPage(): React.JSX.Element {
  const { state, visibleTasks, projectById } = useWorkspace();
  const { notify } = useToast();
  const chart = useChartTheme();

  const [from, setFrom] = useState(format(subDays(new Date(), 90), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [projectIds, setProjectIds] = useState<ID[]>([]);
  const [teamId, setTeamId] = useState<ID | 'all'>('all');
  const [assigneeIds, setAssigneeIds] = useState<ID[]>([]);

  const tasks = useMemo(() => {
    const teamMembers = teamId === 'all' ? null : new Set(state.teams.find((t) => t.id === teamId)?.memberIds ?? []);
    return visibleTasks.filter((task) => {
      if (projectIds.length > 0 && !projectIds.includes(task.projectId)) return false;
      if (assigneeIds.length > 0 && (!task.assigneeId || !assigneeIds.includes(task.assigneeId))) return false;
      if (teamMembers && (!task.assigneeId || !teamMembers.has(task.assigneeId))) return false;
      // Date range applies to the created/updated window so the report has a
      // defensible period rather than silently covering all history.
      const stamp = task.completedAt ?? task.updatedAt;
      return stamp.slice(0, 10) >= from && stamp.slice(0, 10) <= to;
    });
  }, [visibleTasks, projectIds, assigneeIds, teamId, state.teams, from, to]);

  const projects = useMemo(
    () => state.projects.filter((p) => (projectIds.length > 0 ? projectIds.includes(p.id) : p.status !== 'archived')),
    [state.projects, projectIds],
  );

  const scopedSprints = useMemo(
    () => state.sprints.filter((sprint) => (projectIds.length > 0 ? projectIds.includes(sprint.projectId) : true)),
    [state.sprints, projectIds],
  );
  const focusSprint = scopedSprints.find((s) => s.status === 'active') ?? scopedSprints.at(-1);

  const flow = useMemo(() => flowMetrics(tasks, projects), [tasks, projects]);
  const workload = useMemo(() => workloadByUser(tasks, state.users), [tasks, state.users]);
  const priorities = useMemo(() => countByPriority(tasks), [tasks]);

  const completionTrend = useMemo(() => {
    const byWeek = new Map<string, { completed: number; created: number }>();
    for (const task of tasks) {
      const createdWeek = task.createdAt.slice(0, 10);
      const bucket = byWeek.get(createdWeek) ?? { completed: 0, created: 0 };
      bucket.created += 1;
      byWeek.set(createdWeek, bucket);
      if (task.completedAt) {
        const doneWeek = task.completedAt.slice(0, 10);
        const doneBucket = byWeek.get(doneWeek) ?? { completed: 0, created: 0 };
        doneBucket.completed += 1;
        byWeek.set(doneWeek, doneBucket);
      }
    }
    return [...byWeek.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, value]) => ({ date, ...value }));
  }, [tasks]);

  const overdue = tasks.filter(taskIsOverdue);
  const blocked = tasks.filter((task) => task.status === 'blocked');
  const done = tasks.filter(isDone);

  const exportCsv = (): void => {
    const header = ['Key', 'Title', 'Project', 'Type', 'Status', 'Priority', 'Assignee', 'Points', 'Due', 'Completed'];
    const lines = tasks.map((task) =>
      [
        task.key,
        `"${task.title.replace(/"/g, '""')}"`,
        projectById(task.projectId)?.key ?? '',
        task.type,
        task.status,
        task.priority,
        state.users.find((u) => u.id === task.assigneeId)?.name ?? '',
        task.storyPoints ?? '',
        task.dueDate ?? '',
        task.completedAt?.slice(0, 10) ?? '',
      ].join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `meridian-report-${from}-to-${to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${tasks.length} rows`, { severity: 'success' });
  };

  const noData = tasks.length === 0;

  return (
    <Box>
      <PageHeader
        title="Reports & analytics"
        description="Delivery analytics across projects, sprints, teams and releases for the selected period."
        actions={
          <Button variant="outlined" color="inherit" startIcon={<Download size={15} />} onClick={exportCsv} disabled={noData}>
            Export CSV
          </Button>
        }
      />

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ mb: 3 }} alignItems={{ lg: 'center' }}>
        <TextField
          label="From"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: { xs: '100%', lg: 160 } }}
        />
        <TextField
          label="To"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: { xs: '100%', lg: 160 } }}
        />
        <Autocomplete
          multiple
          size="small"
          options={state.projects}
          getOptionLabel={(option) => `${option.key} · ${option.name}`}
          value={state.projects.filter((p) => projectIds.includes(p.id))}
          onChange={(_, value) => setProjectIds(value.map((v) => v.id))}
          renderValue={(value, getItemProps) =>
            value.map((option, index) => {
              const { key, ...itemProps } = getItemProps({ index });
              return <Chip key={key} size="small" label={option.key} {...itemProps} />;
            })
          }
          renderInput={(params) => <TextField {...params} label="Projects" placeholder="All" />}
          sx={{ width: { xs: '100%', lg: 230 } }}
        />
        <TextField
          select
          label="Team"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value as ID | 'all')}
          sx={{ width: { xs: '100%', lg: 180 } }}
        >
          <MenuItem value="all">All teams</MenuItem>
          {state.teams.map((team) => (
            <MenuItem key={team.id} value={team.id}>
              {team.name}
            </MenuItem>
          ))}
        </TextField>
        <Autocomplete
          multiple
          size="small"
          options={state.users}
          getOptionLabel={(option) => option.name}
          value={state.users.filter((u) => assigneeIds.includes(u.id))}
          onChange={(_, value) => setAssigneeIds(value.map((v) => v.id))}
          renderValue={(value, getItemProps) =>
            value.map((option, index) => {
              const { key, ...itemProps } = getItemProps({ index });
              return <Chip key={key} size="small" label={option.initials} {...itemProps} />;
            })
          }
          renderInput={(params) => <TextField {...params} label="Assignees" placeholder="Anyone" />}
          sx={{ width: { xs: '100%', lg: 220 } }}
        />
      </Stack>

      {noData ? (
        <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
          <EmptyState
            title="No data in this period"
            description="Widen the date range or clear a filter — nothing was created, updated or completed in the selected window."
          />
        </Paper>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              '& > *': { minWidth: 0 },
              gap: 2,
              mb: 3,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
            }}
          >
            <MetricCard label="Tasks in period" value={tasks.length} caption={`${formatShortDate(from)} – ${formatShortDate(to)}`} />
            <MetricCard label="Completed" value={done.length} caption={`${percent(done.length, tasks.length)}% completion`} tone="success" progress={percent(done.length, tasks.length)} />
            <MetricCard label="Overdue" value={overdue.length} caption="Open past due date" tone={overdue.length ? 'warning' : 'default'} />
            <MetricCard label="Blocked" value={blocked.length} caption="Needs an unblock" tone={blocked.length ? 'error' : 'default'} />
            <MetricCard
              label="Avg cycle time"
              value={`${flow.length ? (flow.reduce((t, f) => t + f.cycleTimeDays, 0) / flow.length).toFixed(1) : 0}d`}
              caption="Start to done"
            />
          </Box>

          <Box sx={{ display: 'grid', '& > *': { minWidth: 0 }, gap: 2, mb: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' } }}>
            <ProjectProgressChart tasks={tasks} projects={projects} />
            <StatusDistributionChart tasks={tasks} />
            <TeamWorkloadChart tasks={tasks} users={state.users} teams={state.teams} />
          </Box>

          <Box sx={{ display: 'grid', '& > *': { minWidth: 0 }, gap: 2, mb: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
            <VelocityChart sprints={scopedSprints} tasks={visibleTasks} />
            <BurndownChart sprint={focusSprint} tasks={visibleTasks} />
          </Box>

          <Box sx={{ display: 'grid', '& > *': { minWidth: 0 }, gap: 2, mb: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
            <ChartCard
              title="Cycle and lead time by project"
              subheader="Average days, completed work only"
              summary={flow.map((row) => `${row.label}: cycle ${row.cycleTimeDays}d, lead ${row.leadTimeDays}d`).join('; ')}
              empty={flow.every((row) => row.completed === 0)}
              height={280}
            >
              <BarChart data={flow} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barSize={16}>
                <CartesianGrid stroke={chart.gridStroke} vertical={false} />
                <XAxis dataKey="label" tick={chart.tickStyle} stroke={chart.axisStroke} />
                <YAxis tick={chart.tickStyle} stroke={chart.axisStroke} />
                <Tooltip contentStyle={chart.tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="cycleTimeDays" name="Cycle time (days)" fill={chartPalette[0]} radius={[3, 3, 0, 0]} />
                <Bar dataKey="leadTimeDays" name="Lead time (days)" fill={chartPalette[1]} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard
              title="Created vs completed"
              subheader="Daily flow across the selected period"
              summary={`${completionTrend.reduce((t, r) => t + r.created, 0)} created and ${completionTrend.reduce((t, r) => t + r.completed, 0)} completed across ${completionTrend.length} active days.`}
              empty={completionTrend.length === 0}
              height={280}
            >
              <LineChart data={completionTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={chart.gridStroke} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={chart.tickStyle}
                  stroke={chart.axisStroke}
                  tickFormatter={(value: string) => formatShortDate(value)}
                />
                <YAxis tick={chart.tickStyle} stroke={chart.axisStroke} allowDecimals={false} />
                <Tooltip contentStyle={chart.tooltipStyle} labelFormatter={(value) => formatShortDate(String(value ?? ''))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="created" name="Created" stroke={chartPalette[2]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke={chartPalette[0]} strokeWidth={2} dot={false} />
              </LineChart>
            </ChartCard>
          </Box>

          <Box sx={{ display: 'grid', '& > *': { minWidth: 0 }, gap: 2, mb: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
            <ChartCard
              title="Open work by priority"
              subheader="Where attention is concentrated"
              summary={Object.entries(priorities)
                .map(([key, value]) => `${priorityTokens[key as keyof typeof priorityTokens].label}: ${value}`)
                .join(', ')}
              height={260}
            >
              <BarChart
                data={Object.entries(priorities).map(([key, value]) => ({
                  name: priorityTokens[key as keyof typeof priorityTokens].label,
                  value,
                  color: priorityTokens[key as keyof typeof priorityTokens].color,
                }))}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 10, bottom: 0 }}
                barSize={18}
              >
                <CartesianGrid stroke={chart.gridStroke} horizontal={false} />
                <XAxis type="number" tick={chart.tickStyle} stroke={chart.axisStroke} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={chart.tickStyle} stroke={chart.axisStroke} width={70} />
                <Tooltip contentStyle={chart.tooltipStyle} />
                <Bar dataKey="value" name="Tasks" radius={[0, 3, 3, 0]}>
                  {Object.entries(priorities).map(([key]) => (
                    <Cell key={key} fill={priorityTokens[key as keyof typeof priorityTokens].color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartCard>

            <Card>
              <CardHeader title="Release readiness" subheader="Active and planned releases" />
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={2}>
                  {state.releases
                    .filter((release) => release.status !== 'released' && release.status !== 'cancelled')
                    .map((release) => (
                      <Box key={release.id}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {release.name} {release.version}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatShortDate(release.targetDate)}
                          </Typography>
                        </Stack>
                        <ProgressWithLabel
                          value={releaseReadiness(release)}
                          size="sm"
                          color={releaseReadiness(release) >= 70 ? 'success' : 'warning'}
                        />
                      </Box>
                    ))}
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Team member</TableCell>
                  <TableCell align="right">Open tasks</TableCell>
                  <TableCell align="right">Points</TableCell>
                  <TableCell align="right">Overdue</TableCell>
                  <TableCell align="right">Allocated / capacity</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Utilisation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workload.map((row) => (
                  <TableRow key={row.userId} hover>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="right">{row.openTasks}</TableCell>
                    <TableCell align="right">{row.points}</TableCell>
                    <TableCell align="right">{row.overdue}</TableCell>
                    <TableCell align="right">
                      {row.allocated}h / {row.capacity}h
                    </TableCell>
                    <TableCell>
                      <ProgressWithLabel
                        value={row.utilisation}
                        size="sm"
                        color={row.utilisation > 100 ? 'error' : row.utilisation > 85 ? 'warning' : 'primary'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

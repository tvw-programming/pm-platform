import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TASK_STATUSES, type Task, type Project, type Team, type User } from '@/types/domain';
import { chartPalette, taskStatusTokens } from '@/app/tokens';
import { ChartCard, useChartTheme } from '@/components/common/ChartCard';
import { countByStatus, projectStats, teamWorkload } from '@/utils/selectors';

interface ChartProps {
  tasks: Task[];
  projects: Project[];
}

export function ProjectProgressChart({ tasks, projects }: ChartProps): React.JSX.Element {
  const chart = useChartTheme();
  const data = useMemo(
    () =>
      projects.map((project) => {
        const stats = projectStats(tasks, project.id);
        return {
          name: project.key,
          fullName: project.name,
          done: stats.done,
          remaining: Math.max(0, stats.total - stats.done),
          progress: stats.progress,
        };
      }),
    [tasks, projects],
  );

  const summary = data.length
    ? `Completion by project: ${data.map((row) => `${row.name} ${row.progress}%`).join(', ')}.`
    : 'No projects to chart.';

  return (
    <ChartCard
      title="Project progress"
      subheader="Completed vs remaining tasks per project"
      summary={summary}
      empty={data.length === 0}
      height={290}
    >
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barSize={22}>
        <CartesianGrid stroke={chart.gridStroke} vertical={false} />
        <XAxis dataKey="name" tick={chart.tickStyle} stroke={chart.axisStroke} />
        <YAxis tick={chart.tickStyle} stroke={chart.axisStroke} allowDecimals={false} />
        <Tooltip
          contentStyle={chart.tooltipStyle}
          labelFormatter={(label) => data.find((row) => row.name === label)?.fullName ?? String(label ?? '')}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="done" stackId="a" name="Completed" fill={chartPalette[0]} radius={[0, 0, 3, 3]} />
        <Bar dataKey="remaining" stackId="a" name="Remaining" fill={chartPalette[2]} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}

export function StatusDistributionChart({ tasks }: { tasks: Task[] }): React.JSX.Element {
  const chart = useChartTheme();
  const counts = useMemo(() => countByStatus(tasks), [tasks]);
  const data = TASK_STATUSES.map((status) => ({
    name: taskStatusTokens[status].label,
    value: counts[status],
    color: taskStatusTokens[status].color,
  })).filter((row) => row.value > 0);

  const total = tasks.length;
  const summary = data.length
    ? `${total} tasks: ${data.map((row) => `${row.name} ${row.value}`).join(', ')}.`
    : 'No tasks to chart.';

  return (
    <ChartCard
      title="Task status distribution"
      subheader={`${total} tasks in scope`}
      summary={summary}
      empty={data.length === 0}
      height={290}
    >
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="52%"
          outerRadius="80%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((row) => (
            <Cell key={row.name} fill={row.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={chart.tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ChartCard>
  );
}

interface WorkloadChartProps {
  tasks: Task[];
  users: User[];
  teams: Team[];
}

export function TeamWorkloadChart({ tasks, users, teams }: WorkloadChartProps): React.JSX.Element {
  const chart = useChartTheme();
  const data = useMemo(() => teamWorkload(tasks, users, teams), [tasks, users, teams]);

  const summary = data.length
    ? `Open work by team: ${data.map((row) => `${row.team} ${row.open} tasks / ${row.points} points`).join(', ')}.`
    : 'No teams to chart.';

  return (
    <ChartCard
      title="Team workload"
      subheader="Open tasks and story points by team"
      summary={summary}
      empty={data.length === 0}
      height={290}
    >
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barSize={16}>
        <CartesianGrid stroke={chart.gridStroke} vertical={false} />
        <XAxis dataKey="team" tick={chart.tickStyle} stroke={chart.axisStroke} />
        <YAxis tick={chart.tickStyle} stroke={chart.axisStroke} allowDecimals={false} />
        <Tooltip contentStyle={chart.tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="open" name="Open tasks" fill={chartPalette[0]} radius={[3, 3, 0, 0]} />
        <Bar dataKey="points" name="Story points" fill={chartPalette[1]} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import type { Sprint, Task } from '@/types/domain';
import { chartPalette } from '@/app/tokens';
import { ChartCard, useChartTheme } from '@/components/common/ChartCard';
import { burndownSeries, velocitySeries } from '@/utils/selectors';
import { formatShortDate } from '@/utils/format';

export function VelocityChart({
  sprints,
  tasks,
  height = 260,
}: {
  sprints: Sprint[];
  tasks: Task[];
  height?: number;
}): React.JSX.Element {
  const chart = useChartTheme();
  const data = useMemo(() => velocitySeries(sprints, tasks), [sprints, tasks]);
  const average = data.length ? Math.round(data.reduce((t, row) => t + row.completed, 0) / data.length) : 0;

  return (
    <ChartCard
      title="Sprint velocity"
      subheader={`Average ${average} points completed per sprint`}
      summary={
        data.length
          ? `Committed versus completed points: ${data.map((row) => `${row.sprintName} ${row.completed} of ${row.committed}`).join(', ')}.`
          : 'No completed sprints yet.'
      }
      empty={data.length === 0}
      height={height}
    >
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barSize={16}>
        <CartesianGrid stroke={chart.gridStroke} vertical={false} />
        <XAxis dataKey="sprintName" tick={chart.tickStyle} stroke={chart.axisStroke} />
        <YAxis tick={chart.tickStyle} stroke={chart.axisStroke} allowDecimals={false} />
        <Tooltip contentStyle={chart.tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="committed" name="Committed" fill={chartPalette[2]} radius={[3, 3, 0, 0]} />
        <Bar dataKey="completed" name="Completed" fill={chartPalette[0]} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}

export function BurndownChart({
  sprint,
  tasks,
  height = 260,
}: {
  sprint?: Sprint;
  tasks: Task[];
  height?: number;
}): React.JSX.Element {
  const chart = useChartTheme();
  const data = useMemo(() => (sprint ? burndownSeries(sprint, tasks) : []), [sprint, tasks]);
  const latest = [...data].reverse().find((row) => !Number.isNaN(row.remaining));

  return (
    <ChartCard
      title="Burndown"
      subheader={sprint ? `${sprint.name} · ${formatShortDate(sprint.startDate)} – ${formatShortDate(sprint.endDate)}` : 'No sprint selected'}
      summary={
        sprint && latest
          ? `${latest.remaining} points remaining against an ideal of ${latest.ideal} at this point in ${sprint.name}.`
          : 'No burndown data for the selected sprint.'
      }
      empty={data.length === 0}
      height={height}
    >
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
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
        <Line
          type="monotone"
          dataKey="ideal"
          name="Ideal"
          stroke={chart.axisStroke}
          strokeDasharray="4 4"
          dot={false}
          strokeWidth={1.5}
        />
        <Line
          type="monotone"
          dataKey="remaining"
          name="Remaining"
          stroke={chartPalette[0]}
          strokeWidth={2.5}
          dot={{ r: 2.5 }}
          connectNulls={false}
        />
      </LineChart>
    </ChartCard>
  );
}

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { TaskListTable } from '@/components/tasks/TaskListTable';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { DeadlinesList } from '@/components/dashboard/DeadlinesList';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useUi } from '@/state/UiProvider';
import { isDone, taskIsOverdue, upcomingDeadlines, sumPoints } from '@/utils/selectors';

type MyWorkTab = 'open' | 'overdue' | 'blocked' | 'reported' | 'done';

export function MyWorkPage(): React.JSX.Element {
  const { state, visibleTasks, currentUser } = useWorkspace();
  const { openTask, openCreateTask } = useUi();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as MyWorkTab | null) ?? 'open';

  const mine = useMemo(() => visibleTasks.filter((task) => task.assigneeId === currentUser.id), [visibleTasks, currentUser.id]);
  const reported = useMemo(
    () => visibleTasks.filter((task) => task.reporterId === currentUser.id && task.assigneeId !== currentUser.id),
    [visibleTasks, currentUser.id],
  );

  const buckets = useMemo(
    () => ({
      open: mine.filter((task) => !isDone(task)),
      overdue: mine.filter(taskIsOverdue),
      blocked: mine.filter((task) => task.status === 'blocked'),
      reported,
      done: mine.filter(isDone),
    }),
    [mine, reported],
  );

  const myActivity = useMemo(
    () => state.activities.filter((activity) => activity.actorId === currentUser.id),
    [state.activities, currentUser.id],
  );

  const myDeadlines = useMemo(
    () => upcomingDeadlines(buckets.open, [], []),
    [buckets.open],
  );

  return (
    <Box>
      <PageHeader
        title="My work"
        description={`Everything assigned to you across projects, ${currentUser.jobTitle.toLowerCase()}.`}
        actions={
          <Button variant="contained" startIcon={<Plus size={15} />} onClick={() => openCreateTask({ })}>
            Add task
          </Button>
        }
      />

      <Box
        sx={{
          display: 'grid',
          '& > *': { minWidth: 0 },
          gap: 2,
          mb: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        }}
      >
        <MetricCard label="Open items" value={buckets.open.length} caption={`${sumPoints(buckets.open)} story points`} />
        <MetricCard
          label="Overdue"
          value={buckets.overdue.length}
          caption="Past the due date"
          tone={buckets.overdue.length > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          label="Blocked"
          value={buckets.blocked.length}
          caption="Waiting on something"
          tone={buckets.blocked.length > 0 ? 'error' : 'default'}
        />
        <MetricCard
          label="Completed"
          value={buckets.done.length}
          caption="All time"
          tone="success"
        />
      </Box>

      <Tabs
        value={tab}
        onChange={(_, value: MyWorkTab) => setParams({ tab: value })}
        sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab value="open" label={`Open (${buckets.open.length})`} />
        <Tab value="overdue" label={`Overdue (${buckets.overdue.length})`} />
        <Tab value="blocked" label={`Blocked (${buckets.blocked.length})`} />
        <Tab value="reported" label={`Reported by me (${buckets.reported.length})`} />
        <Tab value="done" label={`Done (${buckets.done.length})`} />
      </Tabs>

      <Box sx={{ mb: 3 }}>
        <TaskListTable tasks={buckets[tab]} onOpenTask={openTask} height={520} />
      </Box>

      <Box sx={{ display: 'grid', '& > *': { minWidth: 0 }, gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
        <DeadlinesList rows={myDeadlines} />
        <ActivityFeed activities={myActivity} title="My recent activity" />
      </Box>
    </Box>
  );
}

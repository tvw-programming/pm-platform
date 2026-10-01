import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { Plus } from 'lucide-react';
import type { ID, Task, TaskStatus } from '@/types/domain';
import { priorityTokens, taskTypeTokens } from '@/app/tokens';
import { PageHeader } from '@/components/common/PageHeader';
import { TaskFilterBar, type BoardView } from '@/components/common/TaskFilterBar';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TaskListTable } from '@/components/tasks/TaskListTable';
import { CalendarPage } from './CalendarPage';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useUi } from '@/state/UiProvider';
import { useTaskFilters } from '@/hooks/useTaskFilters';

interface BoardPageProps {
  projectId?: ID;
  embedded?: boolean;
  /** Fixes the view so the project workspace tabs own the switching. */
  forcedView?: BoardView;
}

export function BoardPage({ projectId, embedded = false, forcedView }: BoardPageProps): React.JSX.Element {
  const { state, dispatch, visibleTasks, currentUser, userById } = useWorkspace();
  const { openTask, openCreateTask } = useUi();
  const [view, setView] = useState<BoardView>(forcedView ?? 'board');
  const [projectFilter, setProjectFilter] = useState<ID | 'all'>(projectId ?? 'all');

  const scopedProjectId = projectId ?? (projectFilter === 'all' ? undefined : projectFilter);
  const activeView = forcedView ?? view;

  const { filters, setFilter, reset, activeCount, apply } = useTaskFilters(
    { sort: 'rank', group: 'none' },
    currentUser.id,
  );

  const scopedTasks = useMemo(
    () =>
      visibleTasks.filter((task) => {
        if (scopedProjectId && task.projectId !== scopedProjectId) return false;
        return task.type !== 'epic';
      }),
    [visibleTasks, scopedProjectId],
  );

  const tasks = useMemo(() => apply(scopedTasks), [apply, scopedTasks]);

  const groups = useMemo(() => {
    if (filters.group === 'none') return null;
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      let label: string;
      switch (filters.group) {
        case 'assignee':
          label = userById(task.assigneeId)?.name ?? 'Unassigned';
          break;
        case 'priority':
          label = priorityTokens[task.priority].label;
          break;
        case 'type':
          label = taskTypeTokens[task.type].label;
          break;
        case 'epic':
          label = state.tasks.find((t) => t.id === task.epicId)?.title ?? 'No epic';
          break;
        default:
          label = 'All';
      }
      const bucket = map.get(label);
      if (bucket) bucket.push(task);
      else map.set(label, [task]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filters.group, tasks, userById, state.tasks]);

  const addTask = (status: TaskStatus): void => {
    openCreateTask({ projectId: scopedProjectId ?? state.projects[0]!.id, status });
  };

  return (
    <Box>
      {!embedded ? (
        <PageHeader
          title="Board"
          description="Drag work across the flow, or switch to the list and calendar views of the same filtered set."
          actions={
            <Button variant="contained" startIcon={<Plus size={15} />} onClick={() => addTask('todo')}>
              Add task
            </Button>
          }
        />
      ) : null}

      <TaskFilterBar
        filters={filters}
        setFilter={setFilter}
        reset={reset}
        activeCount={activeCount}
        view={forcedView ? undefined : activeView}
        onViewChange={forcedView ? undefined : setView}
        showProjectFilter={!projectId}
        showSprintFilter
        rightSlot={
          projectId ? undefined : (
            <TextField
              select
              label="Project scope"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value as ID | 'all')}
              sx={{ width: { xs: '100%', md: 200 } }}
            >
              <MenuItem value="all">All projects</MenuItem>
              {state.projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.key} · {project.name}
                </MenuItem>
              ))}
            </TextField>
          )
        }
      />

      {activeView === 'board' ? (
        groups ? (
          <Stack spacing={3} divider={<Divider flexItem />}>
            {groups.map(([label, groupTasks]) => (
              <Box key={label}>
                <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
                  {label}{' '}
                  <Typography component="span" variant="body2" color="text.secondary">
                    ({groupTasks.length})
                  </Typography>
                </Typography>
                <KanbanBoard
                  tasks={groupTasks}
                  columns={state.boardColumns}
                  onOpenTask={openTask}
                  onAddTask={addTask}
                />
              </Box>
            ))}
          </Stack>
        ) : (
          <KanbanBoard
            tasks={tasks}
            columns={state.boardColumns}
            onOpenTask={openTask}
            onAddTask={addTask}
            onAddColumn={(status) => dispatch({ type: 'board/addColumn', status })}
          />
        )
      ) : null}

      {activeView === 'list' ? (
        <TaskListTable tasks={tasks} onOpenTask={openTask} showProject={!projectId} />
      ) : null}

      {activeView === 'calendar' ? <CalendarPage projectId={scopedProjectId} embedded /> : null}
    </Box>
  );
}

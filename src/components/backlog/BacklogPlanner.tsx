import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha } from '@mui/material/styles';
import { ChevronRight, GripVertical, Pencil, Plus, TriangleAlert } from 'lucide-react';
import type { ID, Sprint, Task } from '@/types/domain';
import { sprintStatusTokens } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useToast } from '@/state/ToastProvider';
import { PriorityChip, SprintStatusChip, TypeChip } from '@/components/common/TokenChip';
import { UserAvatar } from '@/components/common/UserAvatar';
import { EmptyState } from '@/components/common/States';
import { formatShortDate } from '@/utils/format';
import { sumPoints } from '@/utils/selectors';

const BACKLOG_DROPPABLE = 'backlog';

interface BacklogPlannerProps {
  /** Backlog items (no sprint assigned) already filtered and sorted. */
  backlogTasks: Task[];
  sprints: Sprint[];
  allTasks: Task[];
  onOpenTask: (taskId: ID) => void;
  onAddTask: () => void;
  onCreateSprint: () => void;
  onEditSprint: (sprint: Sprint) => void;
}

export function BacklogPlanner({
  backlogTasks,
  sprints,
  allTasks,
  onOpenTask,
  onAddTask,
  onCreateSprint,
  onEditSprint,
}: BacklogPlannerProps): React.JSX.Element {
  const { dispatch } = useWorkspace();
  const { notify } = useToast();
  const [activeId, setActiveId] = useState<ID | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const tasksBySprint = useMemo(() => {
    const map = new Map<ID, Task[]>();
    for (const sprint of sprints) {
      map.set(
        sprint.id,
        allTasks.filter((task) => task.sprintId === sprint.id).sort((a, b) => a.rank - b.rank),
      );
    }
    return map;
  }, [sprints, allTasks]);

  const activeTask = [...backlogTasks, ...allTasks].find((task) => task.id === activeId);

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = String(active.id);
    const task = allTasks.find((t) => t.id === taskId) ?? backlogTasks.find((t) => t.id === taskId);
    if (!task) return;

    const overId = String(over.id);
    const targetSprintId = sprints.some((s) => s.id === overId)
      ? overId
      : overId === BACKLOG_DROPPABLE
        ? undefined
        : (allTasks.find((t) => t.id === overId)?.sprintId ?? undefined);

    if (targetSprintId === task.sprintId) {
      const targetTask = allTasks.find((t) => t.id === overId);
      if (targetTask) {
        dispatch({ type: 'task/reorder', taskId, status: task.status, rank: targetTask.rank - 1 });
      }
      return;
    }

    const previousSprintId = task.sprintId;
    dispatch({ type: 'task/assignSprint', taskId, sprintId: targetSprintId });
    notify(
      targetSprintId
        ? `${task.key} moved into ${sprints.find((s) => s.id === targetSprintId)?.name ?? 'sprint'}`
        : `${task.key} returned to the backlog`,
      {
        actionLabel: 'Undo',
        onAction: () => dispatch({ type: 'task/assignSprint', taskId, sprintId: previousSprintId }),
      },
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up ${active.id}. Arrow keys move between sprints, space drops.`,
          onDragOver: ({ active, over }) => (over ? `${active.id} is over ${over.id}.` : undefined),
          onDragEnd: ({ active, over }) =>
            over ? `${active.id} dropped on ${over.id}.` : `${active.id} returned to its original place.`,
          onDragCancel: ({ active }) => `Dragging ${active.id} cancelled.`,
        },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          '& > *': { minWidth: 0 },
          gap: 2,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        {/* Backlog column */}
        <BacklogColumn
          tasks={backlogTasks}
          onOpenTask={onOpenTask}
          onAddTask={onAddTask}
          activeId={activeId}
        />

        {/* Sprints column */}
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h4" component="h2">
              Sprints
            </Typography>
            <Button size="small" startIcon={<Plus size={14} />} onClick={onCreateSprint}>
              Create sprint
            </Button>
          </Stack>
          {sprints.length === 0 ? (
            <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
              <EmptyState
                title="No sprints yet"
                description="Create a sprint to start pulling work out of the backlog."
                action={
                  <Button variant="contained" size="small" startIcon={<Plus size={14} />} onClick={onCreateSprint}>
                    Create sprint
                  </Button>
                }
              />
            </Paper>
          ) : (
            sprints.map((sprint) => (
              <SprintDropZone
                key={sprint.id}
                sprint={sprint}
                tasks={tasksBySprint.get(sprint.id) ?? []}
                onOpenTask={onOpenTask}
                onEditSprint={onEditSprint}
                activeId={activeId}
              />
            ))
          )}
        </Stack>
      </Box>

      <DragOverlay>
        {activeTask ? (
          <Paper variant="outlined" sx={{ p: 1, width: 320, borderRadius: 2, boxShadow: 8 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {activeTask.key} · {activeTask.title}
            </Typography>
          </Paper>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function BacklogColumn({
  tasks,
  onOpenTask,
  onAddTask,
  activeId,
}: {
  tasks: Task[];
  onOpenTask: (taskId: ID) => void;
  onAddTask: () => void;
  activeId: ID | null;
}): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: BACKLOG_DROPPABLE });
  const unestimated = tasks.filter((task) => task.storyPoints === undefined).length;

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="baseline">
          <Typography variant="h4" component="h2">
            Backlog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tasks.length} items · {sumPoints(tasks)} pts
          </Typography>
        </Stack>
        <Button size="small" startIcon={<Plus size={14} />} onClick={onAddTask}>
          Add item
        </Button>
      </Stack>

      {unestimated > 0 ? (
        <Alert severity="warning" icon={<TriangleAlert size={16} />}>
          {unestimated} backlog {unestimated === 1 ? 'item has' : 'items have'} no estimate. Size them before sprint
          planning so capacity maths stays honest.
        </Alert>
      ) : null}

      <Paper
        ref={setNodeRef}
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          p: 1,
          minHeight: 240,
          maxHeight: { xs: 'none', lg: 'calc(100vh - 300px)' },
          overflowY: 'auto',
          bgcolor: isOver ? 'action.hover' : 'transparent',
          borderColor: isOver ? 'primary.main' : 'divider',
        }}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <EmptyState
              dense
              title="Backlog is clear"
              description="Everything is either in a sprint or already done."
            />
          ) : (
            <Stack spacing={0.75}>
              {tasks.map((task) => (
                <SortableBacklogRow key={task.id} task={task} onOpen={onOpenTask} dragging={activeId === task.id} />
              ))}
            </Stack>
          )}
        </SortableContext>
      </Paper>
    </Stack>
  );
}

function SprintDropZone({
  sprint,
  tasks,
  onOpenTask,
  onEditSprint,
  activeId,
}: {
  sprint: Sprint;
  tasks: Task[];
  onOpenTask: (taskId: ID) => void;
  onEditSprint: (sprint: Sprint) => void;
  activeId: ID | null;
}): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: sprint.id });
  const planned = sumPoints(tasks);
  const completed = sumPoints(tasks.filter((task) => task.status === 'done'));
  const overCapacity = planned > sprint.capacityPoints;
  const token = sprintStatusTokens[sprint.status];

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        borderColor: isOver ? 'primary.main' : 'divider',
        bgcolor: isOver ? (t) => alpha(t.palette.primary.main, 0.05) : 'transparent',
      }}
    >
      <Box sx={{ p: 1.75 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box aria-hidden sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: token.color }} />
              <Typography variant="subtitle1" noWrap>
                {sprint.name}
              </Typography>
              <SprintStatusChip status={sprint.status} />
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
              {formatShortDate(sprint.startDate)} – {formatShortDate(sprint.endDate)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {sprint.goal}
            </Typography>
          </Box>
          <Tooltip title="Edit sprint">
            <IconButton size="small" onClick={() => onEditSprint(sprint)} aria-label={`Edit ${sprint.name}`}>
              <Pencil size={14} />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`${tasks.length} items`} />
          <Chip
            size="small"
            color={overCapacity ? 'error' : 'default'}
            label={`${planned} / ${sprint.capacityPoints} pts`}
          />
          <Chip size="small" variant="outlined" label={`${completed} pts done`} />
        </Stack>

        <LinearProgress
          variant="determinate"
          value={Math.min(100, (planned / Math.max(1, sprint.capacityPoints)) * 100)}
          color={overCapacity ? 'error' : 'primary'}
          aria-label={`${sprint.name} capacity used`}
          sx={{ mt: 1.25 }}
        />
        {overCapacity ? (
          <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
            Over capacity by {planned - sprint.capacityPoints} points.
          </Typography>
        ) : null}
      </Box>

      <Divider />

      <Box sx={{ p: 1, maxHeight: 320, overflowY: 'auto' }}>
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <EmptyState dense title="Empty sprint" description="Drag backlog items here, or use the row menu." />
          ) : (
            <Stack spacing={0.75}>
              {tasks.map((task) => (
                <SortableBacklogRow key={task.id} task={task} onOpen={onOpenTask} dragging={activeId === task.id} />
              ))}
            </Stack>
          )}
        </SortableContext>
      </Box>
    </Paper>
  );
}

function SortableBacklogRow({
  task,
  onOpen,
  dragging,
}: {
  task: Task;
  onOpen: (taskId: ID) => void;
  dragging: boolean;
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  return (
    <Box ref={setNodeRef} sx={{ transform: CSS.Translate.toString(transform), transition }}>
      <BacklogRow task={task} onOpen={onOpen} dragging={dragging} handleProps={{ ...attributes, ...listeners }} />
    </Box>
  );
}

function BacklogRow({
  task,
  onOpen,
  dragging,
  handleProps,
}: {
  task: Task;
  onOpen: (taskId: ID) => void;
  dragging: boolean;
  handleProps: Record<string, unknown>;
}): React.JSX.Element {
  const { state, dispatch, userById } = useWorkspace();
  const { notify } = useToast();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const sprintOptions = state.sprints.filter((s) => s.projectId === task.projectId && s.id !== task.sprintId);

  return (
    <Paper
      variant="outlined"
      sx={{
        px: 1,
        py: 0.75,
        borderRadius: 2,
        opacity: dragging ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        '&:hover': { borderColor: 'primary.main' },
      }}
    >
      <Box
        {...handleProps}
        aria-label={`Reorder ${task.key}`}
        sx={{ display: 'flex', color: 'text.disabled', cursor: 'grab', touchAction: 'none' }}
      >
        <GripVertical size={15} />
      </Box>

      <Box
        role="button"
        tabIndex={0}
        onClick={() => onOpen(task.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onOpen(task.id);
        }}
        sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary' }}>
            {task.key}
          </Typography>
          <Typography variant="body2" noWrap sx={{ fontWeight: 550 }}>
            {task.title}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
          <TypeChip type={task.type} />
          <PriorityChip priority={task.priority} />
          {task.storyPoints === undefined ? (
            <Chip size="small" color="warning" variant="outlined" label="No estimate" />
          ) : (
            <Chip size="small" label={`${task.storyPoints} pts`} />
          )}
        </Stack>
      </Box>

      <UserAvatar user={userById(task.assigneeId)} size={22} />

      <Tooltip title="Move to…">
        <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label={`Move ${task.key}`}>
          <ChevronRight size={15} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {task.sprintId ? (
          <MenuItem
            onClick={() => {
              dispatch({ type: 'task/assignSprint', taskId: task.id, sprintId: undefined });
              notify(`${task.key} returned to the backlog`);
              setAnchor(null);
            }}
          >
            Move to backlog
          </MenuItem>
        ) : null}
        {sprintOptions.map((sprint) => (
          <MenuItem
            key={sprint.id}
            onClick={() => {
              dispatch({ type: 'task/assignSprint', taskId: task.id, sprintId: sprint.id });
              notify(`${task.key} moved into ${sprint.name}`);
              setAnchor(null);
            }}
          >
            {sprint.name}
          </MenuItem>
        ))}
        {sprintOptions.length === 0 && !task.sprintId ? <MenuItem disabled>No sprints available</MenuItem> : null}
      </Menu>
    </Paper>
  );
}

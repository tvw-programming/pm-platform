import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { alpha, useTheme } from '@mui/material/styles';
import { Plus, Columns3 } from 'lucide-react';
import { TASK_STATUSES, type ID, type Task, type TaskStatus } from '@/types/domain';
import { taskStatusTokens } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useToast } from '@/state/ToastProvider';
import { TaskCard } from './TaskCard';
import { EmptyState } from '@/components/common/States';
import { sumPoints } from '@/utils/selectors';

interface KanbanBoardProps {
  tasks: Task[];
  columns: TaskStatus[];
  onOpenTask: (taskId: ID) => void;
  onAddTask: (status: TaskStatus) => void;
  onAddColumn?: (status: TaskStatus) => void;
}

export function KanbanBoard({
  tasks,
  columns,
  onOpenTask,
  onAddTask,
  onAddColumn,
}: KanbanBoardProps): React.JSX.Element {
  const { dispatch } = useWorkspace();
  const { notify } = useToast();
  const [activeId, setActiveId] = useState<ID | null>(null);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<HTMLElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const column of columns) map.set(column, []);
    for (const task of tasks) {
      const bucket = map.get(task.status);
      if (bucket) bucket.push(task);
    }
    return map;
  }, [tasks, columns]);

  const activeTask = tasks.find((task) => task.id === activeId);
  const availableColumns = TASK_STATUSES.filter((status) => !columns.includes(status));

  const handleDragStart = (event: DragStartEvent): void => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const overId = String(over.id);
    // Dropping on a column id moves to the end; dropping on a card ranks above it.
    const targetStatus = columns.includes(overId as TaskStatus)
      ? (overId as TaskStatus)
      : tasks.find((t) => t.id === overId)?.status;

    if (!targetStatus) return;

    const targetTask = tasks.find((t) => t.id === overId);
    const rank = targetTask ? targetTask.rank - 1 : Date.now();

    if (targetStatus === task.status) {
      dispatch({ type: 'task/reorder', taskId, status: targetStatus, rank });
      return;
    }

    const previousStatus = task.status;
    dispatch({ type: 'task/setStatus', taskId, status: targetStatus, rank });
    notify(`${task.key} → ${taskStatusTokens[targetStatus].label}`, {
      actionLabel: 'Undo',
      onAction: () => dispatch({ type: 'task/setStatus', taskId, status: previousStatus }),
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up task ${active.id}. Use arrow keys to move, space to drop.`,
          onDragOver: ({ active, over }) => (over ? `Task ${active.id} is over ${over.id}.` : undefined),
          onDragEnd: ({ active, over }) =>
            over ? `Task ${active.id} dropped on ${over.id}.` : `Task ${active.id} returned to its column.`,
          onDragCancel: ({ active }) => `Dragging task ${active.id} cancelled.`,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          overflowX: 'auto',
          pb: 2,
          // Columns keep a fixed width so the board scrolls horizontally on
          // tablet and mobile instead of squeezing cards.
          scrollSnapType: { xs: 'x mandatory', md: 'none' },
        }}
      >
        {columns.map((status) => {
          const columnTasks = grouped.get(status) ?? [];
          return (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columnTasks}
              onOpenTask={onOpenTask}
              onAddTask={onAddTask}
              activeId={activeId}
            />
          );
        })}

        {onAddColumn && availableColumns.length > 0 ? (
          <Box sx={{ flex: '0 0 auto', width: 200, pt: 0.5 }}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              startIcon={<Columns3 size={15} />}
              onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
              sx={{ borderStyle: 'dashed', py: 1.25 }}
            >
              Add column
            </Button>
            <Menu
              anchorEl={columnMenuAnchor}
              open={Boolean(columnMenuAnchor)}
              onClose={() => setColumnMenuAnchor(null)}
            >
              {availableColumns.map((status) => (
                <MenuItem
                  key={status}
                  onClick={() => {
                    onAddColumn(status);
                    setColumnMenuAnchor(null);
                  }}
                >
                  {taskStatusTokens[status].label}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        ) : null}
      </Box>

      <DragOverlay>
        {activeTask ? (
          <Box sx={{ width: 288, transform: 'rotate(1.5deg)' }}>
            <TaskCard task={activeTask} onOpen={() => undefined} />
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onOpenTask: (taskId: ID) => void;
  onAddTask: (status: TaskStatus) => void;
  activeId: ID | null;
}

function KanbanColumn({ status, tasks, onOpenTask, onAddTask, activeId }: KanbanColumnProps): React.JSX.Element {
  const theme = useTheme();
  const token = taskStatusTokens[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <Paper
      variant="outlined"
      sx={{
        flex: '0 0 auto',
        width: { xs: 280, sm: 296 },
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isOver ? alpha(token.color, theme.palette.mode === 'light' ? 0.06 : 0.12) : 'background.default',
        borderColor: isOver ? alpha(token.color, 0.5) : 'divider',
        borderRadius: 2.5,
        scrollSnapAlign: 'start',
        transition: 'background-color 140ms ease, border-color 140ms ease',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <Box aria-hidden sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: token.color, flexShrink: 0 }} />
          <Typography variant="subtitle2" noWrap>
            {token.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {tasks.length}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          {tasks.length > 0 ? (
            <Tooltip title="Story points in this column">
              <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {sumPoints(tasks)} pts
              </Typography>
            </Tooltip>
          ) : null}
          <Tooltip title={`Add task to ${token.label}`}>
            <IconButton size="small" onClick={() => onAddTask(status)} aria-label={`Add task to ${token.label}`}>
              <Plus size={15} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Box
        ref={setNodeRef}
        sx={{
          p: 1.25,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          overflowY: 'auto',
          minHeight: 120,
          maxHeight: { xs: 'none', md: 'calc(100vh - 340px)' },
        }}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <EmptyState
              dense
              title="Nothing here"
              description={`No tasks in ${token.label.toLowerCase()} for the current filters.`}
              action={
                <Button size="small" startIcon={<Plus size={14} />} onClick={() => onAddTask(status)}>
                  Add task
                </Button>
              }
            />
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onOpen={onOpenTask} dragging={activeId === task.id} />
            ))
          )}
        </SortableContext>
      </Box>
    </Paper>
  );
}

function SortableTaskCard({
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
      <TaskCard task={task} onOpen={onOpen} dragging={dragging} dragHandleProps={{ ...attributes, ...listeners }} />
    </Box>
  );
}

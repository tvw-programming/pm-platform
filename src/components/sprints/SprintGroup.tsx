import React, { useMemo, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, ICellRendererParams, RowClickedEvent, GetRowIdParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { ChevronDown, ChevronRight, Play } from 'lucide-react';
import type { ID, Sprint, Task } from '@/types/domain';
import { sprintStatusTokens } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { PriorityChip, SprintStatusChip, StatusChip } from '@/components/common/TokenChip';
import { UserAvatar } from '@/components/common/UserAvatar';
import { EmptyState } from '@/components/common/States';
import { formatShortDate } from '@/utils/format';
import { sumPoints } from '@/utils/selectors';

ModuleRegistry.registerModules([AllCommunityModule]);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SprintGroupProps {
  sprint: Sprint;
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  onStartSprint?: (sprintId: string) => void;
}

interface SprintTaskRow {
  id: ID;
  key: string;
  title: string;
  status: Task['status'];
  priority: Task['priority'];
  assigneeId?: ID;
  points: number | null;
}

/* ------------------------------------------------------------------ */
/*  Cell renderers                                                     */
/* ------------------------------------------------------------------ */

const StatusCellRenderer = React.memo(function StatusCellRenderer(
  params: ICellRendererParams<SprintTaskRow>,
) {
  return params.value ? <StatusChip status={params.value} /> : null;
});

const PriorityCellRenderer = React.memo(function PriorityCellRenderer(
  params: ICellRendererParams<SprintTaskRow>,
) {
  return params.value ? <PriorityChip priority={params.value} /> : null;
});

function makeAssigneeCellRenderer(
  userById: ReturnType<typeof useWorkspace>['userById'],
) {
  return React.memo(function AssigneeCellRenderer(
    params: ICellRendererParams<SprintTaskRow>,
  ) {
    const user = userById(params.value ?? undefined);
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
        <UserAvatar user={user} size={22} />
        <Typography variant="body2" noWrap>
          {user?.name ?? 'Unassigned'}
        </Typography>
      </Stack>
    );
  });
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function SprintGroup({ sprint, tasks, onOpenTask, onStartSprint }: SprintGroupProps): React.JSX.Element {
  const { userById } = useWorkspace();
  const [expanded, setExpanded] = useState(sprint.status === 'active');

  const totalPoints = useMemo(() => sumPoints(tasks), [tasks]);

  const AssigneeCellRenderer = useMemo(() => makeAssigneeCellRenderer(userById), [userById]);

  const rows = useMemo<SprintTaskRow[]>(
    () =>
      tasks.map((task) => ({
        id: task.id,
        key: task.key,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        points: task.storyPoints ?? null,
      })),
    [tasks],
  );

  const columns = useMemo<ColDef<SprintTaskRow>[]>(
    () => [
      { field: 'key', headerName: 'ID', width: 96, filter: true, sortable: true },
      { field: 'title', headerName: 'Title', flex: 1, minWidth: 200, filter: true, sortable: true },
      {
        field: 'assigneeId',
        headerName: 'Owner',
        width: 160,
        cellRenderer: AssigneeCellRenderer,
        filter: true,
        sortable: true,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 128,
        cellRenderer: StatusCellRenderer,
        filter: true,
        sortable: true,
      },
      {
        field: 'priority',
        headerName: 'Priority',
        width: 112,
        cellRenderer: PriorityCellRenderer,
        filter: true,
        sortable: true,
      },
      {
        field: 'points',
        headerName: 'Est. SP',
        width: 100,
        type: 'numericColumn',
        filter: 'agNumberColumnFilter',
        sortable: true,
      },
    ],
    [AssigneeCellRenderer],
  );

  const getRowId = useCallback((params: GetRowIdParams<SprintTaskRow>) => String(params.data.id), []);

  const onRowClicked = useCallback(
    (event: RowClickedEvent<SprintTaskRow>) => {
      if (event.data) {
        onOpenTask(String(event.data.id));
      }
    },
    [onOpenTask],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({ resizable: true, suppressMovable: false }),
    [],
  );

  const token = sprintStatusTokens[sprint.status];

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        overflow: 'hidden',
        mb: 2,
      }}
    >
      {/* Collapsible header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          px: 2,
          py: 1.5,
          cursor: 'pointer',
          bgcolor: 'action.hover',
          '&:hover': { bgcolor: 'action.selected' },
          userSelect: 'none',
        }}
      >
        <IconButton size="small" aria-label={expanded ? 'Collapse sprint' : 'Expand sprint'}>
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </IconButton>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, minWidth: 0 }} noWrap>
          {sprint.name}
        </Typography>

        <SprintStatusChip status={sprint.status} />

        <Typography variant="caption" color="text.secondary" noWrap>
          {formatShortDate(sprint.startDate)} – {formatShortDate(sprint.endDate)}
        </Typography>

        <Chip size="small" label={`${totalPoints} SP`} variant="outlined" />

        <Box sx={{ flex: 1 }} />

        {sprint.status === 'planned' && onStartSprint ? (
          <Button
            size="small"
            variant="contained"
            startIcon={<Play size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onStartSprint(sprint.id);
            }}
          >
            Start Sprint
          </Button>
        ) : null}
      </Stack>

      {/* Collapsible body */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, pt: 1 }}>
          {tasks.length === 0 ? (
            <EmptyState
              dense
              title="No tasks in this sprint"
              description="Drag tasks from the backlog or create new ones to plan this sprint."
            />
          ) : (
            <>
              <Box
                className="ag-theme-material"
                sx={{
                  height: Math.min(tasks.length * 42 + 48 + 42, 420),
                  width: '100%',
                  '& .ag-row': { cursor: 'pointer' },
                  '& .ag-header-cell-text': {
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  },
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <AgGridReact<SprintTaskRow>
                  rowData={rows}
                  columnDefs={columns}
                  defaultColDef={defaultColDef}
                  getRowId={getRowId}
                  onRowClicked={onRowClicked}
                  animateRows={false}
                  rowHeight={42}
                  headerHeight={48}
                  suppressCellFocus={true}
                  domLayout={tasks.length <= 8 ? 'autoHeight' : undefined}
                  pagination={tasks.length > 25}
                  paginationPageSize={25}
                />
              </Box>

              {/* Group total row */}
              <Stack
                direction="row"
                justifyContent="flex-end"
                alignItems="center"
                spacing={1}
                sx={{
                  mt: 1,
                  px: 1.5,
                  py: 0.75,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Total:
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {totalPoints} story points
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({tasks.length} {tasks.length === 1 ? 'task' : 'tasks'})
                </Typography>
              </Stack>
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

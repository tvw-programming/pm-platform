import React, { useMemo, useCallback } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, ICellRendererParams, RowClickedEvent, GetRowIdParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import type { ID, Task } from '@/types/domain';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { PriorityChip, StatusChip, TypeChip } from '@/components/common/TokenChip';
import { AgentAssignee } from '@/components/common/AgentAssignee';
import { EmptyState } from '@/components/common/States';
import { formatShortDate } from '@/utils/format';
import { taskIsOverdue } from '@/utils/selectors';

ModuleRegistry.registerModules([AllCommunityModule]);

interface TaskRow {
  id: ID;
  key: string;
  title: string;
  type: Task['type'];
  status: Task['status'];
  priority: Task['priority'];
  assigneeId?: ID;
  assigneeKind?: Task['assigneeKind'];
  assigneeAgentName?: string;
  assigneeRoleId?: string;
  executionPolicy?: Task['executionPolicy'];
  origin?: Task['origin'];
  task: Task;
  projectKey: string;
  sprintName: string;
  points: number | null;
  dueDate?: string;
  overdue: boolean;
}

interface TaskListTableProps {
  tasks: Task[];
  onOpenTask: (taskId: ID) => void;
  showProject?: boolean;
  height?: number;
}

/* ------------------------------------------------------------------ */
/*  Cell renderer components (memoized for AG Grid perf)              */
/* ------------------------------------------------------------------ */

const KeyCellRenderer = React.memo(function KeyCellRenderer(
  params: ICellRendererParams<TaskRow>,
) {
  return (
    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
      {params.value}
    </Typography>
  );
});

const TypeCellRenderer = React.memo(function TypeCellRenderer(
  params: ICellRendererParams<TaskRow>,
) {
  return params.value ? <TypeChip type={params.value} /> : null;
});

const StatusCellRenderer = React.memo(function StatusCellRenderer(
  params: ICellRendererParams<TaskRow>,
) {
  return params.value ? <StatusChip status={params.value} /> : null;
});

const PriorityCellRenderer = React.memo(function PriorityCellRenderer(
  params: ICellRendererParams<TaskRow>,
) {
  return params.value ? <PriorityChip priority={params.value} /> : null;
});

const DueDateCellRenderer = React.memo(function DueDateCellRenderer(
  params: ICellRendererParams<TaskRow>,
) {
  const overdue = params.data?.overdue ?? false;
  return (
    <Typography
      variant="body2"
      color={overdue ? 'error.main' : 'text.primary'}
      fontWeight={overdue ? 700 : 400}
    >
      {params.value ? formatShortDate(params.value) : '—'}
    </Typography>
  );
});

/**
 * The Assignee renderer needs `userById` from the workspace context, so it is
 * created as a closure inside the component body below rather than at module
 * scope. We still wrap it with React.memo via a factory.
 */
function makeAssigneeCellRenderer(
  userById: ReturnType<typeof useWorkspace>['userById'],
) {
  const AssigneeCellRenderer = React.memo(function AssigneeCellRenderer(
    params: ICellRendererParams<TaskRow>,
  ) {
    const row = params.data;
    if (!row) return null;
    const user = userById(row.assigneeId);
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
        <AgentAssignee task={row.task} humanUser={user} size={22} showName />
      </Stack>
    );
  });
  return AssigneeCellRenderer;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export function TaskListTable({
  tasks,
  onOpenTask,
  showProject = true,
  height = 620,
}: TaskListTableProps): React.JSX.Element {
  const { state, userById, projectById } = useWorkspace();

  const AssigneeCellRenderer = useMemo(() => makeAssigneeCellRenderer(userById), [userById]);

  const rows = useMemo<TaskRow[]>(
    () =>
      tasks.map((task) => ({
        id: task.id,
        key: task.key,
        title: task.title,
        type: task.type,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        assigneeKind: task.assigneeKind,
        assigneeAgentName: task.assigneeAgentName,
        assigneeRoleId: task.assigneeRoleId,
        executionPolicy: task.executionPolicy,
        origin: task.origin,
        task,
        projectKey: projectById(task.projectId)?.key ?? '—',
        sprintName: state.sprints.find((s) => s.id === task.sprintId)?.name ?? 'Backlog',
        points: task.storyPoints ?? null,
        dueDate: task.dueDate,
        overdue: taskIsOverdue(task),
      })),
    [tasks, projectById, state.sprints],
  );

  const columns = useMemo<ColDef<TaskRow>[]>(() => {
    const base: ColDef<TaskRow>[] = [
      {
        field: 'key',
        headerName: 'ID',
        width: 96,
        cellRenderer: KeyCellRenderer,
        filter: true,
        sortable: true,
      },
      {
        field: 'title',
        headerName: 'Title',
        flex: 1,
        minWidth: 240,
        filter: true,
        sortable: true,
      },
      {
        field: 'type',
        headerName: 'Type',
        width: 128,
        cellRenderer: TypeCellRenderer,
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
        field: 'assigneeId',
        headerName: 'Assignee',
        width: 160,
        cellRenderer: AssigneeCellRenderer,
        filter: true,
        sortable: true,
      },
      {
        field: 'sprintName',
        headerName: 'Sprint',
        width: 150,
        filter: true,
        sortable: true,
      },
      {
        field: 'points',
        headerName: 'Points',
        width: 90,
        type: 'numericColumn',
        filter: 'agNumberColumnFilter',
        sortable: true,
      },
      {
        field: 'dueDate',
        headerName: 'Due',
        width: 110,
        cellRenderer: DueDateCellRenderer,
        filter: true,
        sortable: true,
      },
    ];

    if (showProject) {
      base.splice(1, 0, {
        field: 'projectKey',
        headerName: 'Project',
        width: 100,
        filter: true,
        sortable: true,
      });
    }
    return base;
  }, [showProject, AssigneeCellRenderer]);

  const getRowId = useCallback((params: GetRowIdParams<TaskRow>) => String(params.data.id), []);

  const onRowClicked = useCallback(
    (event: RowClickedEvent<TaskRow>) => {
      if (event.data) {
        onOpenTask(String(event.data.id));
      }
    },
    [onOpenTask],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      suppressMovable: false,
    }),
    [],
  );

  if (tasks.length === 0) {
    return (
      <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
        <EmptyState
          title="No tasks match these filters"
          description="Try clearing a filter or widening the search to see more work."
        />
      </Paper>
    );
  }

  return (
    <Box
      className="ag-theme-material"
      sx={{
        height,
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
        borderRadius: 2.5,
        overflow: 'hidden',
      }}
    >
      <AgGridReact<TaskRow>
        rowData={rows}
        columnDefs={columns}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        onRowClicked={onRowClicked}
        animateRows={false}
        rowHeight={42}
        headerHeight={48}
        pagination={true}
        paginationPageSize={25}
        paginationPageSizeSelector={[10, 25, 50, 100]}
        suppressCellFocus={true}
        rowSelection="single"
      />
    </Box>
  );
}

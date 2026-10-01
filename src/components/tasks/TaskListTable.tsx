import { useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import type { ID, Task } from '@/types/domain';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { PriorityChip, StatusChip, TypeChip } from '@/components/common/TokenChip';
import { UserAvatar } from '@/components/common/UserAvatar';
import { EmptyState } from '@/components/common/States';
import { formatShortDate } from '@/utils/format';
import { taskIsOverdue } from '@/utils/selectors';

interface TaskRow {
  id: ID;
  key: string;
  title: string;
  type: Task['type'];
  status: Task['status'];
  priority: Task['priority'];
  assigneeId?: ID;
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

export function TaskListTable({
  tasks,
  onOpenTask,
  showProject = true,
  height = 620,
}: TaskListTableProps): React.JSX.Element {
  const { state, userById, projectById } = useWorkspace();

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
        projectKey: projectById(task.projectId)?.key ?? '—',
        sprintName: state.sprints.find((s) => s.id === task.sprintId)?.name ?? 'Backlog',
        points: task.storyPoints ?? null,
        dueDate: task.dueDate,
        overdue: taskIsOverdue(task),
      })),
    [tasks, projectById, state.sprints],
  );

  const columns = useMemo<GridColDef<TaskRow>[]>(() => {
    const base: GridColDef<TaskRow>[] = [
      {
        field: 'key',
        headerName: 'ID',
        width: 96,
        renderCell: (params: GridRenderCellParams<TaskRow, string>) => (
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
            {params.value}
          </Typography>
        ),
      },
      { field: 'title', headerName: 'Title', flex: 1, minWidth: 240 },
      {
        field: 'type',
        headerName: 'Type',
        width: 128,
        renderCell: (params: GridRenderCellParams<TaskRow, Task['type']>) =>
          params.value ? <TypeChip type={params.value} /> : null,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 128,
        renderCell: (params: GridRenderCellParams<TaskRow, Task['status']>) =>
          params.value ? <StatusChip status={params.value} /> : null,
      },
      {
        field: 'priority',
        headerName: 'Priority',
        width: 112,
        renderCell: (params: GridRenderCellParams<TaskRow, Task['priority']>) =>
          params.value ? <PriorityChip priority={params.value} /> : null,
      },
      {
        field: 'assigneeId',
        headerName: 'Assignee',
        width: 160,
        renderCell: (params: GridRenderCellParams<TaskRow, ID | undefined>) => {
          const user = userById(params.value ?? undefined);
          return (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
              <UserAvatar user={user} size={22} />
              <Typography variant="body2" noWrap>
                {user?.name ?? 'Unassigned'}
              </Typography>
            </Stack>
          );
        },
      },
      { field: 'sprintName', headerName: 'Sprint', width: 150 },
      {
        field: 'points',
        headerName: 'Points',
        width: 90,
        type: 'number',
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'dueDate',
        headerName: 'Due',
        width: 110,
        renderCell: (params: GridRenderCellParams<TaskRow, string | undefined>) => (
          <Typography
            variant="body2"
            color={params.row.overdue ? 'error.main' : 'text.primary'}
            fontWeight={params.row.overdue ? 700 : 400}
          >
            {params.value ? formatShortDate(params.value) : '—'}
          </Typography>
        ),
      },
    ];

    if (showProject) {
      base.splice(1, 0, { field: 'projectKey', headerName: 'Project', width: 100 });
    }
    return base;
  }, [showProject, userById]);

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
    <Box sx={{ height, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        onRowClick={(params) => onOpenTask(String(params.id))}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        pageSizeOptions={[10, 25, 50, 100]}
        density="standard"
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2.5,
          '& .MuiDataGrid-row': { cursor: 'pointer' },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          },
        }}
      />
    </Box>
  );
}

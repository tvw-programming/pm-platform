import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { Plus } from 'lucide-react';
import type { ID, Sprint } from '@/types/domain';
import { PageHeader } from '@/components/common/PageHeader';
import { TaskFilterBar } from '@/components/common/TaskFilterBar';
import { BacklogPlanner } from '@/components/backlog/BacklogPlanner';
import { VelocityChart } from '@/components/sprints/SprintCharts';
import { SprintDialog } from '@/components/sprints/SprintDialog';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useUi } from '@/state/UiProvider';
import { useTaskFilters } from '@/hooks/useTaskFilters';

interface BacklogPageProps {
  /** When rendered inside a project workspace the project is fixed. */
  projectId?: ID;
  embedded?: boolean;
}

export function BacklogPage({ projectId, embedded = false }: BacklogPageProps): React.JSX.Element {
  const { state, visibleTasks, currentUser } = useWorkspace();
  const { openTask, openCreateTask } = useUi();
  const [selectedProjectId, setSelectedProjectId] = useState<ID>(projectId ?? state.projects[0]!.id);
  const [sprintDialog, setSprintDialog] = useState<{ open: boolean; sprint?: Sprint }>({ open: false });

  const activeProjectId = projectId ?? selectedProjectId;
  const { filters, setFilter, reset, activeCount, apply } = useTaskFilters(
    { group: 'none', sort: 'rank' },
    currentUser.id,
  );

  const projectTasks = useMemo(
    () => visibleTasks.filter((task) => task.projectId === activeProjectId && task.type !== 'epic'),
    [visibleTasks, activeProjectId],
  );

  const filteredTasks = useMemo(() => apply(projectTasks), [apply, projectTasks]);

  const backlogTasks = useMemo(
    () => filteredTasks.filter((task) => !task.sprintId && task.status !== 'done'),
    [filteredTasks],
  );

  const projectSprints = useMemo(
    () =>
      state.sprints
        .filter((sprint) => sprint.projectId === activeProjectId && sprint.status !== 'completed')
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [state.sprints, activeProjectId],
  );

  const allProjectSprints = useMemo(
    () => state.sprints.filter((sprint) => sprint.projectId === activeProjectId),
    [state.sprints, activeProjectId],
  );

  return (
    <Box>
      {!embedded ? (
        <PageHeader
          title="Backlog & sprint planning"
          description="Rank the backlog, size the work and pull it into the next sprint without losing capacity discipline."
          actions={
            <>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Plus size={15} />}
                onClick={() => setSprintDialog({ open: true })}
              >
                Create sprint
              </Button>
              <Button
                variant="contained"
                startIcon={<Plus size={15} />}
                onClick={() => openCreateTask({ projectId: activeProjectId, status: 'backlog' })}
              >
                Add backlog item
              </Button>
            </>
          }
        />
      ) : null}

      <TaskFilterBar
        filters={filters}
        setFilter={setFilter}
        reset={reset}
        activeCount={activeCount}
        showGrouping={false}
        showProjectFilter={false}
        rightSlot={
          projectId ? undefined : (
            <TextField
              select
              label="Project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              sx={{ width: { xs: '100%', md: 240 } }}
            >
              {state.projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.key} · {project.name}
                </MenuItem>
              ))}
            </TextField>
          )
        }
      />

      <BacklogPlanner
        backlogTasks={backlogTasks}
        sprints={projectSprints}
        allTasks={filteredTasks}
        onOpenTask={openTask}
        onAddTask={() => openCreateTask({ projectId: activeProjectId, status: 'backlog' })}
        onCreateSprint={() => setSprintDialog({ open: true })}
        onEditSprint={(sprint) => setSprintDialog({ open: true, sprint })}
      />

      <Box sx={{ mt: 3, display: 'grid', '& > *': { minWidth: 0 }, gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
        <VelocityChart sprints={allProjectSprints} tasks={projectTasks} />
      </Box>

      {sprintDialog.open ? (
        <SprintDialog
          open
          onClose={() => setSprintDialog({ open: false })}
          defaultProjectId={activeProjectId}
          sprint={sprintDialog.sprint}
        />
      ) : null}
    </Box>
  );
}

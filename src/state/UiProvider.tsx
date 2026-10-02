import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ID, TaskStatus, PersonaRole } from '@/types/domain';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { SprintDialog } from '@/components/sprints/SprintDialog';
import { CreateRoadmapItemDialog } from '@/components/roadmap/CreateRoadmapItemDialog';
import { TaskDetailDrawer } from '@/components/tasks/TaskDetailDrawer';

interface TaskDialogOptions {
  projectId?: ID;
  status?: TaskStatus;
  sprintId?: ID;
}

interface UiContextValue {
  openTask: (taskId: ID) => void;
  closeTask: () => void;
  openTaskId: ID | null;
  openCreateTask: (options?: TaskDialogOptions) => void;
  openCreateProject: () => void;
  openCreateSprint: (projectId?: ID) => void;
  openCreateRoadmapItem: (projectId?: ID) => void;
  activeRole: PersonaRole;
  setActiveRole: (role: PersonaRole) => void;
}

const UiContext = createContext<UiContextValue | undefined>(undefined);

/**
 * Hosts the app-wide dialogs and the task drawer so any screen can open them
 * without threading props down. Keeps page components focused on layout.
 */
export function UiProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [openTaskId, setOpenTaskId] = useState<ID | null>(null);
  const [taskDialog, setTaskDialog] = useState<TaskDialogOptions | null>(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [sprintDialogProject, setSprintDialogProject] = useState<ID | null | undefined>(undefined);
  const [roadmapDialogProject, setRoadmapDialogProject] = useState<ID | null | undefined>(undefined);
  const [activeRole, setActiveRole] = useState<PersonaRole>('PM');

  const value = useMemo<UiContextValue>(
    () => ({
      openTaskId,
      openTask: (taskId) => setOpenTaskId(taskId),
      closeTask: () => setOpenTaskId(null),
      openCreateTask: (options) => setTaskDialog(options ?? {}),
      openCreateProject: () => setProjectDialogOpen(true),
      openCreateSprint: (projectId) => setSprintDialogProject(projectId ?? null),
      openCreateRoadmapItem: (projectId) => setRoadmapDialogProject(projectId ?? null),
      activeRole,
      setActiveRole,
    }),
    [openTaskId, activeRole],
  );

  const closeTaskDialog = useCallback(() => setTaskDialog(null), []);

  return (
    <UiContext.Provider value={value}>
      {children}

      <TaskDetailDrawer taskId={openTaskId} onClose={() => setOpenTaskId(null)} />

      {taskDialog ? (
        <CreateTaskDialog
          open
          onClose={closeTaskDialog}
          defaultProjectId={taskDialog.projectId}
          defaultStatus={taskDialog.status}
          defaultSprintId={taskDialog.sprintId}
        />
      ) : null}

      <CreateProjectDialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} />

      {sprintDialogProject !== undefined ? (
        <SprintDialog
          open
          onClose={() => setSprintDialogProject(undefined)}
          defaultProjectId={sprintDialogProject ?? undefined}
        />
      ) : null}

      {roadmapDialogProject !== undefined ? (
        <CreateRoadmapItemDialog
          open
          onClose={() => setRoadmapDialogProject(undefined)}
          defaultProjectId={roadmapDialogProject ?? undefined}
        />
      ) : null}
    </UiContext.Provider>
  );
}

export function useUi(): UiContextValue {
  const context = useContext(UiContext);
  if (!context) throw new Error('useUi must be used inside a UiProvider');
  return context;
}

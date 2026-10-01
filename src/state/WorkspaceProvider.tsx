import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { ID, Project, Task, User } from '@/types/domain';
import {
  initialWorkspaceState,
  workspaceReducer,
  type WorkspaceAction,
  type WorkspaceState,
} from './workspaceReducer';

interface WorkspaceContextValue {
  state: WorkspaceState;
  dispatch: React.Dispatch<WorkspaceAction>;
  /** Tasks excluding archived ones — what every screen should render. */
  visibleTasks: Task[];
  activeProjects: Project[];
  currentUser: User;
  userById: (id?: ID) => User | undefined;
  projectById: (id?: ID) => Project | undefined;
  taskById: (id?: ID) => Task | undefined;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspaceState);

  const value = useMemo<WorkspaceContextValue>(() => {
    const archived = new Set(state.archivedTaskIds);
    const visibleTasks = state.tasks.filter((task) => !archived.has(task.id));
    const usersIndex = new Map(state.users.map((u) => [u.id, u]));
    const projectsIndex = new Map(state.projects.map((p) => [p.id, p]));
    const tasksIndex = new Map(state.tasks.map((t) => [t.id, t]));

    return {
      state,
      dispatch,
      visibleTasks,
      activeProjects: state.projects.filter((p) => p.status === 'active' || p.status === 'planning'),
      currentUser: usersIndex.get(state.currentUserId) ?? state.users[0]!,
      userById: (id) => (id ? usersIndex.get(id) : undefined),
      projectById: (id) => (id ? projectsIndex.get(id) : undefined),
      taskById: (id) => (id ? tasksIndex.get(id) : undefined),
    };
  }, [state]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside a WorkspaceProvider');
  return context;
}

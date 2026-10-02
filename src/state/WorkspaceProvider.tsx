import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { ID, Project, Task, User } from '@/types/domain';
import {
  initialWorkspaceState,
  workspaceReducer,
  type WorkspaceAction,
  type WorkspaceState,
} from './workspaceReducer';

/* ------------------------------------------------------------------ types */

export interface WorkspaceStateValue {
  state: WorkspaceState;
  /** Tasks excluding archived ones — what every screen should render. */
  visibleTasks: Task[];
  activeProjects: Project[];
  currentUser: User;
  userById: (id?: ID) => User | undefined;
  projectById: (id?: ID) => Project | undefined;
  taskById: (id?: ID) => Task | undefined;
}

interface WorkspaceContextValue extends WorkspaceStateValue {
  dispatch: React.Dispatch<WorkspaceAction>;
}

/* --------------------------------------------------------------- contexts */

const WorkspaceStateContext = createContext<WorkspaceStateValue | undefined>(undefined);
const WorkspaceDispatchContext = createContext<React.Dispatch<WorkspaceAction> | undefined>(undefined);

/* --------------------------------------------------------------- provider */

export function WorkspaceProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspaceState);

  const stateValue = useMemo<WorkspaceStateValue>(() => {
    const archived = new Set(state.archivedTaskIds);
    const visibleTasks = state.tasks.filter((task) => !archived.has(task.id));
    const usersIndex = new Map(state.users.map((u) => [u.id, u]));
    const projectsIndex = new Map(state.projects.map((p) => [p.id, p]));
    const tasksIndex = new Map(state.tasks.map((t) => [t.id, t]));

    return {
      state,
      visibleTasks,
      activeProjects: state.projects.filter((p) => p.status === 'active' || p.status === 'planning'),
      currentUser: usersIndex.get(state.currentUserId) ?? state.users[0]!,
      userById: (id) => (id ? usersIndex.get(id) : undefined),
      projectById: (id) => (id ? projectsIndex.get(id) : undefined),
      taskById: (id) => (id ? tasksIndex.get(id) : undefined),
    };
  }, [state]);

  return (
    <WorkspaceStateContext.Provider value={stateValue}>
      <WorkspaceDispatchContext.Provider value={dispatch}>
        {children}
      </WorkspaceDispatchContext.Provider>
    </WorkspaceStateContext.Provider>
  );
}

/* ------------------------------------------------------------------ hooks */

/** Read-only workspace state. Components using only this hook won't re-render on dispatch. */
export function useWorkspaceState(): WorkspaceStateValue {
  const context = useContext(WorkspaceStateContext);
  if (!context) throw new Error('useWorkspaceState must be used inside a WorkspaceProvider');
  return context;
}

/** Dispatch-only hook. Components using only this hook won't re-render when entities change. */
export function useWorkspaceDispatch(): React.Dispatch<WorkspaceAction> {
  const context = useContext(WorkspaceDispatchContext);
  if (!context) throw new Error('useWorkspaceDispatch must be used inside a WorkspaceProvider');
  return context;
}

/** Backward-compatible hook that combines both state and dispatch. */
export function useWorkspace(): WorkspaceContextValue {
  const stateValue = useWorkspaceState();
  const dispatch = useWorkspaceDispatch();
  return useMemo(() => ({ ...stateValue, dispatch }), [stateValue, dispatch]);
}

# Frontend Structure

## Directory Map

```
src/
├── api/                    ← API clients
│   └── chatApi.ts          ← Chat/roster/playbook HTTP + WebSocket
├── app/                    ← App-level config
│   ├── App.tsx             ← Router + providers root
│   ├── navigation.ts       ← Nav sections, paths, settings sections
│   ├── routes.tsx          ← React Router route table
│   ├── theme.ts            ← MUI theme (light/dark)
│   └── tokens.ts           ← Design tokens (colours, status maps)
├── components/
│   ├── backlog/            ← BacklogPlanner
│   ├── calendar/           ← ProjectCalendar
│   ├── chat/               ← All chat components (see below)
│   ├── common/             ← Shared UI primitives
│   ├── dashboard/          ← Charts, activity feed, deadlines
│   ├── data-display/       ← CapacityBar, DistributionBar, etc.
│   ├── detail/             ← DetailDrawer + tabs
│   ├── kanban/             ← KanbanBoard + TaskCard
│   ├── navigation/         ← Sidebar, TopBar, GlobalSearch
│   ├── primitives/         ← PriorityChip, StatusChip, TypeChip
│   ├── projects/           ← ProjectCard, CreateProjectDialog
│   ├── roadmap/            ← RoadmapTimeline
│   ├── sprints/            ← SprintGroup, SprintDialog, SprintCharts
│   └── tasks/              ← TaskListTable, CreateTaskDialog
├── data/
│   └── repositories/       ← Data access layer (workItemRepo, releaseRepo)
├── domain/
│   ├── rules/              ← Permission rules (useCan, RequireCan)
│   └── selectors/          ← Pure selector functions (board, backlog, reports)
├── hooks/                  ← Custom React hooks
├── layouts/                ← AppLayout (sidebar + topbar shell)
├── mock-data/              ← Seed fixtures (deterministic random)
├── pages/                  ← One file per route
├── state/                  ← React context providers
│   ├── ColorModeProvider   ← Light/dark toggle
│   ├── ToastProvider       ← Snackbar notifications
│   ├── UiProvider          ← UI state (detail drawer open, etc.)
│   ├── WorkspaceProvider   ← Workspace + task state
│   └── workspaceReducer    ← All workspace state transitions
├── types/
│   ├── domain.ts           ← All domain TypeScript types
│   └── chat.ts             ← Chat-specific TypeScript types
└── utils/
    ├── format.ts           ← Date, number, string formatters
    └── selectors.ts        ← Utility selectors
```

---

## Chat Component Tree

```
ChatPage
├── ChatProvider (context + WebSocket)
│   ├── ChatFilters          ← All / Mentions / Mandatory / Playbooks tabs
│   ├── MessageList
│   │   └── MessageBubble[]
│   │       └── TicketBar[]  ← Per-ticket action row
│   ├── MessageComposer
│   │   ├── TemplateChips    ← Quick-fill phrases per role
│   │   └── RoutedPreview    ← Pre-send playbook resolution preview
│   └── Drawer (roster | playbooks)
│       ├── RosterPanel      ← Add/remove run roster entries
│       └── PlaybookTracker  ← Active playbook instance progress
└── RoleCardDrawer           ← Role duties + template catalog
```

---

## State Management

### WorkspaceProvider

Holds all workspace data in a `useReducer`. The reducer (`workspaceReducer.ts`) handles:
- `board/addColumn`, `board/moveTask`
- `sprint/*` actions
- `release/*` actions
- `task/create`, `task/update`

```ts
// Read state
const { state, dispatch } = useWorkspace();

// Dispatch an action
dispatch({ type: 'task/update', payload: { id, status: 'done' } });
```

### ChatProvider

Holds chat state in a `useReducer` scoped to a `run_id`. Connects WebSocket on mount, disconnects on unmount.

```ts
const { state, sendMessage, resolveTicket, updateRoster } = useChat();
```

### Selectors

Domain selectors in `src/domain/selectors/` are pure functions that derive views from raw state:

```ts
// src/domain/selectors/board.ts
export function selectBoardColumns(tasks: Task[], enabledStatuses: TaskStatus[]) { ... }

// src/domain/selectors/backlog.ts
export function selectBacklogItems(tasks: Task[]) { ... }
```

---

## Adding a New Page

1. Create `src/pages/MyNewPage.tsx`
2. Add a lazy import in `src/app/routes.tsx`:
   ```ts
   const MyNewPage = lazy(() => import('@/pages/MyNewPage').then(m => ({ default: m.MyNewPage })));
   ```
3. Add the route inside the `p/:productId` children:
   ```ts
   { path: 'my-new-path', element: page(<MyNewPage />) }
   ```
4. Add to `src/app/navigation.ts` `paths` object and `navSections` array:
   ```ts
   paths.myNew = wp('my-new-path');

   // In the correct navSection:
   { id: 'my-new', label: 'My New', to: paths.myNew, icon: SomeIcon }
   ```

---

## Adding a New Component

Follow the existing pattern:
- Use `memo()` for leaf components
- Prefer MUI components — avoid raw HTML `div/button`
- Use `sx` prop for inline styles (no CSS files)
- Import icons from `lucide-react`
- Use `@/` path alias, never relative `../../`

---

## Design Tokens

All semantic colours are in `src/app/tokens.ts`:

```ts
export const taskStatusTokens: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  backlog:     { label: 'Backlog',      color: '#8D96A8', bg: '#F4F5F7' },
  in_progress: { label: 'In Progress',  color: '#4A7BD4', bg: '#EEF3FF' },
  // ...
};
```

Use these instead of hardcoded hex values so themes stay consistent.

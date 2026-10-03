# Meridian — Internal Product Delivery Platform

A production-quality React + TypeScript + Material UI front end for internal product management
and collaboration: roadmaps, Kanban delivery, sprint planning, release management, analytics,
team workload and workspace administration.

Mock data and local state only — no backend. Every read goes through one provider, so swapping
the fixture module for API calls is the only change needed to go live.

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Build | Vite 8 | Fast dev server, native TS, route-level code splitting out of the box |
| Language | TypeScript (strict) | `strict`, `noUnusedLocals`, `noImplicitOverride`, no `any` in app code |
| UI system | Material UI v7 + MUI X | Primary component and styling system; MUI X DataGrid for dense task lists |
| Routing | React Router 7 | Typed route table, URL-preserved project/tab state |
| Calendar | FullCalendar 6 (`dayGrid`, `timeGrid`, `list`, `interaction`) | The most mature React calendar with month/week/day/list views **plus** drag-to-reschedule and resize, which the brief requires |
| Timeline | vis-timeline 8 | Handles grouped swimlanes, point + range items, zoom and horizontal pan at roadmap scale; wrapped in a single imperative React component |
| Charts | Recharts 3 | Composable, responsive, theme-driven; every chart ships a text summary for assistive tech |
| Drag & drop | dnd-kit | Keyboard sensor and live announcements, so board and sprint planning are operable without a mouse |
| Dates | date-fns 4 | Tree-shakeable, immutable |
| Icons | lucide-react | Consistent 1.5px stroke set |
| Forms | React Hook Form + Zod | Schema-first validation shared between types and runtime |

## Information architecture

```
Workspace (switcher)
├── Home              — executive + team delivery snapshot
├── My Work           — everything assigned to or reported by the current user
├── Deliver
│   ├── Projects      — card/table index → Project workspace
│   │   └── Project   — Overview · Board · List · Calendar · Timeline · Roadmap ·
│   │                   Backlog · Sprints · Releases · Documents · Activity   (tab in URL)
│   ├── Roadmap       — timeline + table companion, grouped by area/team/quarter/project
│   ├── Calendar      — tasks, milestones, releases, sprint windows
│   ├── Backlog       — ranked backlog ↔ sprint planning, side by side
│   ├── Sprints       — commitment, burndown, velocity
│   └── Releases      — upcoming / active / completed → Release detail
└── Insights
    ├── Reports       — progress, velocity, burndown, cycle & lead time, workload, readiness
    ├── Teams         — membership, skills, availability, utilisation
    ├── Documents     — specs, PRDs, runbooks, retros
    └── Settings      — profile, members, roles, projects, fields, statuses,
                        notifications, integrations, appearance, audit
```

## Folder structure

```
src/
  app/
    App.tsx           Provider composition + router
    routes.tsx        Typed route table with lazy page chunks
    navigation.ts     Single source of truth for paths, nav sections, tab lists
    theme.ts          Light/dark MUI theme built from tokens
    tokens.ts         Brand, status, priority, type, chart colours; radius, elevation, layout
  layouts/
    AppLayout.tsx     Sidebar + app bar shell, responsive behaviour
  components/
    common/           TokenChip, MetricCard, ChartCard, PageHeader, States, ConfirmDialog,
                      ProgressWithLabel, TaskFilterBar, UserAvatar, ErrorBoundary
    navigation/       Sidebar, TopBar, GlobalSearch
    dashboard/        Charts, ActivityFeed, DeadlinesList
    projects/         ProjectCard, CreateProjectDialog
    kanban/           KanbanBoard, TaskCard
    tasks/            TaskDetailDrawer, TaskListTable, CreateTaskDialog
    calendar/         ProjectCalendar (FullCalendar wrapper)
    roadmap/          RoadmapTimeline (vis-timeline wrapper), CreateRoadmapItemDialog
    backlog/          BacklogPlanner (dnd-kit backlog ↔ sprint)
    sprints/          SprintDialog, SprintCharts (velocity, burndown)
  pages/              One file per screen; project tabs reuse the standalone pages
  hooks/              useTaskFilters — the shared filter/sort/group engine
  state/              WorkspaceProvider (reducer), UiProvider (dialogs/drawer),
                      ColorModeProvider, ToastProvider
  types/domain.ts     Every domain model and status union
  mock-data/          people, projects, planning, tasks, activity + barrel
  utils/              format (dates, bytes, percent), selectors (all derived metrics)
```

## Data model and state strategy

`src/types/domain.ts` defines `User`, `Team`, `Workspace`, `Project`, `Task`, `Subtask`,
`Comment`, `Attachment`, `Label`, `CustomFieldDefinition`, `Sprint`, `Release`, `RoadmapItem`,
`Milestone`, `CalendarEvent`, `Activity`, `Risk`, `Notification` and `DocumentRecord`. Status,
priority, type and health are `as const` tuples, so the unions, the colour token maps and the
select options can never drift apart.

State lives in **one reducer** (`state/workspaceReducer.ts`) behind `WorkspaceProvider`.
Every mutation is a typed action — `task/setStatus`, `task/assignSprint`, `sprint/create`,
`release/toggleReadiness` and so on — and the reducer also appends to the activity log, so the
feeds and the audit trail reflect what you just did. Derived numbers are never stored: progress,
burndown, velocity, cycle/lead time, workload, deadlines and the calendar feed are all computed
in `utils/selectors.ts` from the same task list. That is why the calendar duplicates no data —
it is built from the existing tasks, milestones, releases and sprints.

`UiProvider` owns the task drawer and the four create dialogs so any screen can open them
without prop drilling. `ToastProvider` gives one `notify()` with optional **undo**, which is how
destructive and drag actions are confirmed.

To go live: replace `src/mock-data` with API calls and dispatch from the responses. No component
imports the fixtures directly.

## Theme and responsive approach

One accent — Meridian teal `#0E8F86` — on a cool graphite neutral ramp, with separate token maps
for status, priority, task type, health, release state, risk severity and charts. Light and dark
are built from the same tokens, with chip text lifted in dark mode so saturated backgrounds stay
legible. Elevation is a flat five-step ramp; nothing in the component tree hardcodes a hex value.

Breakpoints are `xs 0 / sm 640 / md 900 / lg 1280 / xl 1600`:

- **Desktop** — persistent sidebar, multi-column dashboard, full board, side-by-side backlog and
  sprint planning, full calendar and timeline.
- **Tablet** — sidebar starts collapsed with tooltips, fewer card columns, board scrolls
  horizontally with scroll snapping.
- **Mobile** — navigation drawer, single-column layouts, task details as a bottom sheet, list
  view for the calendar, and the roadmap timeline replaced by the grouped table companion.

Accessibility: a skip link, a visible focus ring on every interactive surface, `aria-current` on
navigation, live announcements for drag-and-drop with a keyboard sensor as an alternative, text
summaries beside every chart, and labelled form controls throughout. Loading, empty, error and
permission-denied states ship as reusable components in `components/common/States.tsx`.

## Running it (full stack)

Requires **Node 20+**, **Go**, **Python 3**, and **PostgreSQL** (`pm_platform`). Optional: **LM Studio** on `http://127.0.0.1:1234/v1` for agent completions.

```bash
./run-local.sh
```

| Service | URL |
| --- | --- |
| Platform UI | http://localhost:5588 |
| GoFiber API | http://localhost:5589 |
| Docs | http://localhost:5590 |
| Python agent | http://localhost:5591 |
| LM Studio | http://127.0.0.1:1234/v1 (external) |

### Phase 1 — Hireable Agentic Virtual Team (Chat)

Chat hires long-lived project agents, seats them on `run-default`, and wakes them via GoFiber → Python → LM Studio. Final replies land as chat messages with run audit (no streaming). Playbooks stay the approval gates. Sprint/Board agent assignees are out of scope for Phase 1.

Smoke path:

1. Start LM Studio and load a model; set URL under **Settings → Local AI**.
2. Open **Chat**, hire PM + Senior FE (auto-seated on roster).
3. **Assign / Run** with an assignment; watch system + AI messages and run tokens.
4. **Pause** an agent — further wakes are rejected until resumed.

Frontend-only (mock PM UI without chat backend):

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Known scope boundaries

- Chat/agent APIs require PostgreSQL + GoFiber; mock PM surfaces still use local fixtures.
- LM Studio is not available in CI — health checks report unreachable until a local server is up.
- No Sprint/Board agent assignees, streaming tokens, or repo tools in Phase 1.
- Roadmap dependencies are shown in the detail drawer and the table rather than drawn as arrows,
  which vis-timeline does not render natively.

import { lazy, Suspense, type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { LoadingState } from '@/components/common/States';

/* Heavy views (calendar, timeline, data grid, charts) are split out of the
   initial bundle so the shell and dashboard load first. */
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const MyWorkPage = lazy(() => import('@/pages/MyWorkPage').then((m) => ({ default: m.MyWorkPage })));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ProjectWorkspacePage = lazy(() =>
  import('@/pages/ProjectWorkspacePage').then((m) => ({ default: m.ProjectWorkspacePage })),
);
const RoadmapPage = lazy(() => import('@/pages/RoadmapPage').then((m) => ({ default: m.RoadmapPage })));
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const BacklogPage = lazy(() => import('@/pages/BacklogPage').then((m) => ({ default: m.BacklogPage })));
const SprintsPage = lazy(() => import('@/pages/SprintsPage').then((m) => ({ default: m.SprintsPage })));
const ReleasesPage = lazy(() => import('@/pages/ReleasesPage').then((m) => ({ default: m.ReleasesPage })));
const ReleaseDetailPage = lazy(() =>
  import('@/pages/ReleaseDetailPage').then((m) => ({ default: m.ReleaseDetailPage })),
);
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const TeamsPage = lazy(() => import('@/pages/TeamsPage').then((m) => ({ default: m.TeamsPage })));
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const BoardPage = lazy(() => import('@/pages/BoardPage').then((m) => ({ default: m.BoardPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function page(node: ReactNode): ReactNode {
  return <Suspense fallback={<LoadingState />}>{node}</Suspense>;
}

/** Typed route table — every path in `paths` has exactly one entry here. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: page(<DashboardPage />) },
      { path: 'my-work', element: page(<MyWorkPage />) },
      { path: 'board', element: page(<BoardPage />) },
      { path: 'projects', element: page(<ProjectsPage />) },
      { path: 'projects/:projectId', element: <Navigate to="overview" replace /> },
      { path: 'projects/:projectId/:tab', element: page(<ProjectWorkspacePage />) },
      { path: 'roadmap', element: page(<RoadmapPage />) },
      { path: 'calendar', element: page(<CalendarPage />) },
      { path: 'backlog', element: page(<BacklogPage />) },
      { path: 'sprints', element: page(<SprintsPage />) },
      { path: 'releases', element: page(<ReleasesPage />) },
      { path: 'releases/:releaseId', element: page(<ReleaseDetailPage />) },
      { path: 'reports', element: page(<ReportsPage />) },
      { path: 'teams', element: page(<TeamsPage />) },
      { path: 'documents', element: page(<DocumentsPage />) },
      { path: 'settings', element: <Navigate to="profile" replace /> },
      { path: 'settings/:section', element: page(<SettingsPage />) },
      { path: '*', element: page(<NotFoundPage />) },
    ],
  },
];

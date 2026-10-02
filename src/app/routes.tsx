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
const IdeasPage = lazy(() => import('@/pages/IdeasPage').then((m) => ({ default: m.IdeasPage })));
const FeedbackPage = lazy(() => import('@/pages/FeedbackPage').then((m) => ({ default: m.FeedbackPage })));
const ChatPage = lazy(() => import('@/pages/ChatPage').then((m) => ({ default: m.ChatPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function page(node: ReactNode): ReactNode {
  return <Suspense fallback={<LoadingState />}>{node}</Suspense>;
}

/** Default workspace/product redirect target */
const DEFAULT_HOME = '/w/ws-1/p/p-1';

/** Typed route table — every path in `paths` has exactly one entry here. */
export const routes: RouteObject[] = [
  /* Root redirect */
  { path: '/', element: <Navigate to={DEFAULT_HOME} replace /> },

  /* My Work lives outside the workspace/product scope */
  {
    path: '/my-work',
    element: <AppLayout />,
    children: [{ index: true, element: page(<MyWorkPage />) }],
  },

  /* Nested workspace / product routes */
  {
    path: '/w/:workspaceId',
    children: [
      { index: true, element: <Navigate to="p/p-1" replace /> },
      {
        path: 'p/:productId',
        element: <AppLayout />,
        children: [
          { index: true, element: page(<DashboardPage />) },
          { path: 'chat', element: page(<ChatPage />) },
          { path: 'board', element: page(<BoardPage />) },
          { path: 'backlog', element: page(<BacklogPage />) },
          { path: 'ideas', element: page(<IdeasPage />) },
          { path: 'feedback', element: page(<FeedbackPage />) },
          { path: 'sprints', element: page(<SprintsPage />) },
          { path: 'releases', element: page(<ReleasesPage />) },
          { path: 'releases/:releaseId', element: page(<ReleaseDetailPage />) },
          { path: 'roadmap', element: page(<RoadmapPage />) },
          { path: 'calendar', element: page(<CalendarPage />) },
          { path: 'reports', element: page(<ReportsPage />) },
          { path: 'teams', element: page(<TeamsPage />) },
          { path: 'documents', element: page(<DocumentsPage />) },
          { path: 'projects', element: page(<ProjectsPage />) },
          { path: 'projects/:projectId', element: <Navigate to="overview" replace /> },
          { path: 'projects/:projectId/:tab', element: page(<ProjectWorkspacePage />) },
          { path: 'settings', element: <Navigate to="profile" replace /> },
          { path: 'settings/:section', element: page(<SettingsPage />) },
          { path: '*', element: page(<NotFoundPage />) },
        ],
      },
    ],
  },

  /* Backward-compatible flat route redirects */
  { path: '/board', element: <Navigate to={`${DEFAULT_HOME}/board`} replace /> },
  { path: '/backlog', element: <Navigate to={`${DEFAULT_HOME}/backlog`} replace /> },
  { path: '/ideas', element: <Navigate to={`${DEFAULT_HOME}/ideas`} replace /> },
  { path: '/feedback', element: <Navigate to={`${DEFAULT_HOME}/feedback`} replace /> },
  { path: '/sprints', element: <Navigate to={`${DEFAULT_HOME}/sprints`} replace /> },
  { path: '/releases', element: <Navigate to={`${DEFAULT_HOME}/releases`} replace /> },
  { path: '/releases/:releaseId', element: <Navigate to={`${DEFAULT_HOME}/releases`} replace /> },
  { path: '/roadmap', element: <Navigate to={`${DEFAULT_HOME}/roadmap`} replace /> },
  { path: '/calendar', element: <Navigate to={`${DEFAULT_HOME}/calendar`} replace /> },
  { path: '/reports', element: <Navigate to={`${DEFAULT_HOME}/reports`} replace /> },
  { path: '/teams', element: <Navigate to={`${DEFAULT_HOME}/teams`} replace /> },
  { path: '/documents', element: <Navigate to={`${DEFAULT_HOME}/documents`} replace /> },
  { path: '/projects', element: <Navigate to={`${DEFAULT_HOME}/projects`} replace /> },
  { path: '/projects/:projectId', element: <Navigate to={`${DEFAULT_HOME}/projects`} replace /> },
  { path: '/projects/:projectId/:tab', element: <Navigate to={`${DEFAULT_HOME}/projects`} replace /> },
  { path: '/settings', element: <Navigate to={`${DEFAULT_HOME}/settings`} replace /> },
  { path: '/settings/:section', element: <Navigate to={`${DEFAULT_HOME}/settings`} replace /> },

  /* Catch-all */
  {
    path: '*',
    element: <AppLayout />,
    children: [{ path: '*', element: page(<NotFoundPage />) }],
  },
];

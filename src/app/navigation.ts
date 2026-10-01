import {
  CalendarDays,
  FileText,
  FolderKanban,
  GanttChartSquare,
  Home,
  Layers,
  ListTodo,
  Rocket,
  Settings,
  SquareChartGantt,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

/** Route paths are centralised so links and breadcrumbs cannot drift. */
export const paths = {
  home: '/',
  myWork: '/my-work',
  projects: '/projects',
  project: (projectId: string, tab = 'overview'): string => `/projects/${projectId}/${tab}`,
  roadmap: '/roadmap',
  calendar: '/calendar',
  backlog: '/backlog',
  sprints: '/sprints',
  releases: '/releases',
  release: (releaseId: string): string => `/releases/${releaseId}`,
  reports: '/reports',
  teams: '/teams',
  documents: '/documents',
  settings: '/settings',
  settingsSection: (section: string): string => `/settings/${section}`,
} as const;

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  /** Matches nested routes so the parent item stays highlighted. */
  matchPrefix?: string;
  badgeKey?: 'myOpenWork' | 'blocked';
}

export interface NavSection {
  id: string;
  label?: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    id: 'overview',
    items: [
      { id: 'home', label: 'Home', to: paths.home, icon: Home },
      { id: 'my-work', label: 'My Work', to: paths.myWork, icon: UserRound, badgeKey: 'myOpenWork' },
    ],
  },
  {
    id: 'deliver',
    label: 'Deliver',
    items: [
      { id: 'projects', label: 'Projects', to: paths.projects, icon: FolderKanban, matchPrefix: '/projects' },
      { id: 'roadmap', label: 'Roadmap', to: paths.roadmap, icon: GanttChartSquare },
      { id: 'calendar', label: 'Calendar', to: paths.calendar, icon: CalendarDays },
      { id: 'backlog', label: 'Backlog', to: paths.backlog, icon: ListTodo },
      { id: 'sprints', label: 'Sprints', to: paths.sprints, icon: Layers },
      { id: 'releases', label: 'Releases', to: paths.releases, icon: Rocket, matchPrefix: '/releases' },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      { id: 'reports', label: 'Reports', to: paths.reports, icon: SquareChartGantt },
      { id: 'teams', label: 'Teams', to: paths.teams, icon: Users },
      { id: 'documents', label: 'Documents', to: paths.documents, icon: FileText },
    ],
  },
  {
    id: 'admin',
    label: 'Workspace',
    items: [{ id: 'settings', label: 'Settings', to: paths.settings, icon: Settings, matchPrefix: '/settings' }],
  },
];

export const PROJECT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'board', label: 'Board' },
  { id: 'list', label: 'List' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'releases', label: 'Releases' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Activity' },
] as const;

export type ProjectTabId = (typeof PROJECT_TABS)[number]['id'];

export const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Workspace profile' },
  { id: 'members', label: 'Members' },
  { id: 'roles', label: 'Roles & permissions' },
  { id: 'projects', label: 'Project settings' },
  { id: 'fields', label: 'Custom fields' },
  { id: 'statuses', label: 'Status configuration' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'audit', label: 'Audit activity' },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]['id'];

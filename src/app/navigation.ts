import {
  CalendarDays,
  FileText,
  FolderKanban,
  GanttChartSquare,
  Home,
  Layers,
  Lightbulb,
  ListTodo,
  MessageCircle,
  MessageSquare,
  Rocket,
  Settings,
  SquareChartGantt,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';

/** Build a path under /w/:workspaceId/p/:productId/:module */
export function productPath(workspaceId: string, productId: string, module: string): string {
  return `/w/${workspaceId}/p/${productId}/${module}`;
}

const DEFAULT_WS = 'ws-1';
const DEFAULT_PRODUCT = 'p-1';

function wp(module: string): string {
  return productPath(DEFAULT_WS, DEFAULT_PRODUCT, module);
}

/** Route paths are centralised so links and breadcrumbs cannot drift. */
export const paths = {
  home: wp(''),
  myWork: '/my-work',
  chat: wp('chat'),
  projects: wp('board'),
  project: (projectId: string, tab = 'overview'): string => `/projects/${projectId}/${tab}`,
  ideas: wp('ideas'),
  feedback: wp('feedback'),
  roadmap: wp('roadmap'),
  calendar: wp('calendar'),
  backlog: wp('backlog'),
  sprints: wp('sprints'),
  releases: wp('releases'),
  release: (releaseId: string): string => wp(`releases/${releaseId}`),
  reports: wp('reports'),
  teams: wp('teams'),
  documents: wp('documents'),
  settings: wp('settings'),
  settingsSection: (section: string): string => wp(`settings/${section}`),
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
    label: 'Overview',
    items: [
      { id: 'home', label: 'Home', to: paths.home, icon: Home },
      { id: 'my-work', label: 'My Work', to: paths.myWork, icon: UserRound, badgeKey: 'myOpenWork' },
      { id: 'chat', label: 'Chat', to: paths.chat, icon: MessageCircle, matchPrefix: wp('chat') },
    ],
  },
  {
    id: 'discovery',
    label: 'Discovery',
    items: [
      { id: 'ideas', label: 'Ideas', to: paths.ideas, icon: Lightbulb, matchPrefix: wp('ideas') },
      { id: 'feedback', label: 'Feedback', to: paths.feedback, icon: MessageSquare, matchPrefix: wp('feedback') },
    ],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    items: [
      { id: 'projects', label: 'Board', to: paths.projects, icon: FolderKanban, matchPrefix: wp('board') },
      { id: 'backlog', label: 'Backlog', to: paths.backlog, icon: ListTodo },
      { id: 'sprints', label: 'Sprints', to: paths.sprints, icon: Layers },
    ],
  },
  {
    id: 'plan',
    label: 'Plan',
    items: [
      { id: 'roadmap', label: 'Roadmap', to: paths.roadmap, icon: GanttChartSquare },
      { id: 'calendar', label: 'Calendar', to: paths.calendar, icon: CalendarDays },
      { id: 'releases', label: 'Releases', to: paths.releases, icon: Rocket, matchPrefix: wp('releases') },
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
    items: [{ id: 'settings', label: 'Settings', to: paths.settings, icon: Settings, matchPrefix: wp('settings') }],
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
  { id: 'chat-roles', label: 'Chat roles' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'audit', label: 'Audit activity' },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]['id'];

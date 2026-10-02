import { lazy } from 'react';
import type { Permission } from '@/types/domain';

export interface DrawerTab {
  id: string;
  label: string;
  countKey?: 'comments' | 'todos' | 'attachments' | 'requirements';
  permission?: Permission;
  component: React.LazyExoticComponent<React.ComponentType<{ taskId: string }>>;
}

export const drawerTabs: DrawerTab[] = [
  { id: 'overview', label: 'Overview', component: lazy(() => import('./tabs/OverviewTab')) },
  { id: 'requirements', label: 'Requirements', countKey: 'requirements', component: lazy(() => import('./tabs/RequirementsTab')) },
  { id: 'todos', label: 'To-dos', countKey: 'todos', component: lazy(() => import('./tabs/TodosTab')) },
  { id: 'comments', label: 'Comments', countKey: 'comments', component: lazy(() => import('./tabs/CommentsTab')) },
  { id: 'design', label: 'Design', permission: 'design.view', component: lazy(() => import('./tabs/DesignTab')) },
  { id: 'architecture', label: 'Architecture', permission: 'architecture.review', component: lazy(() => import('./tabs/ArchitectureTab')) },
  { id: 'qa', label: 'QA', permission: 'qa.manage', component: lazy(() => import('./tabs/QATab')) },
];

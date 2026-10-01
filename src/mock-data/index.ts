/**
 * Single entry point for the mock fixture set.
 *
 * Every screen reads from here (through the WorkspaceProvider) so the same
 * tasks, sprints, releases and roadmap items back the dashboard, board,
 * calendar, backlog and reports. Swapping this module for API calls is the
 * only change required to go live.
 */

export { users, teams, workspaces, CURRENT_USER_ID, DEFAULT_WORKSPACE_ID } from './people';
export { projects, labels, risks, customFieldDefinitions, TODAY, daysAgo, daysFromToday, iso } from './projects';
export { sprints, releases, milestones, roadmapItems } from './planning';
export { mockTasks, mockSubtasks, mockComments, mockAttachments } from './tasks';
export { activities, notifications, documents } from './activity';

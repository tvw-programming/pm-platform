import { addDays, eachDayOfInterval, isWithinInterval, startOfDay } from 'date-fns';
import type {
  BurndownPoint,
  CalendarEvent,
  ID,
  Milestone,
  Priority,
  Project,
  Release,
  Sprint,
  Task,
  TaskStatus,
  Team,
  User,
  VelocityPoint,
} from '@/types/domain';
import { isOverdue, percent, toDate } from './format';

/* ------------------------------------------------------------- lookups    */

export function byId<T extends { id: ID }>(items: readonly T[]): Map<ID, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export function findUser(users: readonly User[], id?: ID): User | undefined {
  return id ? users.find((u) => u.id === id) : undefined;
}

/* ------------------------------------------------------------- task maths */

export const DONE_STATUSES: readonly TaskStatus[] = ['done'];

export function isDone(task: Task): boolean {
  return DONE_STATUSES.includes(task.status);
}

export function taskIsOverdue(task: Task): boolean {
  return isOverdue(task.dueDate, isDone(task));
}

export function checklistProgress(task: Task): { done: number; total: number } {
  return { done: task.checklist.filter((item) => item.done).length, total: task.checklist.length };
}

export function countByStatus(tasks: readonly Task[]): Record<TaskStatus, number> {
  const base: Record<TaskStatus, number> = {
    backlog: 0,
    todo: 0,
    in_progress: 0,
    in_review: 0,
    blocked: 0,
    done: 0,
  };
  for (const task of tasks) base[task.status] += 1;
  return base;
}

export function countByPriority(tasks: readonly Task[]): Record<Priority, number> {
  const base: Record<Priority, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const task of tasks) base[task.priority] += 1;
  return base;
}

export function sumPoints(tasks: readonly Task[]): number {
  return tasks.reduce((total, task) => total + (task.storyPoints ?? 0), 0);
}

/* ---------------------------------------------------------- project stats */

export interface ProjectStats {
  total: number;
  done: number;
  blocked: number;
  overdue: number;
  inProgress: number;
  progress: number;
  points: number;
  donePoints: number;
}

export function projectStats(tasks: readonly Task[], projectId: ID): ProjectStats {
  const scoped = tasks.filter((t) => t.projectId === projectId);
  const done = scoped.filter(isDone);
  return {
    total: scoped.length,
    done: done.length,
    blocked: scoped.filter((t) => t.status === 'blocked').length,
    overdue: scoped.filter(taskIsOverdue).length,
    inProgress: scoped.filter((t) => t.status === 'in_progress' || t.status === 'in_review').length,
    progress: percent(done.length, scoped.length),
    points: sumPoints(scoped),
    donePoints: sumPoints(done),
  };
}

/* --------------------------------------------------------- workload stats */

export interface WorkloadRow {
  userId: ID;
  name: string;
  initials: string;
  color: string;
  openTasks: number;
  points: number;
  capacity: number;
  allocated: number;
  utilisation: number;
  overdue: number;
}

export function workloadByUser(tasks: readonly Task[], users: readonly User[]): WorkloadRow[] {
  return users
    .map((user) => {
      const assigned = tasks.filter((t) => t.assigneeId === user.id && !isDone(t));
      return {
        userId: user.id,
        name: user.name,
        initials: user.initials,
        color: user.avatarColor,
        openTasks: assigned.length,
        points: sumPoints(assigned),
        capacity: user.capacityHoursPerWeek,
        allocated: user.allocatedHoursPerWeek,
        utilisation: percent(user.allocatedHoursPerWeek, user.capacityHoursPerWeek),
        overdue: assigned.filter(taskIsOverdue).length,
      };
    })
    .sort((a, b) => b.utilisation - a.utilisation);
}

export function teamWorkload(
  tasks: readonly Task[],
  users: readonly User[],
  teams: readonly Team[],
): { team: string; open: number; points: number; capacity: number }[] {
  return teams.map((team) => {
    const memberIds = new Set(team.memberIds);
    const open = tasks.filter((t) => t.assigneeId && memberIds.has(t.assigneeId) && !isDone(t));
    const capacity = users
      .filter((u) => memberIds.has(u.id))
      .reduce((total, u) => total + u.capacityHoursPerWeek, 0);
    return { team: team.key, open: open.length, points: sumPoints(open), capacity };
  });
}

/* ------------------------------------------------------------- sprint math */

export function sprintTasks(tasks: readonly Task[], sprintId: ID): Task[] {
  return tasks.filter((t) => t.sprintId === sprintId);
}

export function velocitySeries(sprints: readonly Sprint[], tasks: readonly Task[]): VelocityPoint[] {
  return sprints
    .filter((sprint) => sprint.status !== 'planned')
    .slice(-8)
    .map((sprint) => {
      const scoped = sprintTasks(tasks, sprint.id);
      return {
        sprintName: sprint.name.replace(/^[A-Z]+ /, ''),
        committed: sprint.committedPoints || sumPoints(scoped),
        completed: sprint.completedPoints || sumPoints(scoped.filter(isDone)),
      };
    });
}

/**
 * Burndown is derived rather than stored: remaining points start at the
 * sprint commitment and step down using the completion dates we have, with a
 * straight ideal line for comparison.
 */
export function burndownSeries(sprint: Sprint, tasks: readonly Task[]): BurndownPoint[] {
  const start = startOfDay(toDate(sprint.startDate));
  const end = startOfDay(toDate(sprint.endDate));
  const days = eachDayOfInterval({ start, end });
  const scoped = sprintTasks(tasks, sprint.id);
  const committed = sprint.committedPoints || sumPoints(scoped) || 1;
  const today = startOfDay(new Date());

  let remaining = committed;
  return days.map((day, index) => {
    const completedToday = scoped
      .filter((task) => task.completedAt && startOfDay(toDate(task.completedAt)).getTime() === day.getTime())
      .reduce((total, task) => total + (task.storyPoints ?? 0), 0);
    remaining = Math.max(0, remaining - completedToday);
    const ideal = Math.max(0, committed - (committed / Math.max(1, days.length - 1)) * index);
    return {
      date: day.toISOString().slice(0, 10),
      remaining: day.getTime() <= today.getTime() ? remaining : Number.NaN,
      ideal: Math.round(ideal * 10) / 10,
    };
  });
}

/* --------------------------------------------------------- cycle/lead time */

export interface FlowMetric {
  label: string;
  cycleTimeDays: number;
  leadTimeDays: number;
  completed: number;
}

export function flowMetrics(tasks: readonly Task[], projects: readonly Project[]): FlowMetric[] {
  return projects.map((project) => {
    const completed = tasks.filter((t) => t.projectId === project.id && t.completedAt);
    if (completed.length === 0) {
      return { label: project.key, cycleTimeDays: 0, leadTimeDays: 0, completed: 0 };
    }
    const cycle =
      completed.reduce((total, task) => {
        const from = toDate(task.startDate ?? task.createdAt).getTime();
        const to = toDate(task.completedAt!).getTime();
        return total + Math.max(0, to - from);
      }, 0) / completed.length;
    const lead =
      completed.reduce((total, task) => {
        const from = toDate(task.createdAt).getTime();
        const to = toDate(task.completedAt!).getTime();
        return total + Math.max(0, to - from);
      }, 0) / completed.length;
    const toDays = (ms: number): number => Math.round((ms / 86_400_000) * 10) / 10;
    return { label: project.key, cycleTimeDays: toDays(cycle), leadTimeDays: toDays(lead), completed: completed.length };
  });
}

/* ----------------------------------------------------------- calendar feed */

/**
 * Builds the calendar feed from the existing task, milestone, release and
 * sprint fixtures — nothing is duplicated for the calendar's benefit.
 */
export function buildCalendarEvents(
  tasks: readonly Task[],
  milestones: readonly Milestone[],
  releases: readonly Release[],
  sprints: readonly Sprint[],
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const task of tasks) {
    if (!task.dueDate) continue;
    events.push({
      id: `ev-task-${task.id}`,
      title: `${task.key} · ${task.title}`,
      kind: 'task',
      start: task.dueDate,
      end: task.dueDate,
      allDay: true,
      projectId: task.projectId,
      sourceId: task.id,
      assigneeId: task.assigneeId,
      status: task.status,
      priority: task.priority,
    });
  }

  for (const milestone of milestones) {
    events.push({
      id: `ev-ms-${milestone.id}`,
      title: `◆ ${milestone.name}`,
      kind: 'milestone',
      start: milestone.date,
      end: milestone.date,
      allDay: true,
      projectId: milestone.projectId,
      sourceId: milestone.id,
    });
  }

  for (const release of releases) {
    events.push({
      id: `ev-rel-${release.id}`,
      title: `▲ ${release.name} ${release.version}`,
      kind: 'release',
      start: release.releasedOn ?? release.targetDate,
      end: release.releasedOn ?? release.targetDate,
      allDay: true,
      projectId: release.projectId,
      sourceId: release.id,
    });
  }

  for (const sprint of sprints) {
    events.push({
      id: `ev-sp-${sprint.id}`,
      title: `${sprint.name}`,
      kind: 'sprint',
      // FullCalendar treats all-day end dates as exclusive.
      start: sprint.startDate,
      end: addDays(toDate(sprint.endDate), 1).toISOString().slice(0, 10),
      allDay: true,
      projectId: sprint.projectId,
      sourceId: sprint.id,
    });
  }

  return events;
}

/* ------------------------------------------------------------- deadlines   */

export interface DeadlineRow {
  id: ID;
  label: string;
  kind: 'task' | 'milestone' | 'release';
  date: string;
  projectId: ID;
  overdue: boolean;
}

export function upcomingDeadlines(
  tasks: readonly Task[],
  milestones: readonly Milestone[],
  releases: readonly Release[],
  withinDays = 21,
): DeadlineRow[] {
  const today = startOfDay(new Date());
  const horizon = addDays(today, withinDays);
  const rows: DeadlineRow[] = [];

  for (const task of tasks) {
    if (!task.dueDate || isDone(task)) continue;
    const date = startOfDay(toDate(task.dueDate));
    if (date < addDays(today, -14) || date > horizon) continue;
    rows.push({
      id: task.id,
      label: `${task.key} · ${task.title}`,
      kind: 'task',
      date: task.dueDate,
      projectId: task.projectId,
      overdue: date < today,
    });
  }
  for (const milestone of milestones) {
    if (milestone.completed) continue;
    const date = startOfDay(toDate(milestone.date));
    if (!isWithinInterval(date, { start: addDays(today, -14), end: horizon })) continue;
    rows.push({
      id: milestone.id,
      label: milestone.name,
      kind: 'milestone',
      date: milestone.date,
      projectId: milestone.projectId,
      overdue: date < today,
    });
  }
  for (const release of releases) {
    if (release.status === 'released' || release.status === 'cancelled') continue;
    const date = startOfDay(toDate(release.targetDate));
    if (!isWithinInterval(date, { start: addDays(today, -14), end: horizon })) continue;
    rows.push({
      id: release.id,
      label: `${release.name} ${release.version}`,
      kind: 'release',
      date: release.targetDate,
      projectId: release.projectId,
      overdue: date < today,
    });
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 14);
}

export function releaseReadiness(release: Release): number {
  return percent(release.readiness.filter((check) => check.done).length, release.readiness.length);
}

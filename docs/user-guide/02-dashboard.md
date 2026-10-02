# Dashboard

The Dashboard is your daily starting point. It surfaces the metrics and tasks that matter most to you right now, without requiring you to visit every section of the app.

---

## Overview

![Dashboard metric cards and My Work panel](/screenshots/dashboard-metric-cards.svg)

The dashboard is divided into two areas:

- **Metric cards** (top row) — workspace-wide or project-scoped counts at a glance
- **My Work** (right panel) — tasks assigned to you, sorted by priority

---

## Metric cards

Each card shows a count for the current sprint alongside a delta badge indicating the change from the previous sprint.

| Card | What it measures |
|------|-----------------|
| **Open Tasks** | Tasks in To Do or Blocked state |
| **In Progress** | Tasks actively being worked on |
| **Completed** | Tasks closed this sprint |
| **Blocked** | Tasks stuck waiting on a dependency |

**Delta badge colours:**
- 🟢 Green — improved (fewer open, more completed)
- 🔴 Red — worsened (more blocked, fewer completed)
- ⬜ Grey — no change

Click any card to jump directly to the filtered Tasks view for that status.

---

## My Work panel

The **My Work** panel lists every task assigned to you across the active sprint. Tasks are sorted by priority (P0 first) and then by due date.

Each task row shows:
- **Priority badge** — P0 (red) through P4 (grey)
- **Task title** — click to open the detail drawer
- **Status chip** — drag or click to change status inline
- **Sprint label** — which sprint this task is in

### Updating a task from the dashboard

You don't need to navigate away to update a task's status:

1. Click the **status chip** next to any task in My Work
2. Choose the new status from the dropdown
3. The metric cards update immediately

---

## Sprint progress bar

Below the metric cards, a progress bar shows what percentage of the current sprint's story points have been completed. Hover over it to see:

- **Total points committed** at sprint start
- **Points completed** so far
- **Points remaining** to reach 100%
- **Days remaining** in the sprint

If the progress bar is below the expected pace line (shown as a thin grey line), the sprint may be at risk.

---

## Recent activity feed

The bottom of the dashboard shows a chronological feed of recent activity across the project:

- Task status changes
- New comments on tasks you're watching
- Chat events addressed to your role
- Sprint state changes (started, closed)

Click any activity item to jump to the relevant object.

---

## Customizing the dashboard

### Switching project scope

The dashboard defaults to showing data for your **currently selected project**. To see workspace-wide aggregates:

1. Click the project name in the top bar
2. Select **All Projects** from the dropdown

### Pinning widgets

Admins can configure which widgets appear by default for new members. Go to **Settings → Project Settings → Dashboard Layout**.

---

## Daily workflow

A typical PM morning routine using the dashboard:

1. **Check metric cards** — is anything blocked since yesterday?
2. **Scan My Work** — update statuses from yesterday's progress
3. **Review activity feed** — catch up on comments and decisions
4. **Check sprint progress bar** — are we on pace?

This typically takes 2–3 minutes and replaces the need for a status-update meeting.

# FAQ

Answers to the most common questions about using Meridian.

---

## Getting started

**Q: How do I create a workspace?**
When you first sign up, the onboarding flow guides you through workspace creation. If you need a second workspace, click the workspace name in the top-left corner and select **+ New Workspace**.

**Q: Can I invite someone without giving them full edit access?**
Yes — invite them as a **Viewer**. Viewers can see everything but cannot create or edit tasks, send chat messages, or modify settings. See [Settings → Members →](09-settings.md) for details.

**Q: How do I switch between projects?**
Click the project name in the left sidebar. A dropdown lists all projects in your workspace. Press `⌘J` for a keyboard-driven project switcher.

---

## Tasks

**Q: What's the difference between types — Feature, Bug, Chore, and Spike?**
- **Feature** — new user-facing functionality
- **Bug** — something broken
- **Chore** — technical work with no user-visible change
- **Spike** — time-boxed research with a defined output

**Q: Can I assign a task to multiple people?**
No — each task has one assignee (the person responsible for completion). If multiple people are involved, create sub-tasks or use the task description to coordinate.

**Q: How do I find tasks assigned to me?**
Use the **My Work** panel on the Dashboard, or go to Tasks and filter by **Assignee → Me**.

**Q: What happens to tasks when a sprint closes?**
When you close a sprint, you choose what to do with incomplete tasks: move them to the backlog, carry them to the next sprint, or decide per task.

**Q: How do I archive old tasks?**
Select tasks in list view, then use the bulk action bar → **Archive**. Archived tasks are hidden from normal views but remain searchable. Filter by **Status → Archived** to find them.

---

## Sprints

**Q: Can I have more than one active sprint at a time?**
No — only one sprint can be active per project at a time. If you need parallel workstreams, use separate projects.

**Q: What does story points mean, and do I have to use them?**
Story points are relative effort estimates using the Fibonacci sequence (1, 2, 3, 5, 8, 13). They're optional — if your team doesn't estimate, just leave the field blank. Velocity charts will show task counts instead of points.

**Q: Can I add tasks to a sprint after it's started?**
Yes. Drag tasks from the backlog into the active sprint or click **+ Task** on the sprint board. Added tasks are tracked as "scope added after start" and are noted in the sprint close summary.

**Q: What is the burndown chart and how should I read it?**
The burndown chart shows remaining story points over time. A line below the ideal (dashed) means you're ahead; above it means you're at risk. See [Sprints & Backlog →](04-sprints-backlog.md) for the full explanation.

---

## Chat & Events

**Q: What is Event Mode and when should I use it?**
Event Mode sends a structured message that triggers a playbook — a workflow that routes tickets to specific roles and tracks responses. Use it for decisions that need sign-off from multiple roles (architecture decisions, deployment approvals, etc.). For casual questions, use regular chat.

**Q: Why didn't someone receive a ticket from an event I fired?**
Check two things:
1. Is the role assigned in **Settings → Chat Roles**? If a role has no one assigned, it's skipped.
2. Is the primary assignee marked as out-of-office with no backup?

**Q: What happens if a ticket's SLA expires?**
The ticket escalates to the backup for that role. If there's no backup, the ticket is flagged as escalation-failed in the playbook tracker. The playbook continues with other roles.

**Q: Can I cancel an event after firing it?**
Yes. Open the playbook tracker (right panel in Chat) and click **Cancel** on the active playbook instance. This cancels all pending tickets; resolved tickets remain in the thread.

**Q: What's the difference between a ticket kind "approve_reject" and "review"?**
- **approve_reject** — a binary decision; your vote (Approve/Reject) feeds into the playbook's outcome
- **review** — you review content and mark it done; there's no approve/reject binary

---

## Roadmap & Releases

**Q: What's the difference between an epic and a task?**
An epic is a large initiative that spans multiple sprints and groups multiple tasks. Tasks are the individual units of work. Epics appear on the timeline; tasks appear on the sprint board.

**Q: How do I advance a release stage?**
Open the release, find the active stage card, and click **Advance →**. You must have Admin access. The previous stage must be complete before you can advance.

**Q: Can I have a different stage pipeline for different projects?**
Yes. Stage pipelines are configured per-project in **Settings → Project Settings → Release Stages**.

---

## Reports

**Q: Why is my velocity chart showing 0 for some sprints?**
If tasks in that sprint don't have story points assigned, the velocity shows 0 points (even if tasks were completed). Task counts are always shown regardless.

**Q: Can I export report data?**
Yes. Each chart has an **Export** button that downloads a PNG (image) or CSV (raw data).

**Q: How is cycle time calculated?**
Cycle time = the number of calendar days from a task's creation date to when it first moves to **Done** status. It includes weekends.

---

## Settings & Admin

**Q: How do I change my workspace URL?**
Go to **Settings → Workspace Profile** and edit the URL slug. The new URL takes effect immediately — update any bookmarks.

**Q: Can I undo a member removal?**
No — removing a member is immediate. Re-invite them at **Settings → Members** to restore access. Their past tasks and comments remain visible.

**Q: How do integrations work with GitHub?**
Once connected, you can link a PR to a task from the task detail drawer (GitHub PR URL field). When the PR is merged, the task can optionally auto-close. Set this in **Settings → Integrations → GitHub → Configure**.

---

## Billing & Plans

**Q: What's included in the Free plan?**
The Free plan includes up to 5 members, unlimited tasks, 1 project, and basic reports. Integrations and chat event mode require a paid plan.

**Q: How do I upgrade?**
Click the workspace name → **Manage Plan** → **Upgrade**. Changes take effect immediately.

# Sprints & Backlog

Sprints are time-boxed cycles of committed work. The backlog is the pool of tasks waiting to be scheduled. Together they form the core delivery rhythm of your team.

---

## The Backlog

The backlog is an ordered list of all tasks that are not assigned to a sprint. It is the single source of truth for upcoming work.

### Grooming the backlog

Backlog grooming means keeping the list prioritized, estimated, and free of stale items. Best practices:

- **Assign a priority** to every task — unranked items always float to the bottom
- **Add story points** before sprint planning so you can make capacity decisions
- **Archive old tasks** (90+ days untouched) to reduce noise
- **Break large tasks** — anything over 13 points should be split before it enters a sprint

### Ordering the backlog

Drag tasks up or down to re-order them. The top of the backlog is what gets pulled into the next sprint. The order persists for everyone on the team.

---

## Drag tasks into a sprint

![Dragging a task from backlog to sprint](/screenshots/task-drag-to-sprint.svg)

The Sprints page has a split-panel layout: **Backlog** on the left, **Sprint** on the right. Drag any task from the left panel and drop it into the sprint on the right. A drop zone highlights when you drag over it.

**Drag multiple tasks at once:** select tasks using checkboxes (or `⌘A`) in the backlog panel, then drag the selection into the sprint.

---

## Starting a sprint

![Start sprint dialog](/screenshots/sprint-start-dialog.svg)

When you're ready to commit to a set of work:

1. Click **Start Sprint** (appears when you have tasks in the sprint and no sprint is active)
2. Set the **Sprint name** (e.g. "Sprint 12 — Auth work")
3. Write a **Sprint goal** — a single sentence that defines success
4. Choose the **end date** (the start date is today)
5. Review the **scope warning** — it shows how many tasks and story points you're committing
6. Click **Start Sprint** to begin

Once started, the sprint is locked — tasks can still be added (scope changes) but points are tracked against the original commitment.

---

## Running the sprint

### Active sprint board

The active sprint board shows tasks in status columns. Update task status by dragging cards or clicking the status chip on any task.

### Burndown chart

![Sprint burndown chart with annotations](/screenshots/sprint-burndown-annotated.svg)

The burndown chart shows remaining story points over time. Two lines:

- **Dashed ideal line** — linear pace from total points to zero by the end date
- **Solid actual line** — real remaining points as tasks are completed

**Reading the chart:**
- If the actual line is **below** the ideal line → team is ahead of schedule
- If the actual line is **above** the ideal line → team is at risk of not finishing
- A flat stretch in the actual line → no tasks were completed that day (blocked or weekend)
- A steep drop → a high-point task was completed

The **TODAY marker** shows your current position. Anything to the right is the remaining work.

---

## Closing a sprint

![Sprint close dialog with incomplete tasks handling](/screenshots/sprint-close-dialog.svg)

When the sprint end date arrives (or you choose to close it early):

1. Click **Close Sprint** from the sprint menu
2. Review the **completion stats** (Done, Incomplete, completion %, total points)
3. Choose what to do with incomplete tasks:
   - **Move to Backlog** — tasks return to the backlog unscheduled
   - **Move to Next Sprint** — tasks carry over to the next sprint
   - **Choose per task** — review each incomplete task individually
4. Optionally enable **Retrospective** to open the retrospective notes editor
5. Click **Close Sprint**

Completed sprints are archived and contribute to the velocity chart in Reports.

---

## Sprint velocity

Velocity is the average story points completed per sprint, measured over the last 3–6 sprints. The Reports page shows a velocity chart. Use it for:

- **Capacity planning** — don't commit more than your average velocity
- **Identifying trends** — is velocity improving, declining, or steady?
- **Sprint forecasting** — how many sprints to finish the backlog at current velocity?

---

## Backlog vs sprint: what belongs where?

| Where | What goes here |
|-------|---------------|
| **Backlog** | Ideas, future work, unestimated tasks, bugs not yet prioritized |
| **Sprint** | Committed work for the current cycle, well-defined and estimated |

Don't put tasks in a sprint "just in case" — over-committing reduces your completion rate and makes velocity unreliable. A good rule: commit to 80% of your average velocity to leave room for unexpected bugs and support work.

---

## Sprint settings

Configure sprint defaults in **Settings → Project Settings**:

- **Default duration** — 1 week, 2 weeks, or custom
- **Auto-close sprints** — automatically close a sprint when the end date passes
- **Velocity baseline** — choose how many recent sprints to average for capacity suggestions

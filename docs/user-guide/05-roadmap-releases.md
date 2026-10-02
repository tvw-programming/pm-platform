# Roadmap & Releases

The Roadmap gives you a timeline view of your product's planned work. Releases track versioned deployments through a configurable stage pipeline.

---

## Roadmap overview

The Roadmap page shows **Epics** on a horizontal timeline. Each epic is a large piece of work that spans multiple sprints and may involve multiple teams.

![Roadmap page with epics and milestones](/screenshots/roadmap.svg)

---

## Epics

An epic groups related tasks and features under a single goal with a target date range.

### Creating an epic

1. Click **+ Epic** in the Roadmap toolbar
2. Fill in:
   - **Title** — the feature or initiative name
   - **Type** — Feature, Initiative, or Milestone
   - **Owner** — who is accountable for delivery
   - **Start date** and **Target date**
3. Click **Create Epic**

The epic appears as a horizontal bar on the timeline.

### Epic detail panel

![Epic detail side panel](/screenshots/roadmap-item-detail.svg)

Click any epic to open the detail panel on the right. It shows:

- **Type, Status, Owner** — editable inline
- **Dates** — start and target date pickers
- **Progress bar** — percentage of linked tasks completed
- **Linked sprints** — which sprints contain tasks for this epic
- **Linked tasks** — individual tasks associated with the epic
- **Linked release** — which versioned release this epic is part of

### Epic statuses

| Status | Meaning |
|--------|---------|
| **Planned** | Not started, target date in the future |
| **In Progress** | Work has begun in a sprint |
| **At Risk** | Progress is behind the expected pace |
| **Completed** | All linked tasks are done |
| **Cancelled** | Deprioritized and removed from active planning |

### Linking tasks to an epic

From the task detail drawer, find the **Epic** field and select the epic from the dropdown. Or from the epic detail panel, click **+ Link Task** and search for existing tasks.

---

## Roadmap timeline navigation

- **Scroll horizontally** to move forward or backward in time
- **Zoom level** — use the zoom controls (top right) to switch between Month, Quarter, and Year views
- **Drag epic bars** to adjust start/end dates directly on the timeline
- **Color coding** — epics are colored by status (blue = planned, amber = at risk, green = completed)

---

## Milestones

A milestone is a zero-duration marker on the timeline — a date by which something must be true (e.g. "Beta launch", "External API stable"). Create one with **+ Milestone** in the toolbar.

---

## Releases

Releases track a versioned deployment through your custom stage pipeline.

### Creating a release

1. Go to **Releases** in the left sidebar
2. Click **+ Release**
3. Enter the version number (e.g. "v2.4.0"), a name, and a target date
4. Link epics to the release

### Deployment stages

![Release deployment stages — QA in progress](/screenshots/release-stages.svg)

Each release moves through configurable deployment stages. The default pipeline is:

```
Staging → QA Review → UAT → Production
```

**How stages work:**
- Each stage has a status: Not Started, In Progress, or Complete
- Stages must be advanced in order — you can't skip to Production without passing QA
- Click **Advance →** inside the active stage card to mark it complete and unlock the next

### Customizing stages

Admins can configure the stage pipeline in **Settings → Project Settings → Release Stages**. Add, remove, or rename stages and set per-stage requirements (e.g. "requires sign-off from QA lead").

### Release statuses

| Status | Meaning |
|--------|---------|
| **Planned** | No stages started |
| **Staging** | In first stage |
| **QA Review** | QA stage active |
| **UAT** | User acceptance testing stage active |
| **Released** | All stages complete, shipped to production |

---

## Epic → Release linking

Linking an epic to a release means all tasks within that epic contribute to the release's progress.

From the epic detail panel:
1. Scroll to **Linked release**
2. Click **+ Link release**
3. Select the release from the dropdown

From the release detail:
1. Open the release
2. Click **+ Link Epic**
3. Search and select the epic

---

## Planning with the roadmap

A healthy roadmap planning workflow:

1. **Quarterly planning** — create epics for the next quarter with rough date ranges
2. **Sprint planning** — pull tasks from the highest-priority epics into the sprint
3. **Weekly review** — check epic progress bars; flag anything "At Risk"
4. **Release planning** — assign a subset of completed epics to a release; advance stages as work completes

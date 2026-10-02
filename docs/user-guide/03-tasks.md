# Tasks

Tasks are the atomic unit of work in Meridian. Everything you track, estimate, and ship is a task.

---

## Task anatomy

Every task has the following fields:

| Field | Description |
|-------|-------------|
| **Title** | Short, action-oriented description |
| **Type** | Feature, Bug, Chore, or Spike |
| **Status** | To Do → In Progress → Review → Done (or Blocked) |
| **Priority** | P0 (critical) → P4 (someday) |
| **Assignee** | One person responsible for completion |
| **Story points** | Optional effort estimate (Fibonacci: 1 2 3 5 8 13) |
| **Labels** | Free-form tags for grouping (e.g. "auth", "mobile") |
| **Sprint** | Which sprint the task is assigned to |
| **Description** | Markdown-formatted details, acceptance criteria |
| **Attachments** | Files, images, Figma links |
| **Comments** | Threaded discussion on the task |
| **Linked items** | Related tasks, blocking/blocked-by relationships |

---

## Creating a task

### Quick create

Press **`⌘N`** anywhere in the app to open the quick-create modal. Fill in the title and press **Enter** — the task lands in the backlog with your default project.

### Full create

Click **+ Task** in the task list toolbar, or press **`⌘N`** then click **More options**. This opens the full create form where you can set all fields upfront.

### Inline create in the board

On the board view, click **+ Add Task** at the bottom of any status column. Type the title and press **Enter**. The task is created in that status immediately.

---

## Views: Board and List

Toggle between views using the **`V`** shortcut or the view switcher in the toolbar.

### Board view

![Tasks board view](/screenshots/tasks-board.svg)

The board shows tasks as cards grouped by status columns. Drag cards between columns to update their status. Each column shows a count and the total story points for tasks in that state.

**Board tips:**
- Drag a card and hold it over a column header for 1 second to scroll the board
- Double-click a card to open the detail drawer without leaving the board
- Cards show the assignee avatar, priority badge, and story points

### List view

The list shows tasks as rows, sorted by priority by default. Click any column header to re-sort. Use the list view when you need to scan many tasks quickly or do bulk operations.

---

## Filtering tasks

![Filter dropdown panel](/screenshots/task-filter-dropdown.svg)

Click the **Filters** button in the toolbar or press **`F`**. The filter panel lets you combine multiple conditions:

| Filter | Options |
|--------|---------|
| **Type** | Feature, Bug, Chore, Spike (multi-select) |
| **Priority** | P0–P4 (multi-select) |
| **Assignee** | Member names or "Unassigned" |
| **Label** | Any existing label (multi-select) |
| **Sprint** | Active sprint, specific sprint, or Backlog |
| **Status** | Any combination of statuses |

Active filters appear as chips in the toolbar. Click a chip to remove that filter. Click **Clear all** to reset.

**Saved filters:** Click **Save filter** after configuring to save it with a name. Saved filters appear in the filter dropdown for one-click reuse.

---

## Bulk actions

![Bulk action bar with 4 tasks selected](/screenshots/task-bulk-select.svg)

Select multiple tasks to perform bulk operations:

1. **Click the checkbox** on the left of any task row in list view (or hold `⌘` and click cards on the board)
2. The **bulk action bar** appears at the bottom showing how many tasks are selected
3. Choose from: **Move to Sprint**, **Assign to**, **Add Label**, **Set Priority**, **Archive**

**Select all:** Press `⌘A` to select all tasks matching the current filter.

**Deselect:** Press `Esc` or click anywhere outside a task to deselect.

---

## Task detail drawer

Click any task to open the detail drawer on the right side. The drawer shows all fields, the description, comments, and linked items.

You can:
- **Edit any field** inline by clicking on it
- **Add a comment** at the bottom of the drawer
- **Link tasks** using the "Linked items" section — set a relationship as "Blocks", "Is blocked by", or "Relates to"
- **Watch the task** (bell icon) to receive notifications on changes

The drawer stays open as you navigate the list, so you can click different tasks to compare them.

---

## Keyboard shortcuts for tasks

| Shortcut | Action |
|----------|--------|
| `⌘N` | New task |
| `⌘K` | Search / open task |
| `V` | Toggle board / list view |
| `F` | Open filter panel |
| `⌘A` | Select all tasks |
| `P` | Set priority (with task open) |
| `S` | Set status (with task open) |
| `L` | Add label (with task open) |
| `⌘I` | Assign to me (with task open) |
| `Esc` | Close detail / deselect |

---

## Custom fields

Admins can add custom fields to tasks via **Settings → Custom Fields**. Custom field types:

- **Text** — free-form string
- **Number** — integer or decimal
- **Date** — date picker
- **Select** — single choice from a predefined list
- **Multi-select** — multiple choices
- **URL** — validated link

Custom fields appear in the task detail drawer and can be used as filter criteria.

---

## Task types explained

| Type | When to use |
|------|------------|
| **Feature** | New user-facing functionality |
| **Bug** | Something broken that needs fixing |
| **Chore** | Technical work with no user-visible change (dependency updates, refactoring) |
| **Spike** | Time-boxed research or prototyping with a fixed time budget |

Spikes should always have a defined output (a decision, a prototype, a document) and a maximum time allocation in the description.

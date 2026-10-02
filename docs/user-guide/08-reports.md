# Reports

The Reports page provides analytics on your team's delivery. It surfaces four key charts to help you spot trends, plan capacity, and identify bottlenecks.

---

## Reports overview

![Reports page with velocity and cycle time charts](/screenshots/reports-page.svg)

The Reports page has four tabs:

| Tab | What it measures |
|-----|-----------------|
| **Velocity** | Story points completed per sprint |
| **Burn-down** | Remaining work over a sprint's timeline |
| **Cycle Time** | Average days from task creation to Done, by type |
| **Teams** | Per-member contribution and workload |

Global filters at the top right let you scope reports to specific sprints or projects.

---

## Velocity

The velocity chart shows story points completed per sprint, displayed as a bar chart.

**What to look for:**
- **Consistent bars** — a stable team running at a predictable pace
- **Climbing bars** — team is improving (or taking on easier work)
- **Declining bars** — increasing friction, growing technical debt, or context switching
- **Huge variance** — sprints are poorly scoped, or points are inconsistently assigned

**Using velocity for planning:**
- Your **average velocity** (shown as a horizontal dashed line) is your planning baseline
- Commit to ~80% of your average velocity for the next sprint to leave room for surprises
- Clicking a sprint bar shows a breakdown by task type (Feature vs Bug vs Chore)

---

## Burn-down

The burn-down chart is covered in detail in the [Sprints & Backlog →](04-sprints-backlog.md) section.

**Quick interpretation:**
- Actual line below ideal line → **ahead of schedule**
- Actual line above ideal line → **at risk**
- Flat stretches → no tasks completed those days (investigate: blocked? weekend?)
- End of chart: remaining work > 0 → sprint ended with incomplete tasks

---

## Cycle Time

![Cycle time by task type across sprints](/screenshots/reports-cycle-time.svg)

Cycle time measures the average number of days from when a task is created to when it moves to **Done**, broken down by task type.

**Reading the chart:**
- Each sprint has a group of bars: **Feature** (blue), **Bug** (red), **Chore** (grey), **Spike** (purple)
- **Shorter bars = faster delivery**
- Compare types across the same sprint — are Bugs taking as long as Features? That's a problem
- Compare the same type over time — is Bug cycle time increasing sprint over sprint?

**Common patterns and what they mean:**

| Pattern | Likely cause | Action |
|---------|-------------|--------|
| Bug bars growing taller each sprint | Bugs deprioritized, accumulating complexity | Add dedicated bug rotation to sprint |
| Feature bars very tall | Features being split poorly, too large | Break features into smaller tasks |
| Spike bars taller than Features | Spikes running over time box | Enforce spike time limits |
| All bars growing together | Team velocity issue, context switching | Review sprint load and meetings |

---

## Teams

The Teams tab shows per-member metrics for the selected time range:

| Metric | Meaning |
|--------|---------|
| **Tasks completed** | Total tasks moved to Done |
| **Story points** | Total points completed |
| **Avg cycle time** | How fast this person moves tasks to done |
| **Tasks in flight** | Currently In Progress (unfinished) |

**Caveats on using Teams data:**
- Story points are team agreements, not individual performance metrics
- High point counts may reflect larger tasks, not necessarily more work
- Low cycle time may reflect cherry-picking easy tasks
- Use this data to spot imbalances (someone carrying too much), not to compare engineers

---

## Filtering reports

All charts respect the filters in the top right:

- **Sprint range** — "Last 3 sprints", "Last 6 sprints", or a custom range
- **Project** — filter to one project or view all projects combined
- **Task type** — show/hide specific types (click legend items on the chart)

---

## Exporting data

Click the **Export** button (top right of any chart) to download:
- **PNG** — a screenshot of the chart
- **CSV** — raw data rows for the selected date range

CSV exports include all fields (sprint name, task id, type, points, cycle time, assignee) so you can build custom analysis in a spreadsheet.

---

## Capacity planning with Reports

A practical capacity planning workflow using Reports:

1. Open **Reports → Velocity**, set range to "Last 6 sprints"
2. Note your average velocity (the dashed line)
3. Multiply by 0.8 for your planning target
4. Open **Reports → Cycle Time**, check if Bug bars are growing — if so, reserve 20% of points for bug work
5. Go to **Sprints → Backlog**, sort by priority, and pull tasks until you hit your target

Revisit this every 3 sprints and adjust if the team's average velocity shifts significantly.

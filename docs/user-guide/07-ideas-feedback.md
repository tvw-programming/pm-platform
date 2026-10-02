# Ideas & Feedback

Ideas and Feedback are two separate surfaces for capturing input from your team and users, then routing the best ideas into your roadmap.

---

## Ideas

The Ideas board is a community voting space for feature requests, improvements, and proposals. Anyone with Member access can submit and vote on ideas.

### Ideas overview

![Ideas board with voting and status badges](/screenshots/ideas-page.svg)

Ideas are listed with their vote count, status badge, and a preview of the description. Higher-voted ideas appear higher in the default sort.

### Submitting an idea

1. Click **+ New Idea** in the top right
2. Write a **title** (concise, describes the feature)
3. Write a **description** — what problem does this solve? Who benefits?
4. Add optional **labels** (e.g. "AI/ML", "Mobile", "Performance")
5. Click **Submit**

Your idea is immediately visible to the team with an **Open** status.

### Voting

Click the **▲** (upvote) button on any idea to vote for it. Click again to remove your vote. Votes are visible to everyone, so they serve as a signal of team interest.

### Idea statuses

| Status | Meaning |
|--------|---------|
| **Open** | Submitted, awaiting review |
| **Under Review** | PM or admin is evaluating it |
| **Planned** | Accepted and linked to a roadmap epic |
| **In Progress** | Linked epic is being actively worked on |
| **Completed** | Shipped |
| **Declined** | Won't do — a reason should be added in the comments |

### Idea detail

![Idea detail panel with votes, description, and comments](/screenshots/idea-detail.svg)

Click any idea to open the detail panel. You can see:

- **Vote count and your vote state**
- **Status and labels**
- **Full description**
- **Linked roadmap epic** — if this idea has been accepted and planned
- **Comments** — threaded discussion about the idea

### Linking an idea to the roadmap

When you decide to act on an idea:

1. Open the idea detail panel
2. Click **Link to Roadmap Epic** (bottom right)
3. Search for an existing epic or create a new one
4. Confirm the link

![Link idea to roadmap epic dialog](/screenshots/idea-link-to-roadmap.svg)

After linking:
- The idea's status updates to **Planned**
- The linked epic is shown in the idea detail
- The epic shows this idea as a linked item on the Roadmap

---

## Feedback

Feedback is for structured input with severity, source, and a triage workflow. Use it for:

- Customer bug reports and complaints
- Internal QA observations
- Support ticket escalations
- Beta tester notes

It is different from Ideas: Feedback is typically reactive (something is wrong or missing) while Ideas are proactive (something could be better).

### Feedback list

![Feedback list with severity indicators](/screenshots/feedback-triage.svg)

Feedback items are listed with:
- A **severity colour bar** (red = High, amber = Medium, grey = Low)
- The submitter and source (Customer, Internal, External)
- Submission date

### Submitting feedback

Click **+ New Item** and fill in:
- **Title** — concise description of the issue or request
- **Severity** — High, Medium, or Low
- **Source** — Customer, Internal, Support, Beta
- **Description** — detailed description; include steps to reproduce for bugs

### Triage workflow

Feedback follows a four-step status pipeline:

```
Open → Triaging → Accepted → Declined
```

**Triaging a feedback item:**

1. Click the item to open the detail panel
2. Click **Start Triaging** — this assigns it to you and moves it to "Triaging"
3. Review the description and investigate the issue
4. Choose:
   - **Accept** — links or creates a task and moves to "Accepted"
   - **Decline** — adds a decline reason and archives the item

### Linking feedback to a task

When you **Accept** a feedback item, you're prompted to either:
- **Create a new task** — opens the task create dialog with the feedback title pre-filled
- **Link to existing task** — search for an existing task that covers this issue

Once linked, the task shows this feedback item in its "Linked feedback" section.

### Assigning feedback

Any feedback item can be assigned to a team member for investigation. Open the item and click the **Assignee** field. The assigned person receives a notification.

---

## Ideas vs Feedback: when to use which?

| Situation | Use |
|-----------|-----|
| Engineer suggests improving the API response format | **Idea** |
| Customer reports login fails on Safari | **Feedback** |
| PM wants to capture a market opportunity | **Idea** |
| Support escalates a performance complaint | **Feedback** |
| Team votes on a new feature proposal | **Idea** |
| Beta tester finds a UI bug | **Feedback** |

Both can ultimately create tasks and roadmap epics. The difference is in the intake workflow: Ideas go through team voting, Feedback goes through severity-based triage.

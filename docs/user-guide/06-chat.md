# Chat

Chat in Meridian is not just messaging — it's a structured decision-making surface. Alongside regular threaded chat, the **Event Mode** turns critical decisions into routed workflows that create trackable tickets for specific roles.

---

## Chat overview

![Chat layout with roster and threads](/screenshots/chat-layout.svg)

The chat area has three sections:

- **Left sidebar** — chat channels and direct messages
- **Message area** — thread view, with messages grouped by time
- **Right panel** — roster status, active playbooks, or ticket tracker (contextual)

---

## Regular chat

Type in the composer and press **Enter** to send. Use **`⇧Enter`** for a new line within a message.

Markdown is fully supported: `**bold**`, `_italic_`, `` `code` ``, and fenced code blocks.

**Threads:** Reply to any message by hovering over it and clicking **Reply**. Threaded replies keep discussions organized without cluttering the main timeline.

**Mentions:** Type `@name` to mention a team member. They receive a notification.

---

## Message templates

![Template panel showing PM role templates](/screenshots/chat-template-chips.svg)

Templates are pre-written message starters for common communication patterns. Access them by clicking the **Templates** icon in the composer toolbar (or type `/` to search).

Templates are organized by role and category:
- **Duties** — routine check-ins and status updates
- **Status** — progress reports and blockers
- **Ask** — requests for information or action
- **Respond** — responses to tickets and decisions

Select a template to insert it into the composer. Edit the placeholders (shown in `[brackets]`) before sending.

---

## Event Mode

Event Mode is the structured layer of chat. Instead of a regular message, an event triggers a **playbook** — a predefined workflow that routes the message to specific roles and creates tickets.

### When to use Event Mode

Use Event Mode for:
- **Architecture decisions** — need sign-off from CTO, Tech Lead, affected engineers
- **Deployment approvals** — needs DevOps, PM, and QA confirmation
- **Post-mortems** — creates action items automatically for each role
- **Hiring decisions** — routes to HR, Finance, and Hiring Manager
- **Budget requests** — routes to Finance and Engineering Lead

Do NOT use Event Mode for casual questions or general discussion — use regular chat for those.

### Sending an event

![Chat composer in Event Mode with routing preview](/screenshots/chat-work-event-mode.svg)

1. Click the **Event** toggle in the composer (or press **`⌘E`**)
2. Select a **playbook** from the dropdown (e.g. "P04 · Architecture Decision")
3. Write your message — describe the decision, context, and options
4. The **routing preview panel** shows which roles will receive tickets
5. Press **Enter** or click **Fire Event**

### Routing preview

![Full routing preview panel](/screenshots/chat-routing-preview.svg)

Before sending an event, the routing preview shows three columns:

| Column | Meaning |
|--------|---------|
| **Must Respond** | Roles with mandatory tickets; the playbook won't complete without their action |
| **Optional** | Roles that receive a notification but their ticket is advisory |
| **Skipped** | Roles in the roster but not involved in this playbook |

If a role is missing from the run Roster, the playbook shows a warning. Seat that role in Chat → **Roster** (Hire an agent or Add a human) before firing.

---

## Tickets

When an event fires, each "Must Respond" role receives a **ticket** — a structured action item with a kind, SLA, and required response.

### Ticket bar

![Ticket bar showing active tickets with SLA countdowns](/screenshots/chat-ticket-bar.svg)

The ticket bar appears at the top of your chat when you have unresolved tickets. Tabs separate **Mandatory** tickets from **Optional** ones. Each chip shows:

- The playbook name and ticket kind icon
- An SLA countdown timer (turns amber at 50% elapsed, red at 80%)

Click any chip to jump to that ticket.

### Ticket kinds

![Ticket action types reference card](/screenshots/chat-ticket-actions.svg)

| Kind | Your action | Button |
|------|------------|--------|
| **approve_reject** | Approve or reject a decision | Approve / Reject |
| **review** | Review content and mark it complete | Mark Done |
| **ack** | Acknowledge you've received the information | Acknowledge |
| **action_done** | Complete a physical action and report back | Mark Action Done |

### Ticket SLA

Each ticket has a time limit set by the playbook (e.g. 4 hours for an architecture review). If a ticket expires:
- The playbook escalates to the next responder in the role's backup chain
- The chat thread is flagged with a missed-SLA badge

---

## Playbook tracker

![Right-panel playbook tracker](/screenshots/chat-playbook-tracker.svg)

The right panel shows all active and recently completed playbooks for the current channel. For each active playbook:

- **Name and type** (e.g. P04 · Architecture Decision)
- **Progress indicator** (e.g. "1 of 4 steps done")
- **Per-role ticket status** — ✓ resolved, ✗ expired, ○ pending

A playbook is considered **complete** when all mandatory tickets have been resolved.

---

## Roster setup

The Roster is the **seating chart for one chat run** (usually `run-default`). It maps each **role** (e.g. Project Manager, Senior FE, QA Lead) to either:

- a **human** (name/placeholder), or
- a **hired AI agent** (a long-lived project teammate seated on that role for this run)

Playbooks, tickets, Assign/Run wakes, and handoffs use the Roster to decide **who must respond** and **which agent to wake**.

### How to set it up effectively

1. Open Chat → **Roster** panel (side drawer)
2. **Hire** AI agents (or **Install Product Eng Pod**) — creates durable agents and seats them on roles
3. Or **Add** a human seat: pick role + name (for hybrid teams / playbook coverage)
4. Confirm required roles for your flow are present (PM, FE, BE, QA as needed)
5. Use Event Mode / Assign/Run / Pass handoff — the system routes to seated roles/agents
6. **Pause** an agent when you want to stop wakes without removing history

**Impact:** A correct roster means tickets land on the right people/agents, LM wakes hit the right role, and plans/handoffs continue the chain. An empty or wrong roster means skipped playbook steps, failed wakes, or tickets with no assignee.

### When to use — is it mandatory?

- **Use when:** starting a feature thread, before Event Mode playbooks, before Hire Pod / Assign/Run, or whenever you change who’s responsible for a role
- **Mandatory for AI Assign/Run?** Yes — the agent must be **seated** on the run for its role to wake
- **Mandatory for opening Chat?** No — Chat loads without a full roster; set it up when you need coordinated work
- **Teams page setup?** Not required for Roster/Chat agent flows

### Project role catalog (Settings)

Separately, admins can enable which roles exist for the project:

1. Go to **Settings → Chat Roles**
2. Click **+ Role** to add a new role or click an existing role to edit it
3. Assign a **primary** member and optionally a **backup** (used when primary is unavailable)
4. Set the role's **availability** — working hours, timezone, out-of-office dates

![Chat role settings panel](/screenshots/settings-chat-roles.svg)

This catalog controls which roles are available to seat. Seating itself happens on the Chat **Roster** panel for the current run.

### Role availability

If a role's primary is marked as unavailable (out of office or outside working hours), the system automatically routes tickets to the backup. If both are unavailable, the event fires but the ticket is flagged as unroutable.

---

## End-to-end walkthrough: Architecture Decision

This is the most common event type for engineering teams.

**Scenario:** You're proposing to replace the existing REST API with GraphQL.

1. Open Chat and toggle to **Event Mode**
2. Select **P04 · Architecture Decision** from the playbook dropdown
3. Write your message:
   ```
   Proposal: migrate /api/v1/* from REST to GraphQL.

   Motivation: Frontend team spending ~40% of time on custom adapters.
   Estimated effort: 3 sprints.
   Risk: breaking change for external API consumers.

   Options:
   A) Full migration in one release
   B) GraphQL layer alongside REST (dual-write period)
   C) Reject — keep REST
   ```
4. Review the routing preview — CTO, Tech Lead, PM, and Frontend Lead are Must Respond
5. Click **Fire Event**
6. Each of those roles sees a ticket in their ticket bar with "approve_reject" kind
7. They vote Approve or Reject; the playbook completes when all mandatory votes are in
8. The decision and all votes are recorded in the chat thread permanently

---

## Auto virtual-team flow (Phase 3)

After you hire the Product Eng Pod (pm, sfd, sbd, qa) and set **Settings → Agent Config → primary_cwd** (example: your Alumni-web folder), you can run a feature without clicking Assign/Run for each step.

### How to start

Do one of:

1. **Event Mode** → playbook **P23 · New requirement** (`new_requirement`), or  
2. Send a normal message that starts with `/require …` or contains `[requirement]`, or  
3. Event Mode with `brd_ready` / `requirement_posted`

### What happens next

1. **pm** wakes and answers in few words: **Approve** or **Reject** (+ short reason if reject).  
2. On Approve, pm chooses **sfd** and/or **sbd** (and later **qa**). Those agents wake automatically.  
3. **sfd** posts: “I am starting my planning.” then a visible **plan** card.  
4. **pm** Approve/Reject that plan (you can also use the plan ticket).  
5. On plan Approve, **sfd** edits files only inside `primary_cwd` (visible in VS Code).  
6. **sfd** posts: “Code update completed.”  
7. **qa** posts: “I am starting testing.” then a pass/fail result.

If LM Studio is down or the coding folder is missing, Chat shows a clear system error instead of a silent failure.

Manual Assign/Run and Pass handoff still work for older Phase 1–2 flows.

---

## Tips

- **Keep event messages short** — the ticket creates the action item; the message is context
- **Fire events before you've already decided** — the playbook is for collective decisions, not announcements
- **Check the roster before a big event** — if a key role has no seat (human or AI), the playbook will skip them or Assign/Run will fail to wake
- **For auto flow:** seat pm + sfd (+ sbd/qa as needed), set `primary_cwd`, keep LM Studio running
- **Use templates for regular events** — most playbooks have a message template; use it as a starting point

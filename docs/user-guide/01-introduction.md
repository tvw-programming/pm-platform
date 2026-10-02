# Introduction

Meridian is a project management platform built for software teams that need structured delivery alongside real-time decision-making. It brings together tasks, sprints, roadmap planning, a role-routed chat system, and analytics in one workspace.

---

## Who is Meridian for?

Meridian is designed around the people who ship software together:

| Role | Primary activities |
|------|--------------------|
| **Product Manager** | Roadmap epics, backlog grooming, sprint planning, ideas triage |
| **Engineering Lead** | Sprint management, capacity planning, cycle time review |
| **Engineer** | Task execution, sprint board, responding to chat tickets |
| **Designer** | Task tracking, linked Figma assets, feedback review |
| **Stakeholder / Viewer** | Read-only dashboards, reports, release status |
| **Team Admin** | Workspace settings, member roles, integrations |

Each of these roles interacts with a different slice of the product. This documentation is organized so you can read only the sections relevant to your day-to-day work.

---

## Core concepts

### Workspace
A workspace is your organization's top-level container. It holds members, projects, settings, and integrations. All billing and permissions are at workspace level.

### Project
A project groups related work together — typically one per product, team, or initiative. A project has its own:
- **Backlog** — unscheduled tasks
- **Sprints** — time-boxed work cycles
- **Roadmap** — epics and milestones
- **Chat threads** — contextual discussion

### Task
The atomic unit of work. Every task has a type (Feature, Bug, Chore, Spike), a status (To Do, In Progress, Review, Done, Blocked), a priority (P0–P4), and optional story points.

### Sprint
A sprint is a time-boxed cycle (typically 1–2 weeks) that holds a committed set of tasks. Sprints track velocity, burndown, and completion rate.

### Epic
An epic is a large roadmap item that spans multiple sprints and groups related tasks. Epics appear on the Roadmap timeline and can be linked to releases.

### Release
A release tracks a versioned deployment through configurable stages (Staging → QA → UAT → Production). Each stage can be gated on the previous one.

### Chat event
A structured message that triggers a predefined workflow ("playbook"). Events are routed to specific roles, create ticketed action items, and track responses — unlike regular chat messages.

---

## Navigating the app

The left sidebar is the primary navigation surface. It is divided into three sections:

```
╔══════════════╗
║  Workspace   ║  ← workspace name + switcher
╠══════════════╣
║  Project     ║  ← project name + selector
║  ─────────── ║
║  Dashboard   ║
║  Tasks       ║
║  Sprints     ║
║  Backlog     ║
║  Roadmap     ║
║  Releases    ║
║  Chat        ║
║  Ideas       ║
║  Feedback    ║
║  Reports     ║
╠══════════════╣
║  Settings    ║  ← workspace-level settings
╚══════════════╝
```

The **top bar** shows your current location as a breadcrumb and contains global actions like searching (`⌘K`) and creating new items (`⌘N`).

---

## Getting around quickly

- **`⌘K`** — command palette: search tasks, navigate pages, run actions
- **`G` then a letter** — jump-to shortcuts (e.g. `G T` for Tasks, `G S` for Sprints)
- **`?`** — keyboard shortcut reference overlay

![Keyboard shortcuts overlay](/screenshots/keyboard-shortcuts.svg)

---

## Data model at a glance

```
Workspace
└─ Project(s)
   ├─ Tasks (Backlog + Sprints)
   ├─ Sprints
   │   └─ Tasks (assigned to sprint)
   ├─ Roadmap
   │   └─ Epics
   │       └─ Linked tasks / releases
   ├─ Releases
   │   └─ Linked epics + deployment stages
   ├─ Chat
   │   ├─ Threads (messages)
   │   └─ Events → Playbooks → Tickets
   ├─ Ideas
   └─ Feedback
```

Every object in the system is linkable — a task can reference an epic, a chat event can trigger a ticket that becomes a task, and an idea can be promoted to a roadmap epic.

---

## Next steps

- New to the platform? Start with the [Quick Start Guide →](00-quick-start.md)
- Jump directly to the feature you need using the sidebar navigation

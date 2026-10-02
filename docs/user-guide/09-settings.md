# Settings

Settings control workspace configuration, membership, permissions, and integrations. Most settings require Admin or Owner access.

---

## Settings overview

The Settings area is divided into sections accessible from the left sidebar:

| Section | Who can access |
|---------|---------------|
| **Workspace Profile** | Admin, Owner |
| **Members** | Admin, Owner |
| **Roles & Permissions** | Admin, Owner |
| **Project Settings** | Admin, Owner |
| **Custom Fields** | Admin, Owner |
| **Status Config** | Admin, Owner |
| **Chat Roles** | Admin, Owner |
| **Notifications** | All members (personal) |
| **Integrations** | Admin, Owner |

---

## Members

![Members settings page with role dropdowns and invite bar](/screenshots/settings-members.svg)

### Inviting members

1. Go to **Settings → Members**
2. Enter the person's email in the invite bar
3. Select their role (Member by default)
4. Click **Send Invite**

They receive an email with a link to join. The invite appears in the pending section until they accept.

### Workspace roles

| Role | Permissions |
|------|------------|
| **Owner** | Everything, including deleting the workspace |
| **Admin** | Invite/remove members, change roles, manage all settings |
| **Member** | Create and edit tasks, plan sprints, use chat, submit ideas |
| **Viewer** | Read-only access to all content |

### Changing a member's role

Click the **role dropdown** next to any member's name and select the new role. The change takes effect immediately.

### Removing a member

Click **Remove** next to a member. Their tasks remain assigned to them; you'll be prompted to reassign open tasks to another member.

---

## Roles & Permissions

Fine-grained permission control per role. Admins can customize what each workspace role can do:

- **Create/edit tasks** — toggle per role
- **Delete tasks** — Owner/Admin only by default
- **Manage sprints** — toggle per role
- **View reports** — toggle per role
- **Export data** — toggle per role

Changes here apply to all new and existing members in that role.

---

## Project Settings

Configure project-level behaviour:

### Sprint defaults
- **Duration** — default sprint length (1 week, 2 weeks, 3 weeks, custom)
- **Auto-close** — automatically close a sprint on its end date
- **Velocity baseline** — how many sprints to average for capacity suggestions (3, 6, or 12)

### Task defaults
- **Default assignee** — unassigned or the creating user
- **Default priority** — P3 by default
- **Default type** — Feature by default

### Release stages
Configure the stage pipeline for releases. Add, remove, or reorder stages. Set a "requires confirmation" flag on stages that need explicit sign-off.

---

## Custom Fields

Add project-specific fields to tasks.

1. Click **+ Field**
2. Choose a type: Text, Number, Date, Select, Multi-select, or URL
3. Name the field (e.g. "Customer", "Risk Level", "PR Link")
4. For Select/Multi-select: add the option values
5. Click **Create Field**

The field appears in the task detail drawer for all tasks in this project. Custom fields can be used as filters on the Tasks page.

---

## Status Config

Customize the task status pipeline for your project. The defaults (To Do, In Progress, Review, Done, Blocked) can be:

- **Renamed** — click the name to edit it
- **Reordered** — drag to change the column order on the board
- **Added** — click **+ Status** to add intermediate states (e.g. "QA", "Deployed")
- **Deleted** — drag tasks out of a status before deleting it

**Note:** "Done" and "Blocked" are system statuses and cannot be removed.

---

## Chat Roles

![Chat roles settings panel](/screenshots/settings-chat-roles.svg)

Chat roles define who receives tickets from event playbooks. Each role maps a functional title to one or more team members.

### Adding a role

1. Click **+ Role**
2. Enter the **role name** (must match a role in the playbook catalog, e.g. "Frontend Lead")
3. Assign the **primary** member
4. Optionally assign a **backup** member
5. Set **working hours** and **timezone** for SLA routing
6. Click **Save**

### Editing a role

Click any existing role card to open the editor. Changes take effect for the next event — in-flight tickets are not reassigned.

### Out-of-office

Mark a member as out of office by clicking their name in the roster and toggling **Out of Office**. The backup automatically takes their tickets during this period.

---

## Notifications

Personal notification settings are per-member. Go to **Settings → Notifications** to configure:

| Notification | Default |
|-------------|---------|
| Task assigned to me | On |
| Task I'm watching changes | On |
| Comment on my task | On |
| Chat mention (`@me`) | On |
| Chat ticket assigned | On |
| Sprint started/closed | On |
| Daily digest email | Off |

Toggle any setting on or off. Email notifications are sent to the address used to create your account.

---

## Integrations

![Integrations panel showing connected and available services](/screenshots/settings-integrations.svg)

Connect external tools to automate workflows.

### Available integrations

| Integration | What it enables |
|------------|----------------|
| **Slack** | Post notifications to Slack channels; receive ticket alerts in DMs |
| **GitHub** | Link PRs to tasks; auto-close tasks when PR is merged |
| **Jira** | Two-way sync with Jira issues (import/export) |
| **Linear** | Two-way sync with Linear cycles |
| **Notion** | Attach Notion pages to tasks and epics |
| **Figma** | Embed Figma designs in task detail |
| **Sentry** | Auto-create tasks from Sentry error alerts |
| **Custom Webhook** | POST events to your own endpoint |

### Connecting an integration

1. Find the integration card in **Settings → Integrations**
2. Click **Connect**
3. Complete the OAuth flow (you'll be redirected to the service and back)
4. Configure optional settings (which channels, which repos, etc.)

### Disconnecting

Click **Disconnect** on any connected integration card. This removes the auth token and stops all automated actions for that integration.

---

## Workspace Profile

Update your workspace name, URL slug, and logo in **Settings → Workspace Profile**. Changing the URL slug updates the workspace URL immediately — share the new URL with your team.

---

## Billing

Billing and plan management are handled outside Settings, at the workspace level. Owners can access billing from the workspace switcher → **Manage Plan**.

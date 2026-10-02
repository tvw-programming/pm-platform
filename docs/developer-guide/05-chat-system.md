# Chat System — Developer Guide

## Overview

The chat system has two orthogonal layers:

1. **Messaging** — store and broadcast messages scoped to a `run_id`
2. **Playbook routing** — when a work event message is sent, resolve who must respond and create tickets

---

## Data Models

### Message

```go
type Message struct {
    ID           uuid.UUID         // PK
    RunID        string            // scope — all chat is per-run
    AuthorID     string
    AuthorName   string
    AuthorRoles  JSONBStringArray  // author's SDLC role IDs
    Mode         string            // "normal" | "work_event"
    EventType    string            // playbook trigger (work_event only)
    PlaybookID   string            // resolved playbook ID
    TemplateID   string            // template used (optional)
    Body         string
    ArtifactRefs JSONBStringArray  // attached file/URL refs
    CreatedAt    time.Time
}
```

### Ticket

```go
type Ticket struct {
    ID                 uuid.UUID
    RunID              string
    PlaybookInstanceID uuid.UUID
    RoleID             string    // which SDLC role
    UserID             string    // assigned to whom
    Kind               string    // "approve_reject"|"review"|"ack"|"action_done"
    Status             string    // "pending"|"approved"|"rejected"|"acknowledged"|"done"|"skipped"
    SkippedReason      string    // "SKIPPED_ROLE_ABSENT" | ""
    ParentMessageID    uuid.UUID // the work-event message that triggered this
    Comment            string
    DueBy              *time.Time
    ResolvedAt         *time.Time
}
```

### PlaybookInstance

```go
type PlaybookInstance struct {
    ID             uuid.UUID
    RunID          string
    PlaybookID     string
    TriggerMsgID   uuid.UUID
    Status         string            // "open"|"resolved"|"partial"
    ResolvedRoles  JSONBStringArray
    SkippedRoles   JSONBStringArray
    NotAskedRoles  JSONBStringArray
    CreatedAt      time.Time
    UpdatedAt      time.Time
}
```

---

## Message Creation Flow

```
POST /api/chat/messages
  {run_id, author_id, author_name, author_roles, mode, event_type, body}

handler (chat.go):
  1. Save Message to DB
  2. If mode == "work_event":
     a. FindPlaybookByTrigger(event_type)  → PlaybookDef
     b. GetRoster(run_id)                  → []RosterEntry
     c. ResolvePlaybook(...)               → PlaybookResolution
     d. CreatePlaybookInstance(...)        → PlaybookInstance
     e. CreateTicketsFromResolution(...)   → []Ticket
  3. Broadcast WS event {type:"new_message", data:{message, tickets, playbook_instance}}
  4. Return 201 {message, tickets, playbook_instance}
```

---

## Ticket Resolution Flow

```
PUT /api/chat/tickets/:ticketId
  {status, comment, resolver_id}

handler (ticket.go):
  1. Load ticket, validate status transition
  2. Check resolver_id == ticket.user_id (or admin override)
  3. Save ticket with ResolvedAt
  4. go checkPlaybookCompletion(playbook_instance_id)
     → if all pending tickets resolved: update instance status
  5. Broadcast WS event {type:"ticket_resolved", data:ticket}
  6. Return 200 ticket
```

### Valid Status Transitions

| Kind | Allowed next statuses |
|------|-----------------------|
| `approve_reject` | `approved`, `rejected` |
| `review` | `approved`, `rejected` (maps to approved/changes-requested) |
| `ack` | `acknowledged` |
| `action_done` | `done` |

---

## WebSocket Protocol

Connect: `ws://localhost:3001/ws/:runId`

The server sends JSON events:

```json
// New message (with optional tickets and playbook instance)
{
  "type": "new_message",
  "data": {
    "message": { ...Message },
    "tickets": [ ...Ticket ],
    "playbook_instance": { ...PlaybookInstance }
  }
}

// Ticket resolved
{ "type": "ticket_resolved", "data": { ...Ticket } }

// Roster changed
{ "type": "roster_updated", "data": null }
```

Frontend handler in `ChatProvider.tsx`:

```ts
const ws = api.connectWebSocket(runId, (event) => {
  if (event.type === 'new_message') {
    dispatch({ type: 'ADD_MESSAGE', payload: event.data.message });
    if (event.data.tickets) dispatch({ type: 'ADD_TICKETS', payload: event.data.tickets });
  } else if (event.type === 'ticket_resolved') {
    dispatch({ type: 'UPDATE_TICKET', payload: event.data });
  } else if (event.type === 'roster_updated') {
    api.getRoster(runId).then(r => dispatch({ type: 'SET_ROSTER', payload: r }));
  }
});
```

---

## Roster API

```
GET  /api/roster/:runId          → enriched RosterEntry[] (with role_label, track, seniority)
POST /api/roster/:runId          → upsert entries
DELETE /api/roster/:runId/:roleId → remove one entry
```

Roster entries are enriched server-side from the role catalog before being returned — the handler merges `RoleDef` data into the DB row.

---

## Role Configuration API

```
GET /api/roles/catalog              → {roles: RoleDef[], min_roles: 8, max_roles: 21}
GET /api/roles/config/:projectId    → {enabled_roles: string[]}
PUT /api/roles/config/:projectId    → body {enabled_roles: string[]}
```

Validation on `PUT`:
- `len(enabled_roles) >= 8`
- `len(enabled_roles) <= 21`
- All IDs must exist in `RoleCatalog`

---

## Template API

```
GET /api/templates/           → full TemplateCatalog {role_templates[], shared_templates}
GET /api/templates/:roleId    → {role_templates[], shared_templates}
```

Templates are static (in-memory, no DB). To add templates, edit `services/template_service.go`.

---

## Adding a New Playbook

In `server/internal/services/playbook_engine.go`, append to `PlaybookCatalog`:

```go
{
    ID: "P23", Name: "My new event", Trigger: "my_event_trigger",
    Description: "What this playbook does",
    Steps: []PlaybookStep{
        {
            Order: 1, Action: "review",
            Primitive: "first_present",
            Roles: []string{"senior_be", "be_tech_lead"},
            ResponseKind: "review",
            Description: "Code review",
        },
    },
    EscalateDefault: []string{"project_manager", "full_stack_em", "cto"},
},
```

The new trigger `my_event_trigger` will automatically appear in `GET /api/playbooks/` → `data.event_types[]` and in the frontend event type selector.

---

## Adding a New Role

In `server/internal/models/role.go`, append to `RoleCatalog`:

```go
{
    ID:              "my_new_role",
    Label:           "My New Role",
    Seniority:       "Senior",
    Track:           "backend",
    Optional:        true,
    DefaultFallback: []string{"be_tech_lead", "full_stack_em"},
},
```

Then add templates in `services/template_service.go` under the new role ID. The role will automatically appear in the catalog API and Settings chat roles panel.

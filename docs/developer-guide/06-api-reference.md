# API Reference

Base URL: `http://localhost:3001`

All responses are JSON. Errors follow: `{"error": "message"}`.

---

## Health

### GET /api/health
```json
{ "status": "ok" }
```

---

## Chat Messages

### GET /api/chat/messages/:runId

Returns all messages for a run in chronological order.

**Response:**
```json
[
  {
    "id": "uuid",
    "run_id": "run-default",
    "author_id": "user-1",
    "author_name": "Alex Chen",
    "author_roles": ["project_manager"],
    "mode": "work_event",
    "event_type": "frontend_integrated",
    "playbook_id": "P03",
    "body": "Login redesign is merged and ready for review",
    "artifact_refs": [],
    "created_at": "2026-10-02T10:32:00Z"
  }
]
```

### POST /api/chat/messages

**Body:**
```json
{
  "run_id": "run-default",
  "author_id": "user-1",
  "author_name": "Alex Chen",
  "author_roles": ["project_manager", "full_stack_em"],
  "mode": "work_event",
  "event_type": "frontend_integrated",
  "body": "PR #142 merged — login redesign complete"
}
```

**Response 201:**
```json
{
  "message": { ...Message },
  "tickets": [ ...Ticket ],
  "playbook_instance": { ...PlaybookInstance }
}
```

`tickets` and `playbook_instance` are null for `mode: "normal"`.

---

## Tickets

### GET /api/chat/tickets/:runId

Returns all tickets for a run.

### PUT /api/chat/tickets/:ticketId

Resolve a ticket.

**Body:**
```json
{
  "status": "approved",
  "comment": "Looks good, LGTM",
  "resolver_id": "user-2"
}
```

**Response 200:** Updated Ticket object.

### GET /api/chat/playbook-instances/:runId

Returns all PlaybookInstance records for a run.

---

## Roster

### GET /api/roster/:runId

Returns enriched roster entries (with role metadata from catalog).

**Response:**
```json
[
  {
    "id": "uuid",
    "run_id": "run-default",
    "role_id": "senior_fe",
    "user_id": "user-2",
    "user_name": "Sam Rivera",
    "present": true,
    "role_label": "Senior Frontend Dev",
    "track": "frontend",
    "seniority": "Senior"
  }
]
```

### POST /api/roster/:runId

Upsert roster entries (creates if absent, updates if present).

**Body:**
```json
[
  {
    "role_id": "senior_fe",
    "user_id": "user-2",
    "user_name": "Sam Rivera",
    "present": true
  }
]
```

### DELETE /api/roster/:runId/:roleId

Remove a role from the roster.

---

## Roles

### GET /api/roles/catalog

Returns the full 21-role catalog.

**Response:**
```json
{
  "roles": [
    {
      "id": "senior_fe",
      "label": "Senior Frontend Dev",
      "seniority": "Senior",
      "track": "frontend",
      "optional": false,
      "default_fallback": ["fe_tech_lead", "fe_manager"]
    }
  ],
  "min_roles": 8,
  "max_roles": 21
}
```

### GET /api/roles/config/:projectId

Returns enabled roles for a project.

**Response:**
```json
{ "enabled_roles": ["cto", "project_manager", "senior_fe", ...] }
```

### PUT /api/roles/config/:projectId

Update enabled roles. Validates 8 ≤ count ≤ 21 and all IDs exist in catalog.

**Body:**
```json
{ "enabled_roles": ["cto", "project_manager", "senior_fe", "junior_fe", "senior_be", "junior_be", "qa_lead", "devops"] }
```

---

## Templates

### GET /api/templates/

Returns full template catalog.

**Response:**
```json
{
  "role_templates": [
    {
      "role_id": "senior_fe",
      "duties": ["Review PRs from junior FE before merge", ...],
      "status": ["Currently reviewing PR #142", ...],
      "ask": ["Can you clarify the acceptance criteria?", ...],
      "respond": ["LGTM — approved", ...]
    }
  ],
  "shared_templates": {
    "normal": ["Quick update: ...", "Heads up: ..."],
    "work_event": ["This is ready for review", "Blocking issue found"]
  }
}
```

### GET /api/templates/:roleId

Returns templates for a specific role (role templates + shared).

---

## Playbooks

### GET /api/playbooks/

Returns all 22 playbook definitions and event types.

**Response:**
```json
{
  "playbooks": [ ...PlaybookDef[] ],
  "event_types": [
    { "id": "frontend_integrated", "label": "Frontend implementation completed" }
  ]
}
```

### GET /api/playbooks/:playbookId

Returns a single playbook definition (e.g. `/api/playbooks/P03`).

### POST /api/playbooks/preview

Preview playbook routing without sending a message.

**Body:**
```json
{
  "run_id": "run-default",
  "event_type": "frontend_integrated",
  "author_id": "user-1"
}
```

**Response:**
```json
{
  "playbook": { ...PlaybookDef },
  "resolution": {
    "playbook_id": "P03",
    "must_respond": [
      { "role_id": "senior_fe", "user_id": "user-2", "user_name": "Sam Rivera", "kind": "review" }
    ],
    "skipped": [
      { "role_id": "mobile_tech_lead", "reason": "SKIPPED_ROLE_ABSENT" }
    ],
    "not_asked": [
      { "role_id": "junior_fe" }
    ]
  }
}
```

---

## WebSocket

### WS /ws/:runId

Upgrade to WebSocket. The server pushes events on state changes. See [Chat System](05-chat-system.md#websocket-protocol) for event shapes.

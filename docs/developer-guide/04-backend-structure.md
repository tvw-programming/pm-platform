# Backend Structure

## Directory Map

```
server/
├── cmd/
│   └── main.go                 ← Entry point (init DB, router, graceful shutdown)
└── internal/
    ├── config/
    │   └── config.go           ← DB + server config from env vars
    ├── database/
    │   └── database.go         ← GORM connection singleton + AutoMigrate
    ├── handlers/
    │   ├── chat.go             ← ListMessages, CreateMessage
    │   ├── health.go           ← GET /api/health
    │   ├── playbook.go         ← ListPlaybooks, GetPlaybook, Preview
    │   ├── role.go             ← GetCatalog, GetConfig, UpdateConfig
    │   ├── roster.go           ← GetRoster, SetRoster, RemoveRole
    │   ├── template.go         ← GetAll, GetByRole
    │   └── ticket.go           ← ListTickets, ResolveTicket, ListPlaybookInstances
    ├── models/
    │   ├── chat.go             ← GORM models: Message, Ticket, PlaybookInstance, etc.
    │   ├── role.go             ← 21-role catalog (RoleDef, RoleCatalog)
    │   └── template.go         ← Template types and category constants
    ├── router/
    │   └── router.go           ← Fiber app + CORS + all route registration
    ├── services/
    │   ├── playbook_engine.go  ← 22 PlaybookDef definitions + routing resolution
    │   ├── template_service.go ← Full template catalog for all 21 roles
    │   └── ticket_service.go   ← Ticket lifecycle, SLA, playbook completion
    └── websocket/
        └── hub.go              ← WebSocket hub with room-based broadcasting
```

---

## Entry Point (`cmd/main.go`)

```go
func main() {
    cfg := config.Load()          // Read env vars
    db := database.Connect(cfg)   // GORM + AutoMigrate
    hub := websocket.NewHub()     // WS hub
    go hub.Run()                  // Goroutine to process messages
    app := router.Setup(db, cfg, hub)
    
    // Graceful shutdown on SIGINT/SIGTERM
    c := make(chan os.Signal, 1)
    signal.Notify(c, os.Interrupt, syscall.SIGTERM)
    go func() { <-c; app.Shutdown() }()
    
    app.Listen(":" + cfg.Server.Port)
}
```

---

## Database Models (`models/chat.go`)

All models use UUID primary keys and GORM `jsonb` for array fields:

```go
type Message struct {
    ID              uuid.UUID  `gorm:"type:uuid;primaryKey"`
    RunID           string     `gorm:"index;not null"`
    AuthorID        string
    AuthorName      string
    AuthorRoles     JSONBStringArray  // stored as jsonb
    Mode            string            // "normal" | "work_event"
    EventType       string
    PlaybookID      string
    TemplateID      string
    Body            string
    ArtifactRefs    JSONBStringArray
    CreatedAt       time.Time
}
```

### JSONB Helper Types

```go
type JSONBStringArray []string

func (j JSONBStringArray) Value() (driver.Value, error) { ... }
func (j *JSONBStringArray) Scan(value interface{}) error { ... }
```

---

## Handler Pattern

All handlers follow this pattern — struct with injected dependencies:

```go
type ChatHandler struct {
    DB  *gorm.DB
    Hub *websocket.Hub
}

func (h *ChatHandler) CreateMessage(c *fiber.Ctx) error {
    var body CreateMessageRequest
    if err := c.BodyParser(&body); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": err.Error()})
    }
    // ... business logic ...
    h.Hub.Broadcast(body.RunID, websocket.Event{Type: "new_message", Data: ...})
    return c.Status(201).JSON(result)
}
```

---

## Adding a New API Endpoint

1. **Create / update a model** in `models/` if new data structures are needed.
2. **Create / update a service** in `services/` for business logic.
3. **Create a handler** in `handlers/`:
   ```go
   type MyHandler struct { DB *gorm.DB }
   
   func (h *MyHandler) List(c *fiber.Ctx) error {
       var items []models.MyModel
       h.DB.Find(&items)
       return c.JSON(items)
   }
   ```
4. **Register in `router/router.go`**:
   ```go
   myHandler := &handlers.MyHandler{DB: db}
   my := app.Group("/api/my-resource")
   my.Get("/", myHandler.List)
   ```
5. **Add to database AutoMigrate** in `database/database.go`:
   ```go
   db.AutoMigrate(&models.MyModel{})
   ```

---

## WebSocket Hub (`websocket/hub.go`)

The hub manages rooms keyed by `run_id`:

```go
type Hub struct {
    rooms      map[string]map[*Client]bool
    broadcast  chan roomMessage
    register   chan *Client
    unregister chan *Client
    mu         sync.RWMutex
}

// Broadcast to all clients in a room
func (h *Hub) Broadcast(runID string, event Event) {
    data, _ := json.Marshal(event)
    h.broadcast <- roomMessage{RunID: runID, Data: data}
}
```

**Event envelope:**
```json
{ "type": "new_message", "data": { ... } }
{ "type": "ticket_resolved", "data": { ... } }
{ "type": "roster_updated", "data": { ... } }
```

Clients connect at `ws://localhost:3001/ws/:runId`.

---

## Playbook Engine (`services/playbook_engine.go`)

### Resolution Primitives

| Primitive | Logic |
|-----------|-------|
| `first_present` | First role in list that has a user in the roster |
| `all_present` | All roles that have users in the roster |
| `only_if_present` | Include only if role is in roster (else skip) |
| `require_one_of` | At least one of the listed roles must be present |
| `not_asked` | Explicitly excluded from the ticket set |

### Self-Review Ban

When the implementer is the only candidate reviewer, the engine steps up the ladder:

```go
if len(mustRespond) == 1 && mustRespond[0].UserID == implementerUserID {
    // Step up: find next role in the fallback chain
    for _, fallbackRole := range step.Roles[1:] {
        if rosterUser := findInRoster(roster, fallbackRole); rosterUser != nil {
            mustRespond[0] = rosterUser
            break
        }
    }
}
```

### Escalation Default

All playbooks have an `EscalateDefault` chain: `["project_manager", "full_stack_em", "cto"]`. When no step roles are present, the engine uses this chain.

### Resolving a Playbook

```go
resolution := services.ResolvePlaybook(playbookID, roster, implementerUserID)
// Returns PlaybookResolution{MustRespond, Skipped, NotAsked}
```

---

## Config (`config/config.go`)

```go
type DBConfig struct {
    Host, Port, User, Password, DBName string
}

func (c *DBConfig) DSN() string {
    return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
        c.Host, c.Port, c.User, c.Password, c.DBName)
}
```

All fields read from environment variables with defaults — see [Architecture](01-architecture.md#environment-variables).

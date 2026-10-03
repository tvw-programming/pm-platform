package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"gorm.io/gorm"

	"pm-platform/server/internal/config"
	"pm-platform/server/internal/handlers"
	"pm-platform/server/internal/services"
	"pm-platform/server/internal/websocket"
)

func Setup(db *gorm.DB, cfg *config.Config, hub *websocket.Hub) *fiber.App {
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.Server.CORSOrigins,
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Content-Type,Authorization",
		AllowCredentials: true,
	}))

	agentSvc := &services.AgentService{DB: db, Cfg: cfg, Hub: hub}

	chatHandler := &handlers.ChatHandler{DB: db, Hub: hub}
	ticketHandler := &handlers.TicketHandler{DB: db, Hub: hub}
	rosterHandler := &handlers.RosterHandler{DB: db, Hub: hub}
	roleHandler := &handlers.RoleHandler{DB: db}
	templateHandler := &handlers.TemplateHandler{}
	playbookHandler := &handlers.PlaybookHandler{DB: db}
	agentHandler := &handlers.AgentHandler{DB: db, Hub: hub, Agents: agentSvc}
	runtimeHandler := &handlers.RuntimeHandler{Agents: agentSvc}

	app.Get("/api/health", handlers.HealthCheck)

	chat := app.Group("/api/chat")
	chat.Get("/messages/:runId", chatHandler.ListMessages)
	chat.Post("/messages", chatHandler.CreateMessage)
	chat.Get("/tickets/:runId", ticketHandler.ListTickets)
	chat.Put("/tickets/:ticketId", ticketHandler.ResolveTicket)
	chat.Get("/playbook-instances/:runId", ticketHandler.ListPlaybookInstances)

	roster := app.Group("/api/roster")
	roster.Get("/:runId", rosterHandler.GetRoster)
	roster.Post("/:runId", rosterHandler.SetRoster)
	roster.Delete("/:runId/:roleId", rosterHandler.RemoveRole)

	roles := app.Group("/api/roles")
	roles.Get("/catalog", roleHandler.GetCatalog)
	roles.Get("/config/:projectId", roleHandler.GetConfig)
	roles.Put("/config/:projectId", roleHandler.UpdateConfig)

	templates := app.Group("/api/templates")
	templates.Get("/", templateHandler.GetAll)
	templates.Get("/:roleId", templateHandler.GetByRole)

	playbooks := app.Group("/api/playbooks")
	playbooks.Get("/", playbookHandler.ListPlaybooks)
	playbooks.Get("/:playbookId", playbookHandler.GetPlaybook)
	playbooks.Post("/preview", playbookHandler.Preview)

	agents := app.Group("/api/agents")
	agents.Get("/", agentHandler.ListAgents)
	agents.Post("/", agentHandler.HireAgent)
	agents.Get("/:id", agentHandler.GetAgent)
	agents.Patch("/:id", agentHandler.PatchAgent)
	agents.Post("/:id/runs", agentHandler.CreateRun)
	agents.Get("/:id/runs", agentHandler.ListRuns)

	app.Get("/api/skills", agentHandler.ListSkills)

	runtime := app.Group("/api/runtime")
	runtime.Get("/lmstudio", runtimeHandler.GetLMStudio)
	runtime.Put("/lmstudio", runtimeHandler.PutLMStudio)

	// WebSocket
	app.Use("/ws", hub.UpgradeMiddleware())
	app.Get("/ws/:runId", hub.Handler())

	return app
}

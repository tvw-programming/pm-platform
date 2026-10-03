package handlers

import (
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"pm-platform/server/internal/models"
	"pm-platform/server/internal/services"
	"pm-platform/server/internal/websocket"
)

type ChatHandler struct {
	DB     *gorm.DB
	Hub    *websocket.Hub
	Agents *services.AgentService
}

type CreateMessageRequest struct {
	RunID        string   `json:"run_id"`
	AuthorID     string   `json:"author_id"`
	AuthorName   string   `json:"author_name"`
	AuthorRoles  []string `json:"author_roles"`
	Mode         string   `json:"mode"`
	EventType    string   `json:"event_type,omitempty"`
	TemplateID   string   `json:"template_id,omitempty"`
	Body         string   `json:"body"`
	ArtifactRefs []string `json:"artifact_refs,omitempty"`
}

func (h *ChatHandler) ListMessages(c *fiber.Ctx) error {
	runID := c.Params("runId")
	var messages []models.Message
	if err := h.DB.Where("run_id = ?", runID).Order("created_at ASC").Find(&messages).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(messages)
}

func (h *ChatHandler) CreateMessage(c *fiber.Ctx) error {
	var req CreateMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	if req.RunID == "" || req.Body == "" || req.AuthorID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "run_id, author_id, and body are required"})
	}

	rolesJSON, _ := json.Marshal(req.AuthorRoles)
	refsJSON, _ := json.Marshal(req.ArtifactRefs)

	msg := models.Message{
		ID:           uuid.New().String(),
		RunID:        req.RunID,
		AuthorID:     req.AuthorID,
		AuthorName:   req.AuthorName,
		AuthorRoles:  string(rolesJSON),
		Mode:         models.ChatMode(req.Mode),
		EventType:    req.EventType,
		TemplateID:   req.TemplateID,
		Body:         req.Body,
		ArtifactRefs: string(refsJSON),
	}

	if msg.Mode == "" {
		msg.Mode = models.ChatModeNormal
	}

	if err := h.DB.Create(&msg).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	response := fiber.Map{"message": msg}

	// If work_event mode, trigger playbook routing
	if msg.Mode == models.ChatModeWork && msg.EventType != "" {
		pb := services.FindPlaybookByTrigger(msg.EventType)
		if pb != nil {
			var roster []models.RosterEntry
			h.DB.Where("run_id = ? AND present = true", req.RunID).Find(&roster)

			resolution := services.ResolvePlaybook(pb.ID, roster, req.AuthorID)

			instance, err := services.CreatePlaybookInstance(h.DB, req.RunID, pb.ID, msg.ID, resolution)
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "failed to create playbook instance: " + err.Error()})
			}

			msg.PlaybookID = pb.ID
			h.DB.Save(&msg)

			tickets, err := services.CreateTicketsFromResolution(h.DB, req.RunID, instance.ID, msg.ID, resolution, pb.Steps)
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "failed to create tickets: " + err.Error()})
			}

			response["playbook_instance"] = instance
			response["tickets"] = tickets
			response["resolution"] = resolution
		}
	}

	h.Hub.Broadcast(req.RunID, websocket.Event{
		Type: "new_message",
		Data: response,
	})

	// Phase 3: auto virtual-team flow (PM → sfd/sbd → qa) — no manual Assign/Run
	if h.Agents != nil && services.ShouldStartAutoFlow(&msg) {
		runID := req.RunID
		msgID := msg.ID
		body := msg.Body
		go func() {
			_, _ = h.Agents.StartAutoFlow(runID, "", msgID, body)
		}()
		response["auto_flow"] = "started"
	}

	return c.Status(201).JSON(response)
}

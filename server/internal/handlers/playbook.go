package handlers

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"pm-platform/server/internal/models"
	"pm-platform/server/internal/services"
)

type PlaybookHandler struct {
	DB *gorm.DB
}

func (h *PlaybookHandler) ListPlaybooks(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"playbooks":   services.PlaybookCatalog,
		"event_types": services.ListEventTypes(),
	})
}

func (h *PlaybookHandler) GetPlaybook(c *fiber.Ctx) error {
	playbookID := c.Params("playbookId")
	pm := services.PlaybookCatalogMap()
	pb, ok := pm[playbookID]
	if !ok {
		return c.Status(404).JSON(fiber.Map{"error": "playbook not found"})
	}
	return c.JSON(pb)
}

type PreviewRequest struct {
	RunID     string `json:"run_id"`
	EventType string `json:"event_type"`
	AuthorID  string `json:"author_id"`
}

func (h *PlaybookHandler) Preview(c *fiber.Ctx) error {
	var req PreviewRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	pb := services.FindPlaybookByTrigger(req.EventType)
	if pb == nil {
		return c.Status(404).JSON(fiber.Map{"error": "no playbook for event type: " + req.EventType})
	}

	var roster []models.RosterEntry
	h.DB.Where("run_id = ? AND present = true", req.RunID).Find(&roster)

	resolution := services.ResolvePlaybook(pb.ID, roster, req.AuthorID)

	return c.JSON(fiber.Map{
		"playbook":   pb,
		"resolution": resolution,
	})
}

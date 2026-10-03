package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"pm-platform/server/internal/models"
	"pm-platform/server/internal/websocket"
)

type RosterHandler struct {
	DB  *gorm.DB
	Hub *websocket.Hub
}

type SetRosterRequest struct {
	Entries []RosterEntryInput `json:"entries"`
}

type RosterEntryInput struct {
	RoleID   string  `json:"role_id"`
	UserID   string  `json:"user_id"`
	UserName string  `json:"user_name"`
	AgentID  *string `json:"agent_id"`
	Present  bool    `json:"present"`
}

func (h *RosterHandler) GetRoster(c *fiber.Ctx) error {
	runID := c.Params("runId")
	var entries []models.RosterEntry
	if err := h.DB.Where("run_id = ?", runID).Find(&entries).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	roleMap := models.RoleCatalogMap()
	type EnrichedEntry struct {
		models.RosterEntry
		RoleLabel string `json:"role_label"`
		Track     string `json:"track"`
		Seniority string `json:"seniority"`
	}
	enriched := make([]EnrichedEntry, 0, len(entries))
	for _, e := range entries {
		entry := EnrichedEntry{RosterEntry: e}
		if def, ok := roleMap[e.RoleID]; ok {
			entry.RoleLabel = def.Label
			entry.Track = def.Track
			entry.Seniority = def.Seniority
		}
		enriched = append(enriched, entry)
	}

	return c.JSON(enriched)
}

func (h *RosterHandler) SetRoster(c *fiber.Ctx) error {
	runID := c.Params("runId")
	var req SetRosterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	// Upsert entries — human OR agent seat; one seat per run_id+role_id
	for _, input := range req.Entries {
		if input.AgentID == nil && input.UserID == "" {
			return c.Status(400).JSON(fiber.Map{"error": "each entry needs user_id or agent_id"})
		}
		if input.AgentID != nil {
			var agent models.AgentInstance
			if err := h.DB.First(&agent, "id = ?", *input.AgentID).Error; err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "unknown agent_id: " + *input.AgentID})
			}
			if input.UserName == "" {
				input.UserName = agent.Name
			}
			if input.UserID == "" {
				input.UserID = "agent:" + agent.ID
			}
			if input.RoleID == "" {
				input.RoleID = agent.RoleID
			}
		}

		var existing models.RosterEntry
		result := h.DB.Where("run_id = ? AND role_id = ?", runID, input.RoleID).First(&existing)

		if result.Error == gorm.ErrRecordNotFound {
			entry := models.RosterEntry{
				ID:       uuid.New().String(),
				RunID:    runID,
				RoleID:   input.RoleID,
				UserID:   input.UserID,
				UserName: input.UserName,
				AgentID:  input.AgentID,
				Present:  input.Present,
			}
			h.DB.Create(&entry)
		} else {
			updates := map[string]interface{}{
				"user_id":   input.UserID,
				"user_name": input.UserName,
				"present":   input.Present,
			}
			if input.AgentID != nil {
				updates["agent_id"] = *input.AgentID
			} else {
				updates["agent_id"] = nil
			}
			h.DB.Model(&existing).Updates(updates)
		}
	}

	h.Hub.Broadcast(runID, websocket.Event{Type: "roster_updated", Data: nil})

	var entries []models.RosterEntry
	h.DB.Where("run_id = ?", runID).Find(&entries)
	return c.JSON(entries)
}

func (h *RosterHandler) RemoveRole(c *fiber.Ctx) error {
	runID := c.Params("runId")
	roleID := c.Params("roleId")

	if err := h.DB.Where("run_id = ? AND role_id = ?", runID, roleID).Delete(&models.RosterEntry{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	h.Hub.Broadcast(runID, websocket.Event{Type: "roster_updated", Data: nil})

	return c.JSON(fiber.Map{"status": "removed"})
}

package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"pm-platform/server/internal/models"
	"pm-platform/server/internal/services"
	"pm-platform/server/internal/websocket"
)

type AgentHandler struct {
	DB      *gorm.DB
	Hub     *websocket.Hub
	Agents  *services.AgentService
}

type HireAgentRequest struct {
	ProjectID        string  `json:"project_id"`
	Name             string  `json:"name"`
	RoleID           string  `json:"role_id"`
	Instructions     string  `json:"instructions"`
	Model            string  `json:"model"`
	ReportsToAgentID *string `json:"reports_to_agent_id"`
	TokenBudget      *int64  `json:"token_budget"`
	SeatRunID        string  `json:"seat_run_id"` // auto-seat on this chat run
	SkillSlugs       []string `json:"skill_slugs"`
}

type PatchAgentRequest struct {
	Name             *string `json:"name"`
	Instructions     *string `json:"instructions"`
	Model            *string `json:"model"`
	Status           *string `json:"status"`
	ReportsToAgentID *string `json:"reports_to_agent_id"`
	TokenBudget      *int64  `json:"token_budget"`
	SeatRunID        *string `json:"seat_run_id"`
}

type CreateRunRequest struct {
	RunID      string `json:"run_id"`
	WakeReason string `json:"wake_reason"`
	Input      string `json:"input"`
}

func (h *AgentHandler) ListAgents(c *fiber.Ctx) error {
	projectID := c.Query("project_id", "project-default")
	var agents []models.AgentInstance
	q := h.DB.Where("status != ?", models.AgentStatusTerminated)
	if projectID != "" {
		q = q.Where("project_id = ?", projectID)
	}
	if err := q.Order("created_at ASC").Find(&agents).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(agents)
}

func (h *AgentHandler) HireAgent(c *fiber.Ctx) error {
	var req HireAgentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.Name == "" || req.RoleID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "name and role_id are required"})
	}
	if req.ProjectID == "" {
		req.ProjectID = "project-default"
	}

	// One active/paused agent per project+role (long-lived hire)
	var existing models.AgentInstance
	err := h.DB.Where("project_id = ? AND role_id = ? AND status IN ?", req.ProjectID, req.RoleID,
		[]models.AgentStatus{models.AgentStatusActive, models.AgentStatusPaused}).First(&existing).Error
	if err == nil {
		return c.Status(409).JSON(fiber.Map{"error": "an agent for this role already exists on the project", "agent": existing})
	}
	if err != gorm.ErrRecordNotFound {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	agent := models.AgentInstance{
		ID:               uuid.New().String(),
		ProjectID:        req.ProjectID,
		Name:             req.Name,
		RoleID:           req.RoleID,
		Status:           models.AgentStatusActive,
		Instructions:     req.Instructions,
		ModelName:        req.Model,
		ReportsToAgentID: req.ReportsToAgentID,
		TokenBudget:      req.TokenBudget,
	}
	if err := h.DB.Create(&agent).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.Agents.AttachDefaultSkills(&agent); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to attach skills: " + err.Error()})
	}
	for _, slug := range req.SkillSlugs {
		var skill models.Skill
		if err := h.DB.Where("slug = ?", slug).First(&skill).Error; err != nil {
			continue
		}
		var link models.AgentSkill
		if err := h.DB.Where("agent_id = ? AND skill_id = ?", agent.ID, skill.ID).First(&link).Error; err == gorm.ErrRecordNotFound {
			_ = h.DB.Create(&models.AgentSkill{ID: uuid.New().String(), AgentID: agent.ID, SkillID: skill.ID}).Error
		}
	}

	seatRunID := req.SeatRunID
	if seatRunID == "" {
		seatRunID = "run-default"
	}
	entry, err := h.Agents.SeatAgentOnRun(seatRunID, &agent)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "hired but failed to seat: " + err.Error()})
	}
	h.Hub.Broadcast(seatRunID, websocket.Event{Type: "roster_updated", Data: nil})

	return c.Status(201).JSON(fiber.Map{"agent": agent, "roster_entry": entry})
}

func (h *AgentHandler) GetAgent(c *fiber.Ctx) error {
	id := c.Params("id")
	var agent models.AgentInstance
	if err := h.DB.First(&agent, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "agent not found"})
	}
	skills, _ := h.Agents.LoadAgentSkills(agent.ID)
	return c.JSON(fiber.Map{"agent": agent, "skills": skills})
}

func (h *AgentHandler) PatchAgent(c *fiber.Ctx) error {
	id := c.Params("id")
	var agent models.AgentInstance
	if err := h.DB.First(&agent, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "agent not found"})
	}
	var req PatchAgentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	updates := map[string]interface{}{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Instructions != nil {
		updates["instructions"] = *req.Instructions
	}
	if req.Model != nil {
		updates["model"] = *req.Model
	}
	if req.Status != nil {
		switch models.AgentStatus(*req.Status) {
		case models.AgentStatusActive, models.AgentStatusPaused, models.AgentStatusTerminated:
			updates["status"] = *req.Status
		default:
			return c.Status(400).JSON(fiber.Map{"error": "status must be active, paused, or terminated"})
		}
	}
	if req.ReportsToAgentID != nil {
		updates["reports_to_agent_id"] = *req.ReportsToAgentID
	}
	if req.TokenBudget != nil {
		updates["token_budget"] = *req.TokenBudget
	}
	if len(updates) > 0 {
		if err := h.DB.Model(&agent).Updates(updates).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
	}
	_ = h.DB.First(&agent, "id = ?", id)

	if req.SeatRunID != nil && *req.SeatRunID != "" {
		if _, err := h.Agents.SeatAgentOnRun(*req.SeatRunID, &agent); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		h.Hub.Broadcast(*req.SeatRunID, websocket.Event{Type: "roster_updated", Data: nil})
	}

	return c.JSON(agent)
}

func (h *AgentHandler) CreateRun(c *fiber.Ctx) error {
	id := c.Params("id")
	var agent models.AgentInstance
	if err := h.DB.First(&agent, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "agent not found"})
	}
	var req CreateRunRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.RunID == "" {
		req.RunID = "run-default"
	}
	if req.WakeReason == "" {
		req.WakeReason = "manual_assign"
	}

	agentRun, msg, err := h.Agents.Invoke(&agent, services.InvokeAgentRequest{
		RunID:      req.RunID,
		WakeReason: req.WakeReason,
		Input:      req.Input,
	})
	if err != nil && agentRun == nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	status := 201
	if agentRun != nil && agentRun.Status == models.AgentRunStatusFailed {
		status = 502
	}
	return c.Status(status).JSON(fiber.Map{
		"agent_run": agentRun,
		"message":   msg,
		"error":     errString(err),
	})
}

func (h *AgentHandler) ListRuns(c *fiber.Ctx) error {
	id := c.Params("id")
	var runs []models.AgentRun
	if err := h.DB.Where("agent_id = ?", id).Order("created_at DESC").Limit(100).Find(&runs).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(runs)
}

func (h *AgentHandler) ListSkills(c *fiber.Ctx) error {
	var skills []models.Skill
	if err := h.DB.Order("slug ASC").Find(&skills).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(skills)
}

func errString(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}

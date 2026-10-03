package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"pm-platform/server/internal/models"
	"pm-platform/server/internal/services"
)

type Phase2Handler struct {
	DB     *gorm.DB
	Agents *services.AgentService
}

func (h *Phase2Handler) AgentOps(c *fiber.Ctx) error {
	projectID := c.Query("project_id", "project-default")
	return c.JSON(h.Agents.AgentOpsSummary(projectID))
}

func (h *Phase2Handler) ListTeamTemplates(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"templates": []fiber.Map{
			{
				"id":          "product-eng-pod",
				"name":        "Product Eng Pod",
				"description": "PM + Senior FE + Senior BE + QA Lead with playbook-aligned skills",
				"roles":       []string{"project_manager", "senior_fe", "senior_be", "qa_lead"},
			},
		},
	})
}

func (h *Phase2Handler) InstallTeamTemplate(c *fiber.Ctx) error {
	id := c.Params("id")
	if id != "product-eng-pod" {
		return c.Status(404).JSON(fiber.Map{"error": "unknown team template"})
	}
	var req struct {
		ProjectID string `json:"project_id"`
		SeatRunID string `json:"seat_run_id"`
	}
	_ = c.BodyParser(&req)
	agents, err := h.Agents.InstallProductEngPod(req.ProjectID, req.SeatRunID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error(), "agents": agents})
	}
	return c.Status(201).JSON(fiber.Map{"template_id": id, "agents": agents})
}

func (h *Phase2Handler) CreateHandoff(c *fiber.Ctx) error {
	var req struct {
		RunID     string                   `json:"run_id"`
		ProjectID string                   `json:"project_id"`
		Payload   services.HandoffPayload  `json:"payload"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}
	if req.RunID == "" {
		req.RunID = "run-default"
	}
	if req.ProjectID == "" {
		req.ProjectID = "project-default"
	}
	hnd, msg, err := h.Agents.CreateHandoff(req.RunID, req.ProjectID, req.Payload)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(fiber.Map{"handoff": hnd, "message": msg})
}

func (h *Phase2Handler) PassHandoff(c *fiber.Ctx) error {
	id := c.Params("id")
	var req struct {
		RunID       string   `json:"run_id"`
		TargetRoles []string `json:"target_roles"`
	}
	_ = c.BodyParser(&req)
	if req.RunID == "" {
		req.RunID = "run-default"
	}
	hnd, wakes, err := h.Agents.PassHandoff(id, req.RunID, req.TargetRoles)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"handoff": hnd, "wakes": wakes})
}

func (h *Phase2Handler) ListHandoffs(c *fiber.Ctx) error {
	runID := c.Query("run_id", "run-default")
	var list []models.Handoff
	if err := h.DB.Where("run_id = ?", runID).Order("created_at DESC").Find(&list).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(list)
}

func (h *Phase2Handler) CreatePlan(c *fiber.Ctx) error {
	var req services.CreatePlanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}
	plan, ticket, msg, err := h.Agents.CreatePlan(req)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(fiber.Map{"plan": plan, "ticket": ticket, "message": msg})
}

func (h *Phase2Handler) ApprovePlan(c *fiber.Ctx) error {
	id := c.Params("id")
	var req struct {
		RunID string `json:"run_id"`
	}
	_ = c.BodyParser(&req)
	if req.RunID == "" {
		req.RunID = "run-default"
	}
	plan, children, err := h.Agents.ApprovePlan(id, req.RunID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"plan": plan, "children": children})
}

func (h *Phase2Handler) RejectPlan(c *fiber.Ctx) error {
	id := c.Params("id")
	var req struct {
		RunID   string `json:"run_id"`
		Comment string `json:"comment"`
	}
	_ = c.BodyParser(&req)
	if req.RunID == "" {
		req.RunID = "run-default"
	}
	plan, err := h.Agents.RejectPlan(id, req.RunID, req.Comment)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(plan)
}

func (h *Phase2Handler) GetPlan(c *fiber.Ctx) error {
	id := c.Params("id")
	var plan models.TaskPlan
	if err := h.DB.First(&plan, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "plan not found"})
	}
	return c.JSON(plan)
}

func (h *Phase2Handler) GetProjectAgentConfig(c *fiber.Ctx) error {
	projectID := c.Params("id")
	pac, err := h.Agents.GetOrCreateProjectAgentConfig(projectID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(pac)
}

func (h *Phase2Handler) PutProjectAgentConfig(c *fiber.Ctx) error {
	projectID := c.Params("id")
	var req struct {
		RepoURL         string `json:"repo_url"`
		PrimaryCwd      string `json:"primary_cwd"`
		EnvJSON         string `json:"env_json"`
		SoftTokenBudget *int64 `json:"soft_token_budget"`
		HardTokenBudget *int64 `json:"hard_token_budget"`
		BudgetPaused    *bool  `json:"budget_paused"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}
	pac, err := h.Agents.UpsertProjectAgentConfig(projectID, req.RepoURL, req.PrimaryCwd, req.SoftTokenBudget, req.HardTokenBudget, req.EnvJSON)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	if req.BudgetPaused != nil {
		_ = h.DB.Model(pac).Update("budget_paused", *req.BudgetPaused).Error
		pac.BudgetPaused = *req.BudgetPaused
	}
	return c.JSON(pac)
}

func (h *Phase2Handler) ListRoutines(c *fiber.Ctx) error {
	projectID := c.Query("project_id", "project-default")
	_ = h.Agents.SeedRoutines(projectID)
	var list []models.Routine
	if err := h.DB.Where("project_id = ?", projectID).Order("name ASC").Find(&list).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(list)
}

func (h *Phase2Handler) RunRoutine(c *fiber.Ctx) error {
	key := c.Params("key")
	var req struct {
		RunID string `json:"run_id"`
	}
	_ = c.BodyParser(&req)
	rr, err := h.Agents.RunRoutine(key, req.RunID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error(), "routine_run": rr})
	}
	return c.JSON(rr)
}

func (h *Phase2Handler) GetExecutionPolicy(c *fiber.Ctx) error {
	taskID := c.Params("taskId")
	var pol models.ExecutionPolicyRecord
	if err := h.DB.Where("task_id = ?", taskID).First(&pol).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "no execution policy"})
	}
	return c.JSON(pol)
}

func (h *Phase2Handler) PutExecutionPolicy(c *fiber.Ctx) error {
	taskID := c.Params("taskId")
	var req struct {
		ProjectID       string `json:"project_id"`
		MaxReviewRounds int    `json:"max_review_rounds"`
		CommentRequired *bool  `json:"comment_required"`
		StagesJSON      string `json:"stages_json"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}
	if req.ProjectID == "" {
		req.ProjectID = "project-default"
	}
	var pol models.ExecutionPolicyRecord
	err := h.DB.Where("task_id = ?", taskID).First(&pol).Error
	if err == gorm.ErrRecordNotFound {
		pol = models.ExecutionPolicyRecord{
			ID:              "",
			TaskID:          taskID,
			ProjectID:       req.ProjectID,
			Mode:            "normal",
			CommentRequired: true,
			MaxReviewRounds: 3,
			StagesJSON:      models.DefaultImplementationPolicyJSON,
			Status:          "idle",
		}
		if req.MaxReviewRounds > 0 {
			pol.MaxReviewRounds = req.MaxReviewRounds
		}
		if req.CommentRequired != nil {
			pol.CommentRequired = *req.CommentRequired
		}
		if req.StagesJSON != "" {
			pol.StagesJSON = req.StagesJSON
		}
		pol.ID = uuid.New().String()
		if err := h.DB.Create(&pol).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(201).JSON(pol)
	}
	updates := map[string]interface{}{}
	if req.MaxReviewRounds > 0 {
		updates["max_review_rounds"] = req.MaxReviewRounds
	}
	if req.CommentRequired != nil {
		updates["comment_required"] = *req.CommentRequired
	}
	if req.StagesJSON != "" {
		updates["stages_json"] = req.StagesJSON
	}
	if len(updates) > 0 {
		_ = h.DB.Model(&pol).Updates(updates).Error
	}
	_ = h.DB.First(&pol, "task_id = ?", taskID)
	return c.JSON(pol)
}

func (h *Phase2Handler) TransitionTask(c *fiber.Ctx) error {
	taskID := c.Params("taskId")
	var req struct {
		ProjectID  string `json:"project_id"`
		FromStatus string `json:"from_status"`
		ToStatus   string `json:"to_status"`
		Comment    string `json:"comment"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
	}
	pol, effective, err := h.Agents.TransitionTaskStatus(taskID, req.ProjectID, req.FromStatus, req.ToStatus, req.Comment)
	if err != nil && pol != nil && pol.Status == "escalated" {
		return c.Status(409).JSON(fiber.Map{"error": err.Error(), "policy": pol, "effective_status": effective})
	}
	if err != nil && effective == req.FromStatus {
		return c.Status(400).JSON(fiber.Map{"error": err.Error(), "policy": pol, "effective_status": effective})
	}
	return c.JSON(fiber.Map{"policy": pol, "effective_status": effective, "requested_status": req.ToStatus})
}

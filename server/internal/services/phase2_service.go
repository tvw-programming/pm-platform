package services

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"pm-platform/server/internal/models"
	"pm-platform/server/internal/websocket"
)

// ProductEngPodRoles is the T1 Product Eng Pod template.
var ProductEngPodRoles = []struct {
	RoleID       string
	DefaultName  string
	SkillSlugs   []string
	ReportsToPM  bool
}{
	{RoleID: "project_manager", DefaultName: "Ada PM", SkillSlugs: []string{"issue-triage", "task-planning"}},
	{RoleID: "senior_fe", DefaultName: "Finn FE", SkillSlugs: []string{"github-pr-workflow"}, ReportsToPM: true},
	{RoleID: "senior_be", DefaultName: "Bea BE", SkillSlugs: []string{"github-pr-workflow"}, ReportsToPM: true},
	{RoleID: "qa_lead", DefaultName: "Quinn QA", SkillSlugs: []string{"qa-acceptance"}, ReportsToPM: true},
}

type HandoffPayload struct {
	ContractVersion   int      `json:"contract_version"`
	FromRole          string   `json:"from_role"`
	ToRoles           []string `json:"to_roles"`
	TaskID            string   `json:"task_id"`
	Summary           string   `json:"summary"`
	AcceptanceCriteria []string `json:"acceptance_criteria"`
	OpenQuestions     []string `json:"open_questions"`
	Artifacts         []string `json:"artifacts"`
	PlaybookHint      string   `json:"playbook_hint"`
	PRTitle           string   `json:"pr_title"`
	PRBody            string   `json:"pr_body"`
	VerificationSteps string   `json:"verification_steps"`
	PRURL             string   `json:"pr_url"`
	FromAgentID       string   `json:"from_agent_id"`
}

func (s *AgentService) CheckBudgets(agent *models.AgentInstance) (softHit bool, hardHit bool, err error) {
	if agent.BudgetPaused {
		return false, true, fmt.Errorf("agent budget paused (hard ceiling or manual)")
	}
	if agent.TokenBudget != nil && agent.TokensUsed >= *agent.TokenBudget {
		_ = s.DB.Model(agent).Updates(map[string]interface{}{
			"budget_paused": true,
			"status":        models.AgentStatusPaused,
		}).Error
		agent.BudgetPaused = true
		agent.Status = models.AgentStatusPaused
		return true, true, fmt.Errorf("hard token budget exhausted (%d/%d); agent paused", agent.TokensUsed, *agent.TokenBudget)
	}
	if agent.SoftTokenBudget != nil && agent.TokensUsed >= *agent.SoftTokenBudget {
		softHit = true
	}
	// Project ceiling
	var pac models.ProjectAgentConfig
	if err := s.DB.Where("project_id = ?", agent.ProjectID).First(&pac).Error; err == nil {
		if pac.BudgetPaused {
			return softHit, true, fmt.Errorf("project token ceiling paused")
		}
		if pac.HardTokenBudget != nil && pac.TokensUsed >= *pac.HardTokenBudget {
			_ = s.DB.Model(&pac).Update("budget_paused", true).Error
			return softHit, true, fmt.Errorf("project hard token budget exhausted (%d/%d)", pac.TokensUsed, *pac.HardTokenBudget)
		}
		if pac.SoftTokenBudget != nil && pac.TokensUsed >= *pac.SoftTokenBudget {
			softHit = true
		}
	}
	return softHit, false, nil
}

func (s *AgentService) ApplyTokenSpend(agent *models.AgentInstance, total int64) {
	_ = s.DB.Model(agent).Update("tokens_used", gorm.Expr("tokens_used + ?", total)).Error
	agent.TokensUsed += total
	var pac models.ProjectAgentConfig
	if err := s.DB.Where("project_id = ?", agent.ProjectID).First(&pac).Error; err == nil {
		_ = s.DB.Model(&pac).Update("tokens_used", gorm.Expr("tokens_used + ?", total)).Error
	}
	// Soft warn system message; hard pause
	soft, hard, _ := s.CheckBudgets(agent)
	if hard {
		return
	}
	if soft && s.Hub != nil {
		// soft only — status stays active; banner via ops strip
	}
}

func (s *AgentService) WakeAgentByRole(runID, projectID, roleID, wakeReason, input string) (*models.AgentRun, *models.Message, error) {
	var agent models.AgentInstance
	err := s.DB.Where("project_id = ? AND role_id = ? AND status = ?", projectID, roleID, models.AgentStatusActive).First(&agent).Error
	if err != nil {
		return nil, nil, fmt.Errorf("no active agent for role %s: %w", roleID, err)
	}
	// Ensure seated
	if _, err := s.SeatAgentOnRun(runID, &agent); err != nil {
		return nil, nil, err
	}
	return s.Invoke(&agent, InvokeAgentRequest{
		RunID:      runID,
		WakeReason: wakeReason,
		Input:      input,
	})
}

func (s *AgentService) CreateHandoff(runID, projectID string, p HandoffPayload) (*models.Handoff, *models.Message, error) {
	if p.ContractVersion == 0 {
		p.ContractVersion = 1
	}
	if p.Summary == "" {
		return nil, nil, fmt.Errorf("summary is required")
	}
	if len(p.ToRoles) == 0 {
		return nil, nil, fmt.Errorf("to_roles is required")
	}
	toJSON, _ := json.Marshal(p.ToRoles)
	acJSON, _ := json.Marshal(p.AcceptanceCriteria)
	oqJSON, _ := json.Marshal(p.OpenQuestions)
	artJSON, _ := json.Marshal(p.Artifacts)

	var fromAgentID *string
	if p.FromAgentID != "" {
		fromAgentID = &p.FromAgentID
	}

	h := models.Handoff{
		ID:                uuid.New().String(),
		RunID:             runID,
		ProjectID:         projectID,
		FromAgentID:       fromAgentID,
		FromRole:          p.FromRole,
		ToRolesJSON:       string(toJSON),
		TaskID:            p.TaskID,
		Summary:           p.Summary,
		AcceptanceJSON:    string(acJSON),
		OpenQuestionsJSON: string(oqJSON),
		ArtifactsJSON:     string(artJSON),
		PlaybookHint:      p.PlaybookHint,
		PRTitle:           p.PRTitle,
		PRBody:            p.PRBody,
		VerificationSteps: p.VerificationSteps,
		PRURL:             p.PRURL,
		Status:            "open",
		ContractVersion:   p.ContractVersion,
	}

	cardBody := formatHandoffMessage(&h, p.ToRoles)
	rolesJSON, _ := json.Marshal([]string{p.FromRole, "handoff"})
	authorID := "system"
	authorName := "Handoff"
	if fromAgentID != nil {
		authorID = "agent:" + *fromAgentID
		var ag models.AgentInstance
		if err := s.DB.First(&ag, "id = ?", *fromAgentID).Error; err == nil {
			authorName = ag.Name
		}
	}
	msg := models.Message{
		ID:          uuid.New().String(),
		RunID:       runID,
		AuthorID:    authorID,
		AuthorName:  authorName,
		AuthorRoles: string(rolesJSON),
		Mode:        models.ChatModeNormal,
		Body:        cardBody,
		AgentID:     fromAgentID,
	}
	if err := s.DB.Create(&msg).Error; err != nil {
		return nil, nil, err
	}
	h.MessageID = &msg.ID
	if err := s.DB.Create(&h).Error; err != nil {
		return nil, nil, err
	}

	s.Hub.Broadcast(runID, websocket.Event{Type: "new_message", Data: map[string]interface{}{"message": msg}})
	s.Hub.Broadcast(runID, websocket.Event{Type: "handoff_created", Data: h})
	return &h, &msg, nil
}

func formatHandoffMessage(h *models.Handoff, toRoles []string) string {
	payload := map[string]interface{}{
		"contract_version":     h.ContractVersion,
		"handoff_id":           h.ID,
		"from_role":            h.FromRole,
		"to_roles":             toRoles,
		"task_id":              h.TaskID,
		"summary":              h.Summary,
		"pr_title":             h.PRTitle,
		"pr_body":              h.PRBody,
		"verification_steps":   h.VerificationSteps,
		"pr_url":               h.PRURL,
		"playbook_hint":        h.PlaybookHint,
	}
	var ac, oq, art interface{}
	_ = json.Unmarshal([]byte(h.AcceptanceJSON), &ac)
	_ = json.Unmarshal([]byte(h.OpenQuestionsJSON), &oq)
	_ = json.Unmarshal([]byte(h.ArtifactsJSON), &art)
	payload["acceptance_criteria"] = ac
	payload["open_questions"] = oq
	payload["artifacts"] = art
	raw, _ := json.MarshalIndent(payload, "", "  ")
	return "```cgen-handoff\n" + string(raw) + "\n```"
}

func (s *AgentService) PassHandoff(handoffID, runID string, targetRoles []string) (*models.Handoff, []map[string]interface{}, error) {
	var h models.Handoff
	if err := s.DB.First(&h, "id = ?", handoffID).Error; err != nil {
		return nil, nil, fmt.Errorf("handoff not found")
	}
	if len(targetRoles) == 0 {
		_ = json.Unmarshal([]byte(h.ToRolesJSON), &targetRoles)
	}
	h.Status = "passed"
	_ = s.DB.Save(&h).Error

	wakes := []map[string]interface{}{}
	input := fmt.Sprintf("Handoff received from %s.\nTask: %s\nSummary: %s\nPR title: %s\nVerification: %s\nPlease continue your role work and emit the next handoff or QA report.",
		h.FromRole, h.TaskID, h.Summary, h.PRTitle, h.VerificationSteps)
	for _, role := range targetRoles {
		ar, msg, err := s.WakeAgentByRole(runID, h.ProjectID, role, "handoff_pass", input)
		entry := map[string]interface{}{"role_id": role}
		if err != nil {
			entry["error"] = err.Error()
		} else {
			entry["agent_run"] = ar
			entry["message"] = msg
		}
		wakes = append(wakes, entry)
	}

	rolesJSON, _ := json.Marshal([]string{"system"})
	sys := models.Message{
		ID:          uuid.New().String(),
		RunID:       runID,
		AuthorID:    "system",
		AuthorName:  "System",
		AuthorRoles: string(rolesJSON),
		Mode:        models.ChatModeNormal,
		Body:        fmt.Sprintf("Handoff passed · %s → %s · task=%s", h.FromRole, strings.Join(targetRoles, ","), h.TaskID),
	}
	_ = s.DB.Create(&sys).Error
	s.Hub.Broadcast(runID, websocket.Event{Type: "new_message", Data: map[string]interface{}{"message": sys}})
	s.Hub.Broadcast(runID, websocket.Event{Type: "handoff_passed", Data: map[string]interface{}{"handoff": h, "wakes": wakes}})
	return &h, wakes, nil
}

type CreatePlanRequest struct {
	RunID        string             `json:"run_id"`
	ProjectID    string             `json:"project_id"`
	AgentID      string             `json:"agent_id"`
	Goal         string             `json:"goal"`
	BodyMarkdown string             `json:"body_markdown"`
	Children     []models.PlanChild `json:"children"`
}

func (s *AgentService) CreatePlan(req CreatePlanRequest) (*models.TaskPlan, *models.Ticket, *models.Message, error) {
	if req.RunID == "" {
		req.RunID = "run-default"
	}
	if req.ProjectID == "" {
		req.ProjectID = "project-default"
	}
	if req.Goal == "" {
		return nil, nil, nil, fmt.Errorf("goal is required")
	}
	if len(req.Children) == 0 {
		return nil, nil, nil, fmt.Errorf("children breakdown is required")
	}
	childrenJSON, _ := json.Marshal(req.Children)
	var agentID *string
	if req.AgentID != "" {
		agentID = &req.AgentID
	}
	plan := models.TaskPlan{
		ID:           uuid.New().String(),
		RunID:        req.RunID,
		ProjectID:    req.ProjectID,
		AgentID:      agentID,
		Goal:         req.Goal,
		BodyMarkdown: req.BodyMarkdown,
		ChildrenJSON: string(childrenJSON),
		Status:       "pending_approval",
	}

	card := formatPlanMessage(&plan, req.Children)
	rolesJSON, _ := json.Marshal([]string{"project_manager", "plan"})
	msg := models.Message{
		ID:          uuid.New().String(),
		RunID:       req.RunID,
		AuthorID:    "system",
		AuthorName:  "Plan",
		AuthorRoles: string(rolesJSON),
		Mode:        models.ChatModeNormal,
		Body:        card,
		AgentID:     agentID,
	}
	if err := s.DB.Create(&msg).Error; err != nil {
		return nil, nil, nil, err
	}
	plan.MessageID = &msg.ID

	ticket := models.Ticket{
		ID:                 uuid.New().String(),
		RunID:              req.RunID,
		PlaybookInstanceID: "plan:" + plan.ID,
		RoleID:             "human_requester",
		UserID:             "user-1",
		Kind:               models.TicketApproveReject,
		Status:             models.TicketStatusPending,
		ParentMessageID:    msg.ID,
	}
	due := time.Now().Add(24 * time.Hour)
	ticket.DueBy = &due
	if err := s.DB.Create(&ticket).Error; err != nil {
		return nil, nil, nil, err
	}
	plan.TicketID = &ticket.ID
	if err := s.DB.Create(&plan).Error; err != nil {
		return nil, nil, nil, err
	}

	s.Hub.Broadcast(req.RunID, websocket.Event{
		Type: "new_message",
		Data: map[string]interface{}{"message": msg, "tickets": []models.Ticket{ticket}},
	})
	s.Hub.Broadcast(req.RunID, websocket.Event{Type: "plan_created", Data: plan})
	return &plan, &ticket, &msg, nil
}

func formatPlanMessage(plan *models.TaskPlan, children []models.PlanChild) string {
	payload := map[string]interface{}{
		"plan_id":  plan.ID,
		"goal":     plan.Goal,
		"body":     plan.BodyMarkdown,
		"children": children,
		"status":   plan.Status,
	}
	raw, _ := json.MarshalIndent(payload, "", "  ")
	return "```cgen-plan\n" + string(raw) + "\n```\n\n**Awaiting human approval** before FE/BE/QA child tasks are created."
}

type ApprovedChildTask struct {
	ID               string   `json:"id"`
	Key              string   `json:"key"`
	Title            string   `json:"title"`
	RoleID           string   `json:"role_id"`
	AssigneeKind     string   `json:"assignee_kind"`
	AssigneeAgentID  string   `json:"assignee_agent_id,omitempty"`
	Acceptance       []string `json:"acceptance_criteria,omitempty"`
	BlockedByTaskIDs []string `json:"blocked_by_task_ids,omitempty"`
	StoryPoints      int      `json:"story_points,omitempty"`
	Status           string   `json:"status"`
	Origin           string   `json:"origin"`
	ProjectID        string   `json:"project_id"`
	SprintID         string   `json:"sprint_id,omitempty"`
}

func (s *AgentService) ApprovePlan(planID, runID string) (*models.TaskPlan, []ApprovedChildTask, error) {
	var plan models.TaskPlan
	if err := s.DB.First(&plan, "id = ?", planID).Error; err != nil {
		return nil, nil, fmt.Errorf("plan not found")
	}
	if plan.Status != "pending_approval" {
		return nil, nil, fmt.Errorf("plan is already %s", plan.Status)
	}
	var children []models.PlanChild
	if err := json.Unmarshal([]byte(plan.ChildrenJSON), &children); err != nil {
		return nil, nil, fmt.Errorf("invalid children_json")
	}

	created := make([]ApprovedChildTask, 0, len(children))
	ids := make([]string, len(children))
	for i, ch := range children {
		id := "vt-" + uuid.New().String()[:8]
		ids[i] = id
		key := fmt.Sprintf("AVT-%d", 100+i)
		task := ApprovedChildTask{
			ID:           id,
			Key:          key,
			Title:        ch.Title,
			RoleID:       ch.RoleID,
			AssigneeKind: "agent",
			Acceptance:   ch.Acceptance,
			StoryPoints:  ch.StoryPoints,
			Status:       "todo",
			Origin:       "plan",
			ProjectID:    plan.ProjectID,
			SprintID:     "s-atl-15",
		}
		var agent models.AgentInstance
		if err := s.DB.Where("project_id = ? AND role_id = ? AND status = ?", plan.ProjectID, ch.RoleID, models.AgentStatusActive).First(&agent).Error; err == nil {
			task.AssigneeAgentID = agent.ID
		}
		created = append(created, task)
	}
	for i, ch := range children {
		for _, bi := range ch.BlockedByIndexes {
			if bi >= 0 && bi < len(ids) {
				created[i].BlockedByTaskIDs = append(created[i].BlockedByTaskIDs, ids[bi])
			}
		}
		if len(created[i].BlockedByTaskIDs) > 0 {
			created[i].Status = "blocked"
		}
	}

	idsJSON, _ := json.Marshal(ids)
	plan.Status = "approved"
	plan.CreatedTaskIDs = string(idsJSON)
	_ = s.DB.Save(&plan).Error

	if plan.TicketID != nil {
		var ticket models.Ticket
		if err := s.DB.First(&ticket, "id = ?", *plan.TicketID).Error; err == nil && ticket.Status == models.TicketStatusPending {
			now := time.Now()
			ticket.Status = models.TicketStatusApproved
			ticket.Comment = "Plan approved — child tasks created"
			ticket.ResolvedAt = &now
			_ = s.DB.Save(&ticket).Error
			s.Hub.Broadcast(runID, websocket.Event{Type: "ticket_resolved", Data: ticket})
		}
	}

	// Attach default execution policy to each impl child
	for _, t := range created {
		if t.RoleID == "senior_fe" || t.RoleID == "senior_be" {
			_ = s.DB.Create(&models.ExecutionPolicyRecord{
				ID:              uuid.New().String(),
				TaskID:          t.ID,
				ProjectID:       plan.ProjectID,
				Mode:            "normal",
				CommentRequired: true,
				MaxReviewRounds: 3,
				StagesJSON:      models.DefaultImplementationPolicyJSON,
				Status:          "idle",
			}).Error
		}
	}

	rolesJSON, _ := json.Marshal([]string{"system"})
	var lines []string
	for _, t := range created {
		lines = append(lines, fmt.Sprintf("- %s · %s → %s (%s)", t.Key, t.Title, t.RoleID, t.Status))
	}
	sys := models.Message{
		ID:          uuid.New().String(),
		RunID:       runID,
		AuthorID:    "system",
		AuthorName:  "System",
		AuthorRoles: string(rolesJSON),
		Mode:        models.ChatModeNormal,
		Body:        "Plan approved · child tasks created:\n" + strings.Join(lines, "\n"),
	}
	_ = s.DB.Create(&sys).Error
	s.Hub.Broadcast(runID, websocket.Event{Type: "new_message", Data: map[string]interface{}{"message": sys}})
	s.Hub.Broadcast(runID, websocket.Event{
		Type: "plan_approved",
		Data: map[string]interface{}{"plan": plan, "children": created},
	})

	// Wake agents whose blockers are clear
	for _, t := range created {
		if t.Status == "todo" && t.AssigneeAgentID != "" {
			_, _, _ = s.WakeAgentByRole(runID, plan.ProjectID, t.RoleID, "plan_child_assigned",
				fmt.Sprintf("You were assigned %s: %s\nAcceptance: %v\nProduce implementation notes and a PR-shaped handoff when done.", t.Key, t.Title, t.Acceptance))
		}
	}
	return &plan, created, nil
}

func (s *AgentService) RejectPlan(planID, runID, comment string) (*models.TaskPlan, error) {
	var plan models.TaskPlan
	if err := s.DB.First(&plan, "id = ?", planID).Error; err != nil {
		return nil, fmt.Errorf("plan not found")
	}
	plan.Status = "rejected"
	_ = s.DB.Save(&plan).Error
	if plan.TicketID != nil {
		var ticket models.Ticket
		if err := s.DB.First(&ticket, "id = ?", *plan.TicketID).Error; err == nil && ticket.Status == models.TicketStatusPending {
			now := time.Now()
			ticket.Status = models.TicketStatusRejected
			ticket.Comment = comment
			ticket.ResolvedAt = &now
			_ = s.DB.Save(&ticket).Error
			s.Hub.Broadcast(runID, websocket.Event{Type: "ticket_resolved", Data: ticket})
		}
	}
	return &plan, nil
}

// WakeNextAfterTicketResolution finds the next playbook step role and wakes that agent.
func (s *AgentService) WakeNextAfterTicketResolution(ticket *models.Ticket) {
	if ticket == nil {
		return
	}
	if ticket.Status != models.TicketStatusApproved && ticket.Status != models.TicketStatusDone && ticket.Status != models.TicketStatusAcked {
		return
	}
	// Plan tickets: handled by ApprovePlan explicitly
	if strings.HasPrefix(ticket.PlaybookInstanceID, "plan:") {
		planID := strings.TrimPrefix(ticket.PlaybookInstanceID, "plan:")
		if ticket.Status == models.TicketStatusApproved {
			_, _, _ = s.ApprovePlan(planID, ticket.RunID)
		} else if ticket.Status == models.TicketStatusRejected {
			_, _ = s.RejectPlan(planID, ticket.RunID, ticket.Comment)
		}
		return
	}

	var instance models.PlaybookInstance
	if err := s.DB.First(&instance, "id = ?", ticket.PlaybookInstanceID).Error; err != nil {
		// Still wake the ticket's own role agent if seated (action kickoff)
		s.wakeRoleIfAgent(ticket.RunID, ticket.RoleID, "ticket_resolved", ticket)
		return
	}

	// Resolve project from any agent on this run
	projectID := "project-default"
	var seat models.RosterEntry
	if err := s.DB.Where("run_id = ? AND agent_id IS NOT NULL", ticket.RunID).First(&seat).Error; err == nil {
		var ag models.AgentInstance
		if err := s.DB.First(&ag, "id = ?", *seat.AgentID).Error; err == nil {
			projectID = ag.ProjectID
		}
	}

	nextRole := nextRoleAfter(instance.PlaybookID, ticket.RoleID)
	if nextRole != "" {
		input := fmt.Sprintf("Playbook %s: prior ticket for %s resolved as %s. Comment: %s\nContinue the next step for role %s.",
			instance.PlaybookID, ticket.RoleID, ticket.Status, ticket.Comment, nextRole)
		_, _, _ = s.WakeAgentByRole(ticket.RunID, projectID, nextRole, "playbook_ticket_resolved", input)
	} else {
		s.wakeRoleIfAgent(ticket.RunID, ticket.RoleID, "ticket_resolved", ticket)
	}
}

func (s *AgentService) wakeRoleIfAgent(runID, roleID, reason string, ticket *models.Ticket) {
	var seat models.RosterEntry
	if err := s.DB.Where("run_id = ? AND role_id = ? AND agent_id IS NOT NULL AND present = true", runID, roleID).First(&seat).Error; err != nil {
		return
	}
	var agent models.AgentInstance
	if err := s.DB.First(&agent, "id = ?", *seat.AgentID).Error; err != nil {
		return
	}
	input := fmt.Sprintf("Your ticket was resolved (%s). Comment: %s", ticket.Status, ticket.Comment)
	_, _, _ = s.Invoke(&agent, InvokeAgentRequest{RunID: runID, WakeReason: reason, Input: input})
}

func nextRoleAfter(playbookID, roleID string) string {
	// Lightweight sequencing for common SDLC playbooks
	chains := map[string][]string{
		"P01": {"ux_designer", "ui_designer", "senior_fe", "qa_lead", "project_manager"},
		"P02": {"senior_be", "senior_fe", "qa_lead", "project_manager"},
		"P03": {"senior_fe", "senior_be", "qa_lead", "project_manager"},
	}
	chain, ok := chains[playbookID]
	if !ok {
		// generic FE→BE→QA→PM
		chain = []string{"project_manager", "senior_fe", "senior_be", "qa_lead", "project_manager"}
	}
	for i, r := range chain {
		if r == roleID && i+1 < len(chain) {
			return chain[i+1]
		}
	}
	return ""
}

func (s *AgentService) InstallProductEngPod(projectID, seatRunID string) ([]models.AgentInstance, error) {
	if projectID == "" {
		projectID = "project-default"
	}
	if seatRunID == "" {
		seatRunID = "run-default"
	}
	var pmID string
	created := []models.AgentInstance{}
	for _, slot := range ProductEngPodRoles {
		var existing models.AgentInstance
		err := s.DB.Where("project_id = ? AND role_id = ? AND status IN ?", projectID, slot.RoleID,
			[]models.AgentStatus{models.AgentStatusActive, models.AgentStatusPaused}).First(&existing).Error
		if err == nil {
			if slot.RoleID == "project_manager" {
				pmID = existing.ID
			}
			_, _ = s.SeatAgentOnRun(seatRunID, &existing)
			created = append(created, existing)
			continue
		}
		var reportsTo *string
		if slot.ReportsToPM && pmID != "" {
			reportsTo = &pmID
		}
		soft := int64(50000)
		hard := int64(100000)
		agent := models.AgentInstance{
			ID:               uuid.New().String(),
			ProjectID:        projectID,
			Name:             slot.DefaultName,
			RoleID:           slot.RoleID,
			Status:           models.AgentStatusActive,
			Instructions:     defaultInstructionsForRole(slot.RoleID),
			ReportsToAgentID: reportsTo,
			SoftTokenBudget:  &soft,
			TokenBudget:      &hard,
		}
		if err := s.DB.Create(&agent).Error; err != nil {
			return created, err
		}
		_ = s.AttachDefaultSkills(&agent)
		for _, slug := range slot.SkillSlugs {
			var skill models.Skill
			if err := s.DB.Where("slug = ?", slug).First(&skill).Error; err != nil {
				continue
			}
			var link models.AgentSkill
			if err := s.DB.Where("agent_id = ? AND skill_id = ?", agent.ID, skill.ID).First(&link).Error; err == gorm.ErrRecordNotFound {
				_ = s.DB.Create(&models.AgentSkill{ID: uuid.New().String(), AgentID: agent.ID, SkillID: skill.ID}).Error
			}
		}
		_, _ = s.SeatAgentOnRun(seatRunID, &agent)
		if slot.RoleID == "project_manager" {
			pmID = agent.ID
		}
		created = append(created, agent)
	}
	// Fix reports_to for workers hired before PM id known
	if pmID != "" {
		_ = s.DB.Model(&models.AgentInstance{}).
			Where("project_id = ? AND role_id IN ? AND (reports_to_agent_id IS NULL OR reports_to_agent_id = '')", projectID, []string{"senior_fe", "senior_be", "qa_lead"}).
			Update("reports_to_agent_id", pmID).Error
	}
	s.Hub.Broadcast(seatRunID, websocket.Event{Type: "roster_updated", Data: nil})
	rolesJSON, _ := json.Marshal([]string{"system"})
	sys := models.Message{
		ID:          uuid.New().String(),
		RunID:       seatRunID,
		AuthorID:    "system",
		AuthorName:  "System",
		AuthorRoles: string(rolesJSON),
		Mode:        models.ChatModeNormal,
		Body:        fmt.Sprintf("Installed team template · Product Eng Pod · %d agents seated", len(created)),
	}
	_ = s.DB.Create(&sys).Error
	s.Hub.Broadcast(seatRunID, websocket.Event{Type: "new_message", Data: map[string]interface{}{"message": sys}})
	return created, nil
}

func defaultInstructionsForRole(roleID string) string {
	switch roleID {
	case "project_manager":
		return "You are the AI Project Manager. Plan work, triage the board, and never create FE/BE/QA children until a human approves the plan."
	case "senior_fe":
		return "You are the Senior Frontend engineer. Implement UI from AC, draft PR title/body into handoffs, pass to QA when done."
	case "senior_be":
		return "You are the Senior Backend engineer. Design APIs/schemas, draft PR-shaped handoffs, coordinate contracts with FE."
	case "qa_lead":
		return "You are the QA Lead. Review handoffs against AC, file bugs, and gate ship with a clear pass/fail."
	default:
		return "You are a CGen AI teammate. Follow playbooks and emit structured handoffs."
	}
}

func (s *AgentService) AgentOpsSummary(projectID string) map[string]interface{} {
	if projectID == "" {
		projectID = "project-default"
	}
	var agents []models.AgentInstance
	_ = s.DB.Where("project_id = ? AND status != ?", projectID, models.AgentStatusTerminated).Find(&agents).Error
	counts := map[string]int{"active": 0, "paused": 0, "running": 0, "error": 0, "budget_soft": 0, "budget_hard": 0}
	var tokenUsed int64
	for _, a := range agents {
		switch a.Status {
		case models.AgentStatusActive:
			counts["active"]++
		case models.AgentStatusPaused:
			counts["paused"]++
		}
		if a.BudgetPaused {
			counts["budget_hard"]++
		} else if a.SoftTokenBudget != nil && a.TokensUsed >= *a.SoftTokenBudget {
			counts["budget_soft"]++
		}
		tokenUsed += a.TokensUsed
	}
	var running int64
	_ = s.DB.Model(&models.AgentRun{}).Where("status = ?", models.AgentRunStatusRunning).Count(&running).Error
	counts["running"] = int(running)
	var failedRecent int64
	since := time.Now().Add(-24 * time.Hour)
	_ = s.DB.Model(&models.AgentRun{}).Where("status = ? AND created_at >= ?", models.AgentRunStatusFailed, since).Count(&failedRecent).Error
	counts["error"] = int(failedRecent)

	var pendingTickets int64
	_ = s.DB.Model(&models.Ticket{}).Where("status = ?", models.TicketStatusPending).Count(&pendingTickets).Error

	var pac models.ProjectAgentConfig
	_ = s.DB.Where("project_id = ?", projectID).First(&pac).Error

	return map[string]interface{}{
		"project_id":       projectID,
		"counts":           counts,
		"agents":           agents,
		"tokens_used":      tokenUsed,
		"pending_approvals": pendingTickets,
		"project_config":   pac,
	}
}

func (s *AgentService) GetOrCreateProjectAgentConfig(projectID string) (*models.ProjectAgentConfig, error) {
	if projectID == "" {
		projectID = "project-default"
	}
	var pac models.ProjectAgentConfig
	err := s.DB.Where("project_id = ?", projectID).First(&pac).Error
	if err == gorm.ErrRecordNotFound {
		soft := int64(200000)
		hard := int64(500000)
		pac = models.ProjectAgentConfig{
			ID:              uuid.New().String(),
			ProjectID:       projectID,
			SoftTokenBudget: &soft,
			HardTokenBudget: &hard,
		}
		if err := s.DB.Create(&pac).Error; err != nil {
			return nil, err
		}
		return &pac, nil
	}
	if err != nil {
		return nil, err
	}
	return &pac, nil
}

func (s *AgentService) UpsertProjectAgentConfig(projectID string, repoURL, primaryCwd string, soft, hard *int64, envJSON string) (*models.ProjectAgentConfig, error) {
	pac, err := s.GetOrCreateProjectAgentConfig(projectID)
	if err != nil {
		return nil, err
	}
	updates := map[string]interface{}{}
	if repoURL != "" {
		updates["repo_url"] = repoURL
	}
	if primaryCwd != "" {
		updates["primary_cwd"] = primaryCwd
	}
	if envJSON != "" {
		updates["env_json"] = envJSON
	}
	if soft != nil {
		updates["soft_token_budget"] = *soft
	}
	if hard != nil {
		updates["hard_token_budget"] = *hard
	}
	if len(updates) > 0 {
		if err := s.DB.Model(pac).Updates(updates).Error; err != nil {
			return nil, err
		}
	}
	return s.GetOrCreateProjectAgentConfig(projectID)
}

func (s *AgentService) TransitionTaskStatus(taskID, projectID, fromStatus, toStatus, comment string) (*models.ExecutionPolicyRecord, string, error) {
	var pol models.ExecutionPolicyRecord
	err := s.DB.Where("task_id = ?", taskID).First(&pol).Error
	if err == gorm.ErrRecordNotFound {
		// No policy — allow transition
		return nil, toStatus, nil
	}
	if err != nil {
		return nil, "", err
	}
	if pol.CommentRequired && strings.TrimSpace(comment) == "" && toStatus == "done" {
		return &pol, fromStatus, fmt.Errorf("comment required before marking done")
	}
	if toStatus == "done" && (pol.Status == "idle" || pol.Status == "cleared" || pol.Status == "") {
		// Intercept → in_review (QA stage)
		pol.Status = "in_review"
		pol.CurrentStage = 0
		_ = s.DB.Save(&pol).Error
		return &pol, "in_review", nil
	}
	if toStatus == "done" && pol.Status == "in_review" {
		// Review approved by QA path → awaiting human approval
		pol.Status = "awaiting_approval"
		pol.CurrentStage = 1
		_ = s.DB.Save(&pol).Error
		return &pol, "in_review", nil
	}
	if toStatus == "done" && pol.Status == "awaiting_approval" {
		pol.Status = "cleared"
		_ = s.DB.Save(&pol).Error
		return &pol, "done", nil
	}
	if toStatus == "in_progress" && pol.Status == "in_review" {
		// Changes requested
		pol.ReviewRoundsUsed++
		if pol.ReviewRoundsUsed >= pol.MaxReviewRounds {
			pol.Status = "escalated"
			_ = s.DB.Save(&pol).Error
			return &pol, "blocked", fmt.Errorf("maxReviewRounds (%d) exceeded — escalated to human", pol.MaxReviewRounds)
		}
		pol.Status = "idle"
		_ = s.DB.Save(&pol).Error
		return &pol, "in_progress", nil
	}
	return &pol, toStatus, nil
}

func (s *AgentService) SeedRoutines(projectID string) error {
	if projectID == "" {
		projectID = "project-default"
	}
	routines := []models.Routine{
		{
			Key:         "daily-triage",
			Name:        "Daily triage",
			Description: "Weekday board hygiene via issue-triage skill",
			CronExpr:    "0 9 * * 1-5",
			RoleID:      "project_manager",
			SkillSlug:   "issue-triage",
			PromptBody:  "Routine · Daily triage. Review open sprint work. Emit a triage summary table with one verdict per item.",
			Enabled:     true,
			ProjectID:   projectID,
		},
		{
			Key:         "sprint-planning-kickoff",
			Name:        "Sprint planning kickoff",
			Description: "Draft a plan for human approval at sprint start",
			CronExpr:    "0 10 * * 1",
			RoleID:      "project_manager",
			SkillSlug:   "task-planning",
			PromptBody:  "Routine · Sprint planning kickoff. Draft a structured plan for the active sprint goal. Do not create children until approved.",
			Enabled:     true,
			ProjectID:   projectID,
		},
	}
	for _, r := range routines {
		var existing models.Routine
		if err := s.DB.Where("key = ?", r.Key).First(&existing).Error; err == gorm.ErrRecordNotFound {
			r.ID = uuid.New().String()
			if err := s.DB.Create(&r).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *AgentService) RunRoutine(routineKey, runID string) (*models.RoutineRun, error) {
	if runID == "" {
		runID = "run-default"
	}
	var r models.Routine
	if err := s.DB.Where("key = ?", routineKey).First(&r).Error; err != nil {
		return nil, fmt.Errorf("routine not found")
	}
	if !r.Enabled {
		return nil, fmt.Errorf("routine disabled")
	}
	rr := models.RoutineRun{
		ID:        uuid.New().String(),
		RoutineID: r.ID,
		RunID:     runID,
		Status:    "running",
	}
	_ = s.DB.Create(&rr).Error

	rolesJSON, _ := json.Marshal([]string{"system"})
	banner := models.Message{
		ID:          uuid.New().String(),
		RunID:       runID,
		AuthorID:    "system",
		AuthorName:  "System",
		AuthorRoles: string(rolesJSON),
		Mode:        models.ChatModeNormal,
		Body:        fmt.Sprintf("Routine · %s · fired", r.Name),
	}
	_ = s.DB.Create(&banner).Error
	s.Hub.Broadcast(runID, websocket.Event{Type: "new_message", Data: map[string]interface{}{"message": banner}})

	ar, _, err := s.WakeAgentByRole(runID, r.ProjectID, r.RoleID, "routine:"+r.Key, r.PromptBody)
	now := time.Now()
	_ = s.DB.Model(&r).Update("last_run_at", now).Error
	if err != nil {
		rr.Status = "failed"
		rr.Detail = err.Error()
		_ = s.DB.Save(&rr).Error
		return &rr, err
	}
	if ar != nil {
		rr.AgentRunID = &ar.ID
	}
	rr.Status = "succeeded"
	_ = s.DB.Save(&rr).Error
	return &rr, nil
}

// TryParseHandoffFromContent extracts a cgen-handoff block from agent output and persists it
// without posting a duplicate chat message (the agent message already contains the fence).
func (s *AgentService) TryParseHandoffFromContent(agent *models.AgentInstance, runID, content string, messageID string) {
	start := strings.Index(content, "```cgen-handoff")
	if start < 0 {
		return
	}
	rest := content[start+len("```cgen-handoff"):]
	rest = strings.TrimPrefix(rest, "\n")
	end := strings.Index(rest, "```")
	if end < 0 {
		return
	}
	raw := strings.TrimSpace(rest[:end])
	var p HandoffPayload
	if err := json.Unmarshal([]byte(raw), &p); err != nil {
		return
	}
	if p.ContractVersion == 0 {
		p.ContractVersion = 1
	}
	if p.FromRole == "" {
		p.FromRole = agent.RoleID
	}
	if len(p.ToRoles) == 0 {
		return
	}
	toJSON, _ := json.Marshal(p.ToRoles)
	acJSON, _ := json.Marshal(p.AcceptanceCriteria)
	oqJSON, _ := json.Marshal(p.OpenQuestions)
	artJSON, _ := json.Marshal(p.Artifacts)
	aid := agent.ID
	mid := messageID
	h := models.Handoff{
		ID:                uuid.New().String(),
		RunID:             runID,
		ProjectID:         agent.ProjectID,
		FromAgentID:       &aid,
		FromRole:          p.FromRole,
		ToRolesJSON:       string(toJSON),
		TaskID:            p.TaskID,
		Summary:           p.Summary,
		AcceptanceJSON:    string(acJSON),
		OpenQuestionsJSON: string(oqJSON),
		ArtifactsJSON:     string(artJSON),
		PlaybookHint:      p.PlaybookHint,
		PRTitle:           p.PRTitle,
		PRBody:            p.PRBody,
		VerificationSteps: p.VerificationSteps,
		PRURL:             p.PRURL,
		MessageID:         &mid,
		Status:            "open",
		ContractVersion:   p.ContractVersion,
	}
	if h.Summary == "" {
		h.Summary = "(handoff from agent run)"
	}
	if err := s.DB.Create(&h).Error; err != nil {
		return
	}
	s.Hub.Broadcast(runID, websocket.Event{Type: "handoff_created", Data: h})
}

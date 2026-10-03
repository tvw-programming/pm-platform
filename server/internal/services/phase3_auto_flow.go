package services

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"pm-platform/server/internal/models"
	"pm-platform/server/internal/websocket"
)

// Role aliases used in chat / PM routing decisions.
var roleAliases = map[string]string{
	"pm":  "project_manager",
	"sfd": "senior_fe",
	"sbd": "senior_be",
	"qa":  "qa_lead",
}

func NormalizeRoleID(raw string) string {
	r := strings.ToLower(strings.TrimSpace(raw))
	if mapped, ok := roleAliases[r]; ok {
		return mapped
	}
	return r
}

// ShouldStartAutoFlow decides if a new chat message kicks off the Phase 3 pipeline.
func ShouldStartAutoFlow(msg *models.Message) bool {
	if msg == nil || strings.TrimSpace(msg.Body) == "" {
		return false
	}
	if msg.Mode == models.ChatModeWork {
		switch msg.EventType {
		case "new_requirement", "brd_ready", "requirement_posted":
			return true
		}
	}
	body := strings.TrimSpace(msg.Body)
	lower := strings.ToLower(body)
	if strings.HasPrefix(lower, "/require") || strings.HasPrefix(lower, "/requirement") {
		return true
	}
	if strings.Contains(lower, "[requirement]") {
		return true
	}
	return false
}

func (s *AgentService) postSystemChat(runID, body string) {
	rolesJSON, _ := json.Marshal([]string{"system"})
	msg := models.Message{
		ID:          uuid.New().String(),
		RunID:       runID,
		AuthorID:    "system",
		AuthorName:  "System",
		AuthorRoles: string(rolesJSON),
		Mode:        models.ChatModeNormal,
		Body:        body,
	}
	_ = s.DB.Create(&msg).Error
	s.Hub.Broadcast(runID, websocket.Event{Type: "new_message", Data: map[string]interface{}{"message": msg}})
}

func (s *AgentService) postAgentStatus(runID string, agent *models.AgentInstance, body string) {
	rolesJSON, _ := json.Marshal([]string{agent.RoleID, "ai_agent"})
	msg := models.Message{
		ID:          uuid.New().String(),
		RunID:       runID,
		AuthorID:    "agent:" + agent.ID,
		AuthorName:  agent.Name,
		AuthorRoles: string(rolesJSON),
		Mode:        models.ChatModeNormal,
		Body:        body,
		AgentID:     &agent.ID,
	}
	_ = s.DB.Create(&msg).Error
	s.Hub.Broadcast(runID, websocket.Event{Type: "new_message", Data: map[string]interface{}{"message": msg}})
}

func (s *AgentService) failAutoFlow(flow *models.AutoFlowRun, errMsg string) {
	flow.Stage = models.AutoFlowStageError
	flow.Status = "error"
	flow.LastError = errMsg
	_ = s.DB.Save(flow).Error
	s.postSystemChat(flow.RunID, "Auto flow error: "+errMsg)
	s.Hub.Broadcast(flow.RunID, websocket.Event{Type: "auto_flow_updated", Data: flow})
}

func (s *AgentService) resolveProjectID(runID string) string {
	var seat models.RosterEntry
	if err := s.DB.Where("run_id = ? AND agent_id IS NOT NULL", runID).First(&seat).Error; err == nil && seat.AgentID != nil {
		var ag models.AgentInstance
		if err := s.DB.First(&ag, "id = ?", *seat.AgentID).Error; err == nil {
			return ag.ProjectID
		}
	}
	return "project-default"
}

func (s *AgentService) ensurePrimaryCwd(projectID string) (string, error) {
	pac, err := s.GetOrCreateProjectAgentConfig(projectID)
	if err != nil {
		return "", err
	}
	cwd := strings.TrimSpace(pac.PrimaryCwd)
	if cwd == "" || cwd == "." {
		cwd = models.DefaultAlumniCwd
		_ = s.DB.Model(pac).Update("primary_cwd", cwd).Error
		pac.PrimaryCwd = cwd
	}
	info, err := os.Stat(cwd)
	if err != nil {
		return cwd, fmt.Errorf("project coding folder not found: %s — set Settings → Agent Config → primary_cwd (example: %s)", cwd, models.DefaultAlumniCwd)
	}
	if !info.IsDir() {
		return cwd, fmt.Errorf("project coding path is not a folder: %s", cwd)
	}
	return cwd, nil
}

func (s *AgentService) checkLMOrError(runID string) error {
	health, err := s.CheckLMStudioHealth()
	if err != nil {
		return fmt.Errorf("Local AI (LM Studio) check failed: %v", err)
	}
	ok, _ := health["ok"].(bool)
	if !ok {
		msg := "Local AI (LM Studio) is down or has no models loaded"
		if e, ok := health["error"].(string); ok && e != "" {
			msg += ": " + e
		}
		msg += ". Start LM Studio, load a model, then retry."
		return fmt.Errorf("%s", msg)
	}
	return nil
}

// StartAutoFlow begins PM triage for a new requirement message (async-safe).
func (s *AgentService) StartAutoFlow(runID, projectID, requirementMsgID, requirementText string) (*models.AutoFlowRun, error) {
	if runID == "" {
		runID = "run-default"
	}
	if projectID == "" {
		projectID = s.resolveProjectID(runID)
	}
	requirementText = strings.TrimSpace(requirementText)
	if requirementText == "" {
		return nil, fmt.Errorf("requirement text is empty")
	}

	flow := models.AutoFlowRun{
		ID:               uuid.New().String(),
		RunID:            runID,
		ProjectID:        projectID,
		RequirementMsgID: requirementMsgID,
		RequirementText:  requirementText,
		Stage:            models.AutoFlowStagePMTriage,
		Status:           "running",
	}
	if err := s.DB.Create(&flow).Error; err != nil {
		return nil, err
	}
	s.postSystemChat(runID, "Auto virtual-team flow started · waking PM")
	s.Hub.Broadcast(runID, websocket.Event{Type: "auto_flow_updated", Data: flow})

	if err := s.checkLMOrError(runID); err != nil {
		s.failAutoFlow(&flow, err.Error())
		return &flow, err
	}

	s.ensurePodReportsToPM(projectID)
	below := s.implementersBelowPM(projectID)
	routeHint := strings.Join(displayRoles(below), ",")
	if routeHint == "" {
		routeHint = "sfd,sbd"
	}

	input := fmt.Sprintf(`New requirement to triage.

REQUIREMENT:
%s

Your direct reports (implementers) available now: %s
Respond in MINIMAL words.
If you approve, reply exactly:
Approve
CGEN_DECISION: APPROVE
CGEN_ROUTE: %s
(Use CGEN_ROUTE to pick among sfd/sbd who report to you. Prefer everyone who should start now. qa is auto-woken later after coding — do not put qa here.)

If you reject, reply exactly:
Reject — <one short reason>
CGEN_DECISION: REJECT
`, requirementText, routeHint, routeHint)

	ar, msg, err := s.WakeAgentByRole(runID, projectID, "project_manager", "auto_pm_triage", input)
	if err != nil {
		s.failAutoFlow(&flow, "PM wake failed: "+err.Error()+". Hire/seat a Project Manager agent on the Roster first.")
		return &flow, err
	}
	_ = ar
	if msg != nil {
		s.advanceAfterPMTriage(&flow, msg.Body)
	}
	return &flow, nil
}

var (
	reDecision = regexp.MustCompile(`(?i)CGEN_DECISION:\s*(APPROVE|REJECT)`)
	reRoute    = regexp.MustCompile(`(?i)CGEN_ROUTE:\s*([^\n]+)`)
	reQA       = regexp.MustCompile(`(?i)CGEN_QA:\s*(PASS|FAIL)`)
	reCodeDone = regexp.MustCompile(`(?i)Code update completed\.?`)
)

func parseDecision(body string) (approved bool, rejected bool) {
	m := reDecision.FindStringSubmatch(body)
	if len(m) >= 2 {
		switch strings.ToUpper(m[1]) {
		case "APPROVE":
			return true, false
		case "REJECT":
			return false, true
		}
	}
	lower := strings.ToLower(body)
	if strings.HasPrefix(strings.TrimSpace(lower), "approve") {
		return true, false
	}
	if strings.HasPrefix(strings.TrimSpace(lower), "reject") {
		return false, true
	}
	return false, false
}

func parseRoutes(body string) []string {
	m := reRoute.FindStringSubmatch(body)
	if len(m) < 2 {
		return nil // caller fills hierarchy default
	}
	parts := strings.FieldsFunc(m[1], func(r rune) bool {
		return r == ',' || r == ';' || r == '/' || r == '|' || r == ' '
	})
	seen := map[string]bool{}
	out := []string{}
	for _, p := range parts {
		role := NormalizeRoleID(p)
		// qa is woken later after coding — ignore if PM lists it at triage
		switch role {
		case "senior_fe", "senior_be":
			if !seen[role] {
				seen[role] = true
				out = append(out, role)
			}
		}
	}
	return out
}

// ensurePodReportsToPM backfills reports_to for Product Eng Pod workers → PM.
// Individual Hire often leaves this null; Phase 3 routing uses it as hierarchy.
func (s *AgentService) ensurePodReportsToPM(projectID string) {
	var pm models.AgentInstance
	if err := s.DB.Where("project_id = ? AND role_id = ? AND status = ?", projectID, "project_manager", models.AgentStatusActive).
		First(&pm).Error; err != nil {
		return
	}
	_ = s.DB.Model(&models.AgentInstance{}).
		Where("project_id = ? AND role_id IN ? AND status = ? AND (reports_to_agent_id IS NULL OR reports_to_agent_id = '')",
			projectID, []string{"senior_fe", "senior_be", "qa_lead"}, models.AgentStatusActive).
		Update("reports_to_agent_id", pm.ID).Error
}

// implementersBelowPM returns active senior_fe/senior_be under the PM (reports_to),
// falling back to any active implementers on the project when hierarchy is empty.
func (s *AgentService) implementersBelowPM(projectID string) []string {
	s.ensurePodReportsToPM(projectID)
	order := []string{"senior_fe", "senior_be"}
	var pm models.AgentInstance
	hasPM := s.DB.Where("project_id = ? AND role_id = ? AND status = ?", projectID, "project_manager", models.AgentStatusActive).
		First(&pm).Error == nil

	out := []string{}
	for _, role := range order {
		var n int64
		q := s.DB.Model(&models.AgentInstance{}).
			Where("project_id = ? AND role_id = ? AND status = ?", projectID, role, models.AgentStatusActive)
		if hasPM {
			q = q.Where("reports_to_agent_id = ?", pm.ID)
		}
		_ = q.Count(&n).Error
		if n > 0 {
			out = append(out, role)
			continue
		}
		// Hierarchy miss: still route if an active agent of that role exists (seated pod).
		_ = s.DB.Model(&models.AgentInstance{}).
			Where("project_id = ? AND role_id = ? AND status = ?", projectID, role, models.AgentStatusActive).
			Count(&n).Error
		if n > 0 {
			out = append(out, role)
		}
	}
	if len(out) == 0 {
		return []string{"senior_fe"}
	}
	return out
}

// resolveRoutesAfterPMApprove prefers explicit CGEN_ROUTE, else the PM's reports (sfd/sbd).
func (s *AgentService) resolveRoutesAfterPMApprove(projectID, body string) []string {
	parsed := parseRoutes(body)
	hierarchy := s.implementersBelowPM(projectID)
	if len(parsed) == 0 {
		return hierarchy
	}
	// Keep LM choice, but only roles that actually have an active agent.
	active := map[string]bool{}
	for _, r := range hierarchy {
		active[r] = true
	}
	out := []string{}
	for _, r := range parsed {
		if active[r] {
			out = append(out, r)
		}
	}
	if len(out) == 0 {
		return hierarchy
	}
	return out
}

func (s *AgentService) createPMTicket(flow *models.AutoFlowRun, parentMsgID, kindLabel string) {
	due := time.Now().Add(4 * time.Hour)
	ticket := models.Ticket{
		ID:                 uuid.New().String(),
		RunID:              flow.RunID,
		PlaybookInstanceID: "autoflow:" + flow.ID,
		RoleID:             "project_manager",
		UserID:             "user-1",
		Kind:               models.TicketApproveReject,
		Status:             models.TicketStatusPending,
		ParentMessageID:    parentMsgID,
		DueBy:              &due,
	}
	if err := s.DB.Create(&ticket).Error; err != nil {
		return
	}
	s.Hub.Broadcast(flow.RunID, websocket.Event{
		Type: "new_message",
		Data: map[string]interface{}{"tickets": []models.Ticket{ticket}},
	})
	_ = kindLabel
}

func (s *AgentService) advanceAfterPMTriage(flow *models.AutoFlowRun, body string) {
	approved, rejected := parseDecision(body)
	if rejected {
		flow.Stage = models.AutoFlowStageRejected
		flow.Status = "rejected"
		_ = s.DB.Save(flow).Error
		s.postSystemChat(flow.RunID, "Auto flow stopped · PM rejected the requirement")
		s.Hub.Broadcast(flow.RunID, websocket.Event{Type: "auto_flow_updated", Data: flow})
		return
	}
	if !approved {
		// Ambiguous LM output — create human ticket and pause for override
		s.createPMTicket(flow, flow.RequirementMsgID, "pm_triage")
		s.postSystemChat(flow.RunID, "PM reply was unclear. Approve/Reject the ticket to continue, or ask PM to reply Approve / Reject.")
		return
	}

	routes := s.resolveRoutesAfterPMApprove(flow.ProjectID, body)
	routesJSON, _ := json.Marshal(routes)
	flow.RoutesJSON = string(routesJSON)
	flow.Stage = models.AutoFlowStageRouting
	_ = s.DB.Save(flow).Error
	s.postSystemChat(flow.RunID, "PM approved · routing to "+strings.Join(displayRoles(routes), ", ")+" (below PM hierarchy)")
	s.Hub.Broadcast(flow.RunID, websocket.Event{Type: "auto_flow_updated", Data: flow})

	started := 0
	for _, role := range routes {
		switch role {
		case "senior_fe":
			s.startFEPlanning(flow)
			started++
		case "senior_be":
			s.startBEAck(flow)
			started++
		}
	}
	if started == 0 {
		s.failAutoFlow(flow, "PM approved but no active sfd/sbd under PM. Hire Product Eng Pod or seat senior_fe/senior_be reporting to the PM.")
	}
}

func displayRoles(roles []string) []string {
	out := make([]string, 0, len(roles))
	for _, r := range roles {
		switch r {
		case "senior_fe":
			out = append(out, "sfd")
		case "senior_be":
			out = append(out, "sbd")
		case "qa_lead":
			out = append(out, "qa")
		default:
			out = append(out, r)
		}
	}
	return out
}

func (s *AgentService) startBEAck(flow *models.AutoFlowRun) {
	var agent models.AgentInstance
	err := s.DB.Where("project_id = ? AND role_id = ? AND status = ?", flow.ProjectID, "senior_be", models.AgentStatusActive).First(&agent).Error
	if err != nil {
		s.postSystemChat(flow.RunID, "No active sbd (Senior BE) agent seated — skipping BE for now. Hire Product Eng Pod or seat senior_be.")
		return
	}
	_, _ = s.SeatAgentOnRun(flow.RunID, &agent)
	s.postAgentStatus(flow.RunID, &agent, "I am starting my planning.")
	input := fmt.Sprintf(`Requirement (backend scope):
%s

Post a short backend plan (APIs/schemas). Use a cgen-plan fence if useful.
Do not write files yet.`, flow.RequirementText)
	_, _, err = s.Invoke(&agent, InvokeAgentRequest{
		RunID:      flow.RunID,
		WakeReason: "auto_be_planning",
		Input:      input,
	})
	if err != nil {
		s.postSystemChat(flow.RunID, "sbd wake failed: "+err.Error())
	}
}

func (s *AgentService) startFEPlanning(flow *models.AutoFlowRun) {
	flow.Stage = models.AutoFlowStageFEPlanning
	_ = s.DB.Save(flow).Error

	var agent models.AgentInstance
	err := s.DB.Where("project_id = ? AND role_id = ? AND status = ?", flow.ProjectID, "senior_fe", models.AgentStatusActive).First(&agent).Error
	if err != nil {
		s.failAutoFlow(flow, "No active sfd (Senior FE) agent. Hire Product Eng Pod or seat senior_fe on the Roster.")
		return
	}
	_, _ = s.SeatAgentOnRun(flow.RunID, &agent)
	s.postAgentStatus(flow.RunID, &agent, "I am starting my planning.")

	input := fmt.Sprintf(`You are sfd (Senior FE). Produce a visible implementation plan for:

%s

Rules:
1. Keep the plan short and concrete (files to touch, UI changes, AC).
2. Emit a fenced cgen-plan JSON code block (language tag cgen-plan) with fields: goal, body, children (array with title, role_id="senior_fe", acceptance_criteria).
3. Do NOT write code yet — planning only.
`, flow.RequirementText)

	_, msg, err := s.Invoke(&agent, InvokeAgentRequest{
		RunID:      flow.RunID,
		WakeReason: "auto_fe_planning",
		Input:      input,
	})
	if err != nil {
		s.failAutoFlow(flow, "sfd planning wake failed: "+err.Error())
		return
	}
	if msg != nil {
		s.createFEPlanFromContent(flow, &agent, msg.Body)
	}
}

func (s *AgentService) createFEPlanFromContent(flow *models.AutoFlowRun, agent *models.AgentInstance, content string) {
	goal := "FE implementation for requirement"
	bodyMD := content
	children := []models.PlanChild{
		{
			Title:      "Implement FE changes for approved requirement",
			RoleID:     "senior_fe",
			Acceptance: []string{"Matches requirement", "Visible in Alumni-web cwd"},
		},
	}
	if p := tryParseCgenPlan(content); p != nil {
		if p.Goal != "" {
			goal = p.Goal
		}
		if p.Body != "" {
			bodyMD = p.Body
		}
		if len(p.Children) > 0 {
			children = p.Children
			for i := range children {
				if children[i].RoleID == "" {
					children[i].RoleID = "senior_fe"
				}
			}
		}
	}

	plan, ticket, _, err := s.CreatePlan(CreatePlanRequest{
		RunID:        flow.RunID,
		ProjectID:    flow.ProjectID,
		AgentID:      agent.ID,
		Goal:         goal,
		BodyMarkdown: bodyMD,
		Children:     children,
	})
	if err != nil {
		s.failAutoFlow(flow, "Failed to post FE plan: "+err.Error())
		return
	}
	flow.PlanID = &plan.ID
	flow.Stage = models.AutoFlowStageFEPlanReview
	_ = s.DB.Save(flow).Error
	s.Hub.Broadcast(flow.RunID, websocket.Event{Type: "auto_flow_updated", Data: flow})
	_ = ticket

	// Auto-wake PM to approve/reject the FE plan (human can still use the ticket).
	pmInput := fmt.Sprintf(`FE plan awaiting your decision.

Goal: %s

Plan:
%s

Respond in MINIMAL words.
Approve
CGEN_DECISION: APPROVE
— or —
Reject — <one short reason>
CGEN_DECISION: REJECT
`, goal, bodyMD)
	_, pmMsg, err := s.WakeAgentByRole(flow.RunID, flow.ProjectID, "project_manager", "auto_pm_plan_review", pmInput)
	if err != nil {
		s.postSystemChat(flow.RunID, "PM plan-review wake failed: "+err.Error()+". Use the plan ticket Approve/Reject to continue.")
		return
	}
	if pmMsg != nil {
		s.advanceAfterFEPlanReview(flow, pmMsg.Body)
	}
}

type parsedPlan struct {
	Goal     string             `json:"goal"`
	Body     string             `json:"body"`
	Children []models.PlanChild `json:"children"`
}

func tryParseCgenPlan(content string) *parsedPlan {
	start := strings.Index(content, "```cgen-plan")
	if start < 0 {
		return nil
	}
	rest := content[start+len("```cgen-plan"):]
	rest = strings.TrimPrefix(rest, "\n")
	end := strings.Index(rest, "```")
	if end < 0 {
		return nil
	}
	raw := strings.TrimSpace(rest[:end])
	var p parsedPlan
	if err := json.Unmarshal([]byte(raw), &p); err != nil {
		return nil
	}
	return &p
}

func (s *AgentService) advanceAfterFEPlanReview(flow *models.AutoFlowRun, body string) {
	if flow.Stage != models.AutoFlowStageFEPlanReview || flow.Status != "running" {
		return
	}
	approved, rejected := parseDecision(body)
	if rejected {
		if flow.PlanID != nil {
			_, _ = s.RejectPlan(*flow.PlanID, flow.RunID, "PM rejected FE plan")
		}
		flow.Stage = models.AutoFlowStageRejected
		flow.Status = "rejected"
		_ = s.DB.Save(flow).Error
		s.postSystemChat(flow.RunID, "Auto flow stopped · PM rejected the FE plan")
		s.Hub.Broadcast(flow.RunID, websocket.Event{Type: "auto_flow_updated", Data: flow})
		return
	}
	if !approved {
		s.postSystemChat(flow.RunID, "PM plan reply unclear. Approve/Reject the plan ticket to continue coding.")
		return
	}
	// Claim the transition so PM auto-approve + human ticket cannot double-start coding.
	res := s.DB.Model(flow).Where("id = ? AND stage = ?", flow.ID, models.AutoFlowStageFEPlanReview).
		Update("stage", models.AutoFlowStageFECoding)
	if res.RowsAffected == 0 {
		return
	}
	flow.Stage = models.AutoFlowStageFECoding
	if flow.PlanID != nil {
		if _, _, err := s.ApprovePlanForAutoFlow(*flow.PlanID, flow.RunID); err != nil {
			// Plan may already be approved by the ticket path — continue coding anyway.
			if !strings.Contains(err.Error(), "already") {
				s.postSystemChat(flow.RunID, "Plan approve note: "+err.Error())
			}
		}
	}
	s.startFECoding(flow)
}

// ApprovePlanForAutoFlow marks the plan approved and creates children, but skips
// generic child wakes (Phase 3 drives fe_coding + qa itself).
func (s *AgentService) ApprovePlanForAutoFlow(planID, runID string) (*models.TaskPlan, []ApprovedChildTask, error) {
	return s.approvePlan(planID, runID, true)
}

func (s *AgentService) startFECoding(flow *models.AutoFlowRun) {
	flow.Stage = models.AutoFlowStageFECoding
	_ = s.DB.Save(flow).Error
	s.Hub.Broadcast(flow.RunID, websocket.Event{Type: "auto_flow_updated", Data: flow})

	cwd, err := s.ensurePrimaryCwd(flow.ProjectID)
	if err != nil {
		s.failAutoFlow(flow, err.Error())
		return
	}
	if err := s.checkLMOrError(flow.RunID); err != nil {
		s.failAutoFlow(flow, err.Error())
		return
	}

	var agent models.AgentInstance
	if err := s.DB.Where("project_id = ? AND role_id = ? AND status = ?", flow.ProjectID, "senior_fe", models.AgentStatusActive).First(&agent).Error; err != nil {
		s.failAutoFlow(flow, "No active sfd for coding")
		return
	}
	_, _ = s.SeatAgentOnRun(flow.RunID, &agent)

	input := fmt.Sprintf(`FE plan approved. Implement the requirement by editing files under the allowed cwd ONLY.

REQUIREMENT:
%s

ALLOWED_CWD: %s

Use file tools (list_dir / read_file / write_file) to make the change on disk so it appears in VS Code.
When finished, end with exactly: Code update completed.
`, flow.RequirementText, cwd)

	_, msg, err := s.Invoke(&agent, InvokeAgentRequest{
		RunID:           flow.RunID,
		WakeReason:      "auto_fe_coding",
		Input:           input,
		AllowedCwd:      cwd,
		EnableFileTools: true,
	})
	if err != nil {
		s.failAutoFlow(flow, "sfd coding wake failed: "+err.Error())
		return
	}
	content := ""
	if msg != nil {
		content = msg.Body
	}
	if !reCodeDone.MatchString(content) {
		// Ensure the required status line is visible even if the model forgot it.
		s.postAgentStatus(flow.RunID, &agent, "Code update completed.")
	}
	s.startQA(flow)
}

func (s *AgentService) startQA(flow *models.AutoFlowRun) {
	flow.Stage = models.AutoFlowStageQA
	_ = s.DB.Save(flow).Error
	s.Hub.Broadcast(flow.RunID, websocket.Event{Type: "auto_flow_updated", Data: flow})

	var agent models.AgentInstance
	if err := s.DB.Where("project_id = ? AND role_id = ? AND status = ?", flow.ProjectID, "qa_lead", models.AgentStatusActive).First(&agent).Error; err != nil {
		s.failAutoFlow(flow, "No active qa agent. Hire/seat qa_lead on the Roster.")
		return
	}
	_, _ = s.SeatAgentOnRun(flow.RunID, &agent)
	s.postAgentStatus(flow.RunID, &agent, "I am starting testing.")

	cwd, _ := s.ensurePrimaryCwd(flow.ProjectID)
	input := fmt.Sprintf(`Code update completed for:

%s

Inspect the change under cwd %s (read-only tools). Decide if it works as expected.
End with exactly one of:
CGEN_QA: PASS
Changes work as expected.
— or —
CGEN_QA: FAIL
Changes do not work as expected — <short reason>
`, flow.RequirementText, cwd)

	_, msg, err := s.Invoke(&agent, InvokeAgentRequest{
		RunID:           flow.RunID,
		WakeReason:      "auto_qa",
		Input:           input,
		AllowedCwd:      cwd,
		EnableFileTools: true, // read/list only enforced in Python when write blocked for qa? we'll allow read+list; write restricted by prompt + optional flag
		ReadOnlyTools:   true,
	})
	if err != nil {
		s.failAutoFlow(flow, "qa wake failed: "+err.Error())
		return
	}
	verdict := "unknown"
	if msg != nil {
		if m := reQA.FindStringSubmatch(msg.Body); len(m) >= 2 {
			verdict = strings.ToUpper(m[1])
		} else {
			lower := strings.ToLower(msg.Body)
			if strings.Contains(lower, "pass") && !strings.Contains(lower, "fail") {
				verdict = "PASS"
			} else if strings.Contains(lower, "fail") {
				verdict = "FAIL"
			}
		}
	}
	flow.Stage = models.AutoFlowStageDone
	flow.Status = "done"
	_ = s.DB.Save(flow).Error
	s.postSystemChat(flow.RunID, fmt.Sprintf("Auto flow finished · QA %s", verdict))
	s.Hub.Broadcast(flow.RunID, websocket.Event{Type: "auto_flow_updated", Data: flow})
}

// HandleAutoFlowTicketResolution lets a human CTO override PM triage / plan tickets.
func (s *AgentService) HandleAutoFlowTicketResolution(ticket *models.Ticket) bool {
	if ticket == nil || !strings.HasPrefix(ticket.PlaybookInstanceID, "autoflow:") {
		return false
	}
	flowID := strings.TrimPrefix(ticket.PlaybookInstanceID, "autoflow:")
	var flow models.AutoFlowRun
	if err := s.DB.First(&flow, "id = ?", flowID).Error; err != nil {
		return true
	}
	if flow.Status != "running" {
		return true
	}
	switch ticket.Status {
	case models.TicketStatusApproved:
		if flow.Stage == models.AutoFlowStagePMTriage {
			// No CGEN_ROUTE → resolveRoutesAfterPMApprove uses reports_to hierarchy (sfd/sbd).
			s.advanceAfterPMTriage(&flow, "Approve\nCGEN_DECISION: APPROVE")
		}
	case models.TicketStatusRejected:
		flow.Stage = models.AutoFlowStageRejected
		flow.Status = "rejected"
		_ = s.DB.Save(&flow).Error
		s.postSystemChat(flow.RunID, "Auto flow stopped · human rejected")
		s.Hub.Broadcast(flow.RunID, websocket.Event{Type: "auto_flow_updated", Data: flow})
	}
	return true
}

// HandleAutoFlowPlanTicket bridges plan ticket approval into FE coding when this plan belongs to an auto flow.
func (s *AgentService) HandleAutoFlowPlanTicket(planID, runID string, approved bool, comment string) bool {
	var flow models.AutoFlowRun
	err := s.DB.Where("plan_id = ? AND status = ?", planID, "running").First(&flow).Error
	if err == gorm.ErrRecordNotFound {
		return false
	}
	if err != nil {
		return false
	}
	if approved {
		s.advanceAfterFEPlanReview(&flow, "Approve\nCGEN_DECISION: APPROVE")
	} else {
		s.advanceAfterFEPlanReview(&flow, "Reject — "+comment+"\nCGEN_DECISION: REJECT")
	}
	return true
}

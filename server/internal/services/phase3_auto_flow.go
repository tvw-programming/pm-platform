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
// Flow v2: any human work chat (Event Mode or normal requirement-like text), not only
// special tags / playbook triggers. Agent/system authors never start a flow.
func ShouldStartAutoFlow(msg *models.Message) bool {
	if msg == nil || strings.TrimSpace(msg.Body) == "" {
		return false
	}
	if isAgentOrSystemAuthor(msg) {
		return false
	}
	body := strings.TrimSpace(msg.Body)
	lower := strings.ToLower(body)
	if strings.HasPrefix(lower, "/require") || strings.HasPrefix(lower, "/requirement") {
		return true
	}
	if strings.Contains(lower, "[requirement]") {
		return true
	}
	// Direct dev mention (@sbd / @sfd) routes straight to that implementer — treat as a work ask.
	if len(parseDirectDevMentions(body)) > 0 {
		return true
	}
	// Event Mode: any work chat with a body (not only new_requirement / brd_ready).
	if msg.Mode == models.ChatModeWork {
		return true
	}
	// Normal mode: human requirement-like messages (CTO/PM/etc. work asks).
	return looksLikeHumanWorkRequirement(msg)
}

// parseDirectDevMentions returns implementer role ids explicitly @-mentioned in a
// message (e.g. "@sbd" → senior_be). When present, the auto flow routes directly
// to those implementers and skips PM triage.
func parseDirectDevMentions(body string) []string {
	lower := strings.ToLower(body)
	out := []string{}
	if strings.Contains(lower, "@sbd") || strings.Contains(lower, "@senior_be") || strings.Contains(lower, "@senior backend") {
		out = append(out, "senior_be")
	}
	if strings.Contains(lower, "@sfd") || strings.Contains(lower, "@senior_fe") || strings.Contains(lower, "@senior frontend") {
		out = append(out, "senior_fe")
	}
	return out
}

func isAgentOrSystemAuthor(msg *models.Message) bool {
	if msg == nil {
		return false
	}
	id := strings.TrimSpace(msg.AuthorID)
	if id == "system" || strings.HasPrefix(id, "agent:") {
		return true
	}
	// Role JSON sometimes marks AI posts even without agent: prefix.
	for _, r := range parseAuthorRolesJSON(msg.AuthorRoles) {
		if r == "ai_agent" || r == "system" {
			return true
		}
	}
	return false
}

func parseAuthorRolesJSON(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	var roles []string
	if err := json.Unmarshal([]byte(raw), &roles); err == nil {
		return roles
	}
	return nil
}

// looksLikeHumanWorkRequirement catches plain CTO/human work asks without [requirement].
func looksLikeHumanWorkRequirement(msg *models.Message) bool {
	body := strings.TrimSpace(msg.Body)
	if len(body) < 12 {
		return false
	}
	lower := strings.ToLower(body)
	switch lower {
	case "hello", "hi", "hey", "thanks", "thank you", "ok", "okay", "ping", "lol", "hello team", "hi team":
		return false
	}
	signals := []string{
		"change ", "add ", "fix ", "update ", "implement ", "create ", "remove ", "delete ",
		"ui", "button", "theme", "color", "page", "screen", "alumni", "requirement",
		"feature", "bug", "nav", "header", "footer", "css", "style", "layout",
		"please ", "need to", "should ", "make the", "set the", "background",
		"project name", "repo", "path ", "scope change", "primary", "cwd",
	}
	for _, s := range signals {
		if strings.Contains(lower, s) {
			return true
		}
	}
	// Leadership humans posting a substantial ask even without keyword hits.
	for _, r := range parseAuthorRolesJSON(msg.AuthorRoles) {
		switch NormalizeRoleID(r) {
		case "cto", "project_manager", "full_stack_em", "product_owner", "ai_product_manager", "human_requester":
			if len(body) >= 40 {
				return true
			}
		}
	}
	return false
}

func statusStart(task string, bullets []string) string {
	var b strings.Builder
	b.WriteString("I am starting " + task + ".")
	for _, x := range bullets {
		b.WriteString("\n- ")
		b.WriteString(x)
	}
	return b.String()
}

func statusDone(bullets []string) string {
	var b strings.Builder
	b.WriteString("Completed:")
	for _, x := range bullets {
		b.WriteString("\n- ")
		b.WriteString(x)
	}
	return b.String()
}

func normalizeRequirementText(raw string) string {
	t := strings.TrimSpace(raw)
	lower := strings.ToLower(t)
	for _, p := range []string{"/requirement", "/require"} {
		if strings.HasPrefix(lower, p) {
			t = strings.TrimSpace(t[len(p):])
			break
		}
	}
	t = strings.ReplaceAll(t, "[requirement]", "")
	t = strings.ReplaceAll(t, "[Requirement]", "")
	return strings.TrimSpace(t)
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

// humanizeWakeError rewrites raw LM-connectivity failures (e.g. the Python
// bridge's "LM Studio unreachable at ...") into an actionable message so an
// agent wake that fails mid-flow tells the user how to recover instead of
// surfacing a bare transport error.
func humanizeWakeError(err error) string {
	if err == nil {
		return ""
	}
	msg := err.Error()
	low := strings.ToLower(msg)
	switch {
	case strings.Contains(low, "context length") ||
		strings.Contains(low, "tokens to keep") ||
		strings.Contains(low, "larger context") ||
		strings.Contains(low, "maximum context"):
		return "The prompt is longer than the model's loaded context window. In LM Studio, reload the model with a larger context length (e.g. 8192+), or shorten the requirement text, then retry. (" + msg + ")"
	case strings.Contains(low, "lm studio unreachable") ||
		strings.Contains(low, "python agent unreachable") ||
		strings.Contains(low, "connection refused") ||
		strings.Contains(low, "connectex") ||
		strings.Contains(low, "no such host") ||
		strings.Contains(low, "dial tcp") ||
		strings.Contains(low, "context deadline exceeded"):
		return "Local AI (LM Studio) is unreachable. Start LM Studio, load a model, and confirm Settings → Agent Config points at the right base URL, then retry. (" + msg + ")"
	}
	return msg
}

// StartAutoFlow begins PM triage for a new requirement message (async-safe).
func (s *AgentService) StartAutoFlow(runID, projectID, requirementMsgID, requirementText string) (*models.AutoFlowRun, error) {
	if runID == "" {
		runID = "run-default"
	}
	if projectID == "" {
		projectID = s.resolveProjectID(runID)
	}
	requirementText = normalizeRequirementText(requirementText)
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

	// Direct dev mention (@sbd / @sfd): route straight to the named implementer(s),
	// skipping PM triage entirely.
	if direct := parseDirectDevMentions(requirementText); len(direct) > 0 {
		s.runDirectImplementers(&flow, direct)
		return &flow, nil
	}

	s.ensurePodReportsToPM(projectID)

	var pm models.AgentInstance
	if err := s.DB.Where("project_id = ? AND role_id = ? AND status = ?", projectID, "project_manager", models.AgentStatusActive).
		First(&pm).Error; err != nil {
		s.failAutoFlow(&flow, "PM wake failed: no active project_manager. Hire/seat a Project Manager agent on the Roster first.")
		return &flow, err
	}
	_, _ = s.SeatAgentOnRun(runID, &pm)
	s.postAgentStatus(runID, &pm, statusStart("requirement triage", []string{
		"Verify the human/CTO work ask is clear and actionable",
		"Approve or Reject in short form",
		"On Approve, sfd is auto-woken for FE work (no manual Assign/Run)",
	}))

	input := fmt.Sprintf(`New requirement to triage.

REQUIREMENT:
%s

Respond in MINIMAL words.
First decide WHO should do the work:
- sfd = Senior Frontend Developer (UI, screens, components, styling, client code)
- sbd = Senior Backend Developer (APIs, endpoints, schema, database, server code)
Choose sfd, sbd, or both.

If you approve, reply exactly:
Approve
CGEN_DECISION: APPROVE
CGEN_ROUTE: <sfd and/or sbd>   (REQUIRED — e.g. "sfd", "sbd", or "sfd, sbd")

If you reject, reply exactly:
Reject — <one short reason>
CGEN_DECISION: REJECT
`, requirementText)

	ar, msg, err := s.Invoke(&pm, InvokeAgentRequest{
		RunID:      runID,
		WakeReason: "auto_pm_triage",
		Input:      input,
	})
	if err != nil {
		s.failAutoFlow(&flow, "PM wake failed: "+humanizeWakeError(err))
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

func (s *AgentService) hasActiveRole(projectID, roleID string) bool {
	var n int64
	_ = s.DB.Model(&models.AgentInstance{}).
		Where("project_id = ? AND role_id = ? AND status = ?", projectID, roleID, models.AgentStatusActive).
		Count(&n).Error
	return n > 0
}

func looksLikeBackendRequirement(text string) bool {
	lower := strings.ToLower(text)
	for _, s := range []string{"api", "backend", "endpoint", "schema", "database", "migration", "server", "sbd", "senior_be", "sql", "handler", "route", "model"} {
		if strings.Contains(lower, s) {
			return true
		}
	}
	return false
}

func looksLikeFrontendRequirement(text string) bool {
	lower := strings.ToLower(text)
	for _, s := range []string{"ui", "button", "theme", "color", "page", "screen", "css", "style", "layout", "nav", "header", "footer", "component", "frontend", "sfd", "senior_fe", "background", "font", "modal", "form"} {
		if strings.Contains(lower, s) {
			return true
		}
	}
	return false
}

// wantsPlanOnly is true when the human/PM explicitly asked for a plan with no code.
func wantsPlanOnly(text string) bool {
	lower := strings.ToLower(text)
	for _, s := range []string{"plan only", "just plan", "only plan", "no code", "don't implement", "do not implement", "planning only"} {
		if strings.Contains(lower, s) {
			return true
		}
	}
	return false
}

// resolveRoutesAfterPMApprove honors the PM's CGEN_ROUTE decision (sfd / sbd / both).
// If PM gave no explicit route, it infers from the requirement text. There is no
// hard sfd guarantee — PM decides who implements.
func (s *AgentService) resolveRoutesAfterPMApprove(projectID, body, requirementText string) []string {
	s.ensurePodReportsToPM(projectID)

	wantFE, wantBE := false, false
	for _, r := range parseRoutes(body) {
		switch r {
		case "senior_fe":
			wantFE = true
		case "senior_be":
			wantBE = true
		}
	}
	// No explicit PM route → infer from the requirement text.
	if !wantFE && !wantBE {
		wantBE = looksLikeBackendRequirement(requirementText)
		wantFE = looksLikeFrontendRequirement(requirementText)
		// Nothing matched either side → default to FE (UI work is the common case).
		if !wantFE && !wantBE {
			wantFE = true
		}
	}

	out := []string{}
	if wantFE && s.hasActiveRole(projectID, "senior_fe") {
		out = append(out, "senior_fe")
	}
	if wantBE && s.hasActiveRole(projectID, "senior_be") {
		out = append(out, "senior_be")
	}
	if len(out) == 0 {
		// Requested role(s) not seated — return the wanted role so the caller can
		// emit a clear "not seated" error for the right role.
		if wantBE && !wantFE {
			return []string{"senior_be"}
		}
		return []string{"senior_fe"}
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
	var pm models.AgentInstance
	_ = s.DB.Where("project_id = ? AND role_id = ? AND status = ?", flow.ProjectID, "project_manager", models.AgentStatusActive).
		First(&pm).Error

	approved, rejected := parseDecision(body)
	if rejected {
		flow.Stage = models.AutoFlowStageRejected
		flow.Status = "rejected"
		_ = s.DB.Save(flow).Error
		if pm.ID != "" {
			s.postAgentStatus(flow.RunID, &pm, statusDone([]string{
				"Rejected the requirement",
				"Auto flow stopped — no implementer wake",
			}))
		}
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

	routes := s.resolveRoutesAfterPMApprove(flow.ProjectID, body, flow.RequirementText)
	routesJSON, _ := json.Marshal(routes)
	flow.RoutesJSON = string(routesJSON)
	flow.Stage = models.AutoFlowStageRouting
	_ = s.DB.Save(flow).Error
	if pm.ID != "" {
		s.postAgentStatus(flow.RunID, &pm, statusDone([]string{
			"Approved the requirement",
			"Routing to " + strings.Join(displayRoles(routes), ", "),
		}))
	}
	s.postSystemChat(flow.RunID, "PM approved · auto-waking "+strings.Join(displayRoles(routes), ", "))
	s.Hub.Broadcast(flow.RunID, websocket.Event{Type: "auto_flow_updated", Data: flow})

	hasFE := containsRole(routes, "senior_fe")
	hasBE := containsRole(routes, "senior_be")
	started := 0
	// Run BE first (plan + implement). When FE also runs, the FE pipeline owns the
	// final QA pass (it verifies the combined cwd); BE-only owns its own QA.
	if hasBE {
		s.startBEImplementation(flow, !hasFE)
		started++
	}
	if hasFE {
		s.startFEPlanning(flow)
		started++
	}
	if started == 0 {
		s.failAutoFlow(flow, "PM approved but no active implementer ("+strings.Join(displayRoles(routes), "/")+"). Hire Product Eng Pod or seat senior_fe / senior_be on the Roster.")
	}
}

func containsRole(roles []string, want string) bool {
	for _, r := range roles {
		if r == want {
			return true
		}
	}
	return false
}

// runDirectImplementers handles the @sbd / @sfd direct path: no PM triage, wake the
// named implementer(s) to plan + implement, then QA.
func (s *AgentService) runDirectImplementers(flow *models.AutoFlowRun, roles []string) {
	s.ensurePodReportsToPM(flow.ProjectID)
	routesJSON, _ := json.Marshal(roles)
	flow.RoutesJSON = string(routesJSON)
	flow.Stage = models.AutoFlowStageRouting
	_ = s.DB.Save(flow).Error
	s.postSystemChat(flow.RunID, "Direct route · skipping PM · waking "+strings.Join(displayRoles(roles), ", "))
	s.Hub.Broadcast(flow.RunID, websocket.Event{Type: "auto_flow_updated", Data: flow})

	hasFE := containsRole(roles, "senior_fe")
	hasBE := containsRole(roles, "senior_be")
	started := 0
	if hasBE {
		s.startBEImplementation(flow, !hasFE)
		started++
	}
	if hasFE {
		s.startFECoding(flow)
		started++
	}
	if started == 0 {
		s.failAutoFlow(flow, "No active implementer for the direct @-mention. Hire Product Eng Pod or seat senior_fe / senior_be.")
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

// startBEImplementation wakes sbd to plan AND implement the backend scope under the
// project cwd (file tools). When the requirement explicitly asks for planning only,
// it falls back to a plan-only wake. triggerQA controls whether this handler owns the
// final QA pass (true when BE is the sole implementer; false when FE will run QA).
func (s *AgentService) startBEImplementation(flow *models.AutoFlowRun, triggerQA bool) {
	var agent models.AgentInstance
	err := s.DB.Where("project_id = ? AND role_id = ? AND status = ?", flow.ProjectID, "senior_be", models.AgentStatusActive).First(&agent).Error
	if err != nil {
		if triggerQA {
			s.failAutoFlow(flow, "No active sbd (Senior BE) agent. Hire Product Eng Pod or seat senior_be on the Roster.")
		} else {
			s.postSystemChat(flow.RunID, "No active sbd (Senior BE) agent seated — skipping BE. Hire Product Eng Pod or seat senior_be.")
		}
		return
	}
	if lmErr := s.checkLMOrError(flow.RunID); lmErr != nil {
		if triggerQA {
			s.failAutoFlow(flow, "sbd wake skipped: "+lmErr.Error())
		} else {
			s.postSystemChat(flow.RunID, "sbd wake skipped: "+lmErr.Error())
		}
		return
	}
	_, _ = s.SeatAgentOnRun(flow.RunID, &agent)

	// Plan-only mode: explicit human/PM request for a plan with no code.
	if wantsPlanOnly(flow.RequirementText) {
		s.postAgentStatus(flow.RunID, &agent, statusStart("backend planning", []string{
			"Review backend scope of the requirement",
			"Post a short API/schema plan (no file writes)",
		}))
		input := fmt.Sprintf(`Requirement (backend scope):
%s

Post a short backend plan (APIs/schemas). Do not write files.
When finished, summarize the plan in bullet points.`, flow.RequirementText)
		_, _, err := s.Invoke(&agent, InvokeAgentRequest{RunID: flow.RunID, WakeReason: "auto_be_planning", Input: input})
		if err != nil {
			s.postSystemChat(flow.RunID, "sbd wake failed: "+humanizeWakeError(err))
			return
		}
		s.postAgentStatus(flow.RunID, &agent, statusDone([]string{"Posted backend plan (planning only)"}))
		return
	}

	cwd, err := s.ensurePrimaryCwd(flow.ProjectID)
	if err != nil {
		if triggerQA {
			s.failAutoFlow(flow, err.Error())
		} else {
			s.postSystemChat(flow.RunID, "sbd implementation skipped: "+err.Error())
		}
		return
	}

	s.postAgentStatus(flow.RunID, &agent, statusStart("backend implementation", []string{
		"Plan the backend scope (APIs/schema) briefly",
		"Implement it by editing files under Settings primary_cwd",
		"Use list_dir / read_file / write_file only inside the allowed cwd",
	}))
	input := fmt.Sprintf(`You are sbd (Senior BE). Implement the backend scope of this requirement by editing files under the allowed cwd ONLY.

REQUIREMENT:
%s

ALLOWED_CWD: %s

First note a 1-2 line plan (APIs/schema/files to touch), then use file tools (list_dir / read_file / write_file) to implement it on disk so it appears in VS Code.
When finished, end with exactly: Code update completed.
`, flow.RequirementText, cwd)
	_, msg, err := s.Invoke(&agent, InvokeAgentRequest{
		RunID:           flow.RunID,
		WakeReason:      "auto_be_coding",
		Input:           input,
		AllowedCwd:      cwd,
		EnableFileTools: true,
	})
	if err != nil {
		if triggerQA {
			s.failAutoFlow(flow, "sbd coding wake failed: "+humanizeWakeError(err))
		} else {
			s.postSystemChat(flow.RunID, "sbd coding wake failed: "+humanizeWakeError(err))
		}
		return
	}
	content := ""
	if msg != nil {
		content = msg.Body
	}
	if !reCodeDone.MatchString(content) {
		s.postAgentStatus(flow.RunID, &agent, "Code update completed.")
	}
	s.postAgentStatus(flow.RunID, &agent, statusDone([]string{
		"Applied backend changes under " + cwd,
		"Backend implementation pass finished",
	}))
	if triggerQA {
		s.startQA(flow)
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
	s.postAgentStatus(flow.RunID, &agent, statusStart("FE planning", []string{
		"Turn the approved requirement into a short implementation plan",
		"List files/UI changes and acceptance criteria",
		"Do not write code yet — wait for PM plan approval",
	}))

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
		s.failAutoFlow(flow, "sfd planning wake failed: "+humanizeWakeError(err))
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
	s.postAgentStatus(flow.RunID, agent, statusDone([]string{
		"Posted FE plan card for PM review",
		"Goal: " + goal,
		"Waiting for PM plan Approve before coding",
	}))

	// Auto-wake PM to approve/reject the FE plan (human can still use the ticket).
	var pm models.AgentInstance
	if err := s.DB.Where("project_id = ? AND role_id = ? AND status = ?", flow.ProjectID, "project_manager", models.AgentStatusActive).
		First(&pm).Error; err != nil {
		s.postSystemChat(flow.RunID, "PM plan-review wake failed: no active PM. Use the plan ticket Approve/Reject to continue.")
		return
	}
	_, _ = s.SeatAgentOnRun(flow.RunID, &pm)
	s.postAgentStatus(flow.RunID, &pm, statusStart("FE plan review", []string{
		"Review the sfd plan against the original requirement",
		"Approve or Reject in short form",
	}))
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
	_, pmMsg, err := s.Invoke(&pm, InvokeAgentRequest{
		RunID:      flow.RunID,
		WakeReason: "auto_pm_plan_review",
		Input:      pmInput,
	})
	if err != nil {
		s.postSystemChat(flow.RunID, "PM plan-review wake failed: "+humanizeWakeError(err)+". Use the plan ticket Approve/Reject to continue.")
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
	var pm models.AgentInstance
	_ = s.DB.Where("project_id = ? AND role_id = ? AND status = ?", flow.ProjectID, "project_manager", models.AgentStatusActive).
		First(&pm).Error

	approved, rejected := parseDecision(body)
	if rejected {
		if flow.PlanID != nil {
			_, _ = s.RejectPlan(*flow.PlanID, flow.RunID, "PM rejected FE plan")
		}
		flow.Stage = models.AutoFlowStageRejected
		flow.Status = "rejected"
		_ = s.DB.Save(flow).Error
		if pm.ID != "" {
			s.postAgentStatus(flow.RunID, &pm, statusDone([]string{
				"Rejected the FE plan",
				"Coding will not start",
			}))
		}
		s.postSystemChat(flow.RunID, "Auto flow stopped · PM rejected the FE plan")
		s.Hub.Broadcast(flow.RunID, websocket.Event{Type: "auto_flow_updated", Data: flow})
		return
	}
	if !approved {
		s.postSystemChat(flow.RunID, "PM plan reply unclear. Approve/Reject the plan ticket to continue coding.")
		return
	}
	if pm.ID != "" {
		s.postAgentStatus(flow.RunID, &pm, statusDone([]string{
			"Approved the FE plan",
			"Auto-waking sfd to implement under Settings primary_cwd",
		}))
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
	s.postAgentStatus(flow.RunID, &agent, statusStart("FE coding", []string{
		"Implement the PM-approved plan under Settings primary_cwd",
		"Edit files with list_dir / read_file / write_file only inside allowed cwd",
		"Leave a clear completion note when done",
	}))

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
		s.failAutoFlow(flow, "sfd coding wake failed: "+humanizeWakeError(err))
		return
	}
	content := ""
	if msg != nil {
		content = msg.Body
	}
	if !reCodeDone.MatchString(content) {
		s.postAgentStatus(flow.RunID, &agent, "Code update completed.")
	}
	s.postAgentStatus(flow.RunID, &agent, statusDone([]string{
		"Applied code changes under " + cwd,
		"Requirement implementation pass finished",
		"Handing off to qa for verification",
	}))
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
	s.postAgentStatus(flow.RunID, &agent, statusStart("testing", []string{
		"Check whether the requirement is fulfilled in primary_cwd",
		"Use read-only tools (no writes)",
		"Report CGEN_QA: PASS or FAIL",
	}))

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
		s.failAutoFlow(flow, "qa wake failed: "+humanizeWakeError(err))
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
	s.postAgentStatus(flow.RunID, &agent, statusDone([]string{
		"Verified requirement fulfillment against cwd changes",
		"QA verdict: " + verdict,
	}))
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
			// Human override Approve → sfd hard-guaranteed; sbd only if requirement needs BE.
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

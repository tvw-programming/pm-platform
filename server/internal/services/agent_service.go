package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"pm-platform/server/internal/config"
	"pm-platform/server/internal/models"
	"pm-platform/server/internal/websocket"
)

type AgentService struct {
	DB  *gorm.DB
	Cfg *config.Config
	Hub *websocket.Hub
}

type InvokeAgentRequest struct {
	RunID           string `json:"run_id"`
	WakeReason      string `json:"wake_reason"`
	Input           string `json:"input"`
	SeatRunID       string `json:"seat_run_id,omitempty"` // if empty, use RunID for seat check
	AllowedCwd      string `json:"allowed_cwd,omitempty"`
	EnableFileTools bool   `json:"enable_file_tools,omitempty"`
	ReadOnlyTools   bool   `json:"read_only_tools,omitempty"`
}

type pythonInvokeRequest struct {
	Model           string              `json:"model"`
	SystemPrompt    string              `json:"system_prompt"`
	Messages        []map[string]string `json:"messages"`
	BaseURL         string              `json:"base_url"`
	APIKey          string              `json:"api_key,omitempty"`
	TimeoutSec      int                 `json:"timeout_sec"`
	AgentID         string              `json:"agent_id"`
	RunID           string              `json:"run_id"`
	AgentRunID      string              `json:"agent_run_id"`
	WakeReason      string              `json:"wake_reason"`
	AllowedCwd      string              `json:"allowed_cwd,omitempty"`
	EnableFileTools bool                `json:"enable_file_tools,omitempty"`
	ReadOnlyTools   bool                `json:"read_only_tools,omitempty"`
	MaxToolRounds   int                 `json:"max_tool_rounds,omitempty"`
}

type pythonInvokeResponse struct {
	Content          string `json:"content"`
	PromptTokens     int64  `json:"prompt_tokens"`
	CompletionTokens int64  `json:"completion_tokens"`
	Error            string `json:"error,omitempty"`
}

func (s *AgentService) GetLMStudioConfig() (*models.RuntimeConfig, error) {
	var cfg models.RuntimeConfig
	err := s.DB.Where("key = ?", models.RuntimeConfigKeyLMStudio).First(&cfg).Error
	if err == gorm.ErrRecordNotFound {
		cfg = models.RuntimeConfig{
			ID:           uuid.New().String(),
			Key:          models.RuntimeConfigKeyLMStudio,
			BaseURL:      s.Cfg.AgentRuntime.LMStudioURL,
			APIKey:       s.Cfg.AgentRuntime.LMStudioAPIKey,
			DefaultModel: s.Cfg.AgentRuntime.DefaultModel,
			TimeoutSec:   300,
		}
		if err := s.DB.Create(&cfg).Error; err != nil {
			return nil, err
		}
		return &cfg, nil
	}
	if err != nil {
		return nil, err
	}
	return &cfg, nil
}

func (s *AgentService) UpsertLMStudioConfig(baseURL, apiKey, defaultModel string, timeoutSec int) (*models.RuntimeConfig, error) {
	cfg, err := s.GetLMStudioConfig()
	if err != nil {
		return nil, err
	}
	updates := map[string]interface{}{}
	if baseURL != "" {
		updates["base_url"] = baseURL
	}
	updates["api_key"] = apiKey
	if defaultModel != "" {
		updates["default_model"] = defaultModel
	}
	if timeoutSec > 0 {
		updates["timeout_sec"] = timeoutSec
	}
	if err := s.DB.Model(cfg).Updates(updates).Error; err != nil {
		return nil, err
	}
	return s.GetLMStudioConfig()
}

func (s *AgentService) CheckLMStudioHealth() (map[string]interface{}, error) {
	cfg, err := s.GetLMStudioConfig()
	if err != nil {
		return nil, err
	}
	url := strings.TrimRight(cfg.BaseURL, "/") + "/models"
	client := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return map[string]interface{}{"ok": false, "error": err.Error(), "base_url": cfg.BaseURL}, nil
	}
	if cfg.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+cfg.APIKey)
	}
	resp, err := client.Do(req)
	if err != nil {
		return map[string]interface{}{"ok": false, "error": err.Error(), "base_url": cfg.BaseURL}, nil
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return map[string]interface{}{
			"ok":       false,
			"error":    fmt.Sprintf("status %d: %s", resp.StatusCode, string(body)),
			"base_url": cfg.BaseURL,
		}, nil
	}
	var parsed map[string]interface{}
	_ = json.Unmarshal(body, &parsed)
	modelsOut := []interface{}{}
	if data, ok := parsed["data"].([]interface{}); ok {
		modelsOut = data
	}
	return map[string]interface{}{
		"ok":       true,
		"base_url": cfg.BaseURL,
		"models":   modelsOut,
		"count":    len(modelsOut),
	}, nil
}

func (s *AgentService) LoadAgentSkills(agentID string) ([]models.Skill, error) {
	var skills []models.Skill
	err := s.DB.Raw(`
		SELECT s.* FROM skills s
		INNER JOIN agent_skills asg ON asg.skill_id = s.id
		WHERE asg.agent_id = ? AND asg.deleted_at IS NULL
	`, agentID).Scan(&skills).Error
	return skills, err
}

func (s *AgentService) AttachDefaultSkills(agent *models.AgentInstance) error {
	var slugs []string
	switch agent.RoleID {
	case "project_manager":
		slugs = []string{"issue-triage", "task-planning"}
	case "senior_fe", "senior_be":
		slugs = []string{"github-pr-workflow"}
	case "qa_lead":
		slugs = []string{"qa-acceptance"}
	default:
		slugs = []string{"task-planning"}
	}
	for _, slug := range slugs {
		var skill models.Skill
		if err := s.DB.Where("slug = ?", slug).First(&skill).Error; err != nil {
			continue
		}
		var existing models.AgentSkill
		if err := s.DB.Where("agent_id = ? AND skill_id = ?", agent.ID, skill.ID).First(&existing).Error; err == gorm.ErrRecordNotFound {
			as := models.AgentSkill{ID: uuid.New().String(), AgentID: agent.ID, SkillID: skill.ID}
			if err := s.DB.Create(&as).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *AgentService) SeatAgentOnRun(runID string, agent *models.AgentInstance) (*models.RosterEntry, error) {
	var existing models.RosterEntry
	result := s.DB.Where("run_id = ? AND role_id = ?", runID, agent.RoleID).First(&existing)
	agentID := agent.ID
	if result.Error == gorm.ErrRecordNotFound {
		entry := models.RosterEntry{
			ID:       uuid.New().String(),
			RunID:    runID,
			RoleID:   agent.RoleID,
			AgentID:  &agentID,
			UserID:   "agent:" + agent.ID,
			UserName: agent.Name,
			Present:  true,
		}
		if err := s.DB.Create(&entry).Error; err != nil {
			return nil, err
		}
		return &entry, nil
	}
	if result.Error != nil {
		return nil, result.Error
	}
	if err := s.DB.Model(&existing).Updates(map[string]interface{}{
		"agent_id":  agentID,
		"user_id":   "agent:" + agent.ID,
		"user_name": agent.Name,
		"present":   true,
	}).Error; err != nil {
		return nil, err
	}
	existing.AgentID = &agentID
	existing.UserID = "agent:" + agent.ID
	existing.UserName = agent.Name
	existing.Present = true
	return &existing, nil
}

func (s *AgentService) ValidateWake(agent *models.AgentInstance, runID string) error {
	if agent.Status != models.AgentStatusActive {
		return fmt.Errorf("agent is %s; only active agents can be woken", agent.Status)
	}
	if _, hard, err := s.CheckBudgets(agent); hard {
		if err != nil {
			return err
		}
		return fmt.Errorf("agent or project hard token budget blocked")
	}
	var seat models.RosterEntry
	err := s.DB.Where("run_id = ? AND role_id = ? AND agent_id = ? AND present = true", runID, agent.RoleID, agent.ID).First(&seat).Error
	if err == gorm.ErrRecordNotFound {
		return fmt.Errorf("agent is not seated on run %s for role %s", runID, agent.RoleID)
	}
	return err
}

func (s *AgentService) BuildSystemPrompt(agent *models.AgentInstance, skills []models.Skill, wakeReason string, fileTools bool, readOnly bool, allowedCwd string) string {
	var b strings.Builder
	b.WriteString("You are a CGen AI teammate.\n")
	b.WriteString(fmt.Sprintf("Identity: name=%s role=%s agent_id=%s\n", agent.Name, agent.RoleID, agent.ID))
	b.WriteString(fmt.Sprintf("Wake reason: %s\n", wakeReason))
	b.WriteString("Respond with a final complete message (no streaming).\n")
	b.WriteString("Playbooks and human tickets remain approval gates — propose, do not bypass governance.\n")
	b.WriteString("When handing off, include a fenced ```cgen-handoff JSON block with from_role, to_roles, task_id, summary, acceptance_criteria, and optional pr_title/pr_body/verification_steps.\n")
	b.WriteString("For task-planning, do not create child tasks until a human approve_reject ticket is approved.\n")
	if fileTools {
		b.WriteString("\n## File tools (cwd-scoped)\n")
		b.WriteString(fmt.Sprintf("ALLOWED_CWD=%s\n", allowedCwd))
		b.WriteString("You may call tools by emitting a line exactly like:\n")
		b.WriteString("<<<TOOL>>>{\"name\":\"list_dir\",\"path\":\".\"}<<<END_TOOL>>>\n")
		b.WriteString("<<<TOOL>>>{\"name\":\"read_file\",\"path\":\"relative/path\"}<<<END_TOOL>>>\n")
		if readOnly {
			b.WriteString("WRITE IS DISABLED for this wake (read/list only).\n")
		} else {
			b.WriteString("<<<TOOL>>>{\"name\":\"write_file\",\"path\":\"relative/path\",\"content\":\"...\"}<<<END_TOOL>>>\n")
			b.WriteString("Never write outside ALLOWED_CWD. Prefer small, focused edits.\n")
		}
		b.WriteString("After tools finish, give your final user-visible message without tool markers.\n")
	} else {
		b.WriteString("Do not invent repo tool calls on this wake.\n")
	}
	b.WriteString("\n")
	if agent.Instructions != "" {
		b.WriteString("## Instructions\n")
		b.WriteString(agent.Instructions)
		b.WriteString("\n\n")
	}
	if len(skills) > 0 {
		b.WriteString("## Attached skills\n")
		for _, sk := range skills {
			b.WriteString(fmt.Sprintf("### %s (%s)\n%s\n\n%s\n\n", sk.Name, sk.Slug, sk.Description, sk.Body))
		}
	}
	return b.String()
}

func (s *AgentService) Invoke(agent *models.AgentInstance, req InvokeAgentRequest) (*models.AgentRun, *models.Message, error) {
	runID := req.RunID
	if runID == "" {
		return nil, nil, fmt.Errorf("run_id is required")
	}
	wakeReason := req.WakeReason
	if wakeReason == "" {
		wakeReason = "manual_assign"
	}

	if err := s.ValidateWake(agent, runID); err != nil {
		return nil, nil, err
	}

	agentRun := models.AgentRun{
		ID:         uuid.New().String(),
		AgentID:    agent.ID,
		RunID:      runID,
		WakeReason: wakeReason,
		Status:     models.AgentRunStatusRunning,
		InputRef:   req.Input,
	}
	if err := s.DB.Create(&agentRun).Error; err != nil {
		return nil, nil, err
	}

	s.Hub.Broadcast(runID, websocket.Event{
		Type: "agent_run_started",
		Data: map[string]interface{}{
			"agent_run": agentRun,
			"agent":     agent,
		},
	})

	// System banner message
	startedBody := fmt.Sprintf("Run started · wake=%s · agent=%s", wakeReason, agent.Name)
	rolesJSON, _ := json.Marshal([]string{agent.RoleID, "system"})
	startedMsg := models.Message{
		ID:          uuid.New().String(),
		RunID:       runID,
		AuthorID:    "system",
		AuthorName:  "System",
		AuthorRoles: string(rolesJSON),
		Mode:        models.ChatModeNormal,
		Body:        startedBody,
		AgentID:     &agent.ID,
		AgentRunID:  &agentRun.ID,
	}
	_ = s.DB.Create(&startedMsg).Error
	s.Hub.Broadcast(runID, websocket.Event{Type: "new_message", Data: map[string]interface{}{"message": startedMsg}})

	skills, _ := s.LoadAgentSkills(agent.ID)
	lmCfg, err := s.GetLMStudioConfig()
	if err != nil {
		return s.failRun(&agentRun, runID, agent, err.Error())
	}

	model := agent.ModelName
	if model == "" {
		model = lmCfg.DefaultModel
	}

	enableTools := req.EnableFileTools
	allowedCwd := strings.TrimSpace(req.AllowedCwd)
	if enableTools && allowedCwd == "" {
		return s.failRun(&agentRun, runID, agent, "file tools requested but allowed_cwd is empty — set Settings → Agent Config → primary_cwd")
	}

	sysPrompt := s.BuildSystemPrompt(agent, skills, wakeReason, enableTools, req.ReadOnlyTools, allowedCwd)
	userContent := req.Input
	if userContent == "" {
		userContent = "Please check your assigned work for this run and respond with your next actions."
	}

	pyReq := pythonInvokeRequest{
		Model:           model,
		SystemPrompt:    sysPrompt,
		Messages:        []map[string]string{{"role": "user", "content": userContent}},
		BaseURL:         lmCfg.BaseURL,
		APIKey:          lmCfg.APIKey,
		TimeoutSec:      lmCfg.TimeoutSec,
		AgentID:         agent.ID,
		RunID:           runID,
		AgentRunID:      agentRun.ID,
		WakeReason:      wakeReason,
		AllowedCwd:      allowedCwd,
		EnableFileTools: enableTools,
		ReadOnlyTools:   req.ReadOnlyTools,
		MaxToolRounds:   10,
	}

	pyResp, err := s.callPythonAgent(pyReq)
	if err != nil {
		return s.failRun(&agentRun, runID, agent, err.Error())
	}
	if pyResp.Error != "" {
		return s.failRun(&agentRun, runID, agent, pyResp.Error)
	}

	content := strings.TrimSpace(pyResp.Content)
	if content == "" {
		content = "(empty model response)"
	}

	agentRolesJSON, _ := json.Marshal([]string{agent.RoleID, "ai_agent"})
	outMsg := models.Message{
		ID:          uuid.New().String(),
		RunID:       runID,
		AuthorID:    "agent:" + agent.ID,
		AuthorName:  agent.Name,
		AuthorRoles: string(agentRolesJSON),
		Mode:        models.ChatModeNormal,
		Body:        content,
		AgentID:     &agent.ID,
		AgentRunID:  &agentRun.ID,
	}
	if err := s.DB.Create(&outMsg).Error; err != nil {
		return s.failRun(&agentRun, runID, agent, err.Error())
	}

	agentRun.Status = models.AgentRunStatusSucceeded
	agentRun.OutputMessageID = &outMsg.ID
	agentRun.PromptTokens = pyResp.PromptTokens
	agentRun.CompletionTokens = pyResp.CompletionTokens
	_ = s.DB.Save(&agentRun).Error

	total := pyResp.PromptTokens + pyResp.CompletionTokens
	s.ApplyTokenSpend(agent, total)
	s.TryParseHandoffFromContent(agent, runID, content, outMsg.ID)

	softHit, _, _ := s.CheckBudgets(agent)
	finishedBody := fmt.Sprintf("Run finished · status=succeeded · tokens=%d (prompt=%d completion=%d)",
		total, pyResp.PromptTokens, pyResp.CompletionTokens)
	if softHit {
		finishedBody += " · soft token budget reached"
	}
	finMsg := models.Message{
		ID:          uuid.New().String(),
		RunID:       runID,
		AuthorID:    "system",
		AuthorName:  "System",
		AuthorRoles: string(rolesJSON),
		Mode:        models.ChatModeNormal,
		Body:        finishedBody,
		AgentID:     &agent.ID,
		AgentRunID:  &agentRun.ID,
	}
	_ = s.DB.Create(&finMsg).Error

	s.Hub.Broadcast(runID, websocket.Event{Type: "new_message", Data: map[string]interface{}{"message": outMsg}})
	s.Hub.Broadcast(runID, websocket.Event{Type: "new_message", Data: map[string]interface{}{"message": finMsg}})
	s.Hub.Broadcast(runID, websocket.Event{
		Type: "agent_run_finished",
		Data: map[string]interface{}{
			"agent_run": agentRun,
			"agent":     agent,
			"message":   outMsg,
		},
	})

	return &agentRun, &outMsg, nil
}

func (s *AgentService) failRun(agentRun *models.AgentRun, runID string, agent *models.AgentInstance, errMsg string) (*models.AgentRun, *models.Message, error) {
	agentRun.Status = models.AgentRunStatusFailed
	agentRun.ErrorMessage = errMsg
	_ = s.DB.Save(agentRun).Error

	rolesJSON, _ := json.Marshal([]string{"system"})
	failMsg := models.Message{
		ID:          uuid.New().String(),
		RunID:       runID,
		AuthorID:    "system",
		AuthorName:  "System",
		AuthorRoles: string(rolesJSON),
		Mode:        models.ChatModeNormal,
		Body:        fmt.Sprintf("Run finished · status=failed · error=%s", errMsg),
		AgentID:     &agent.ID,
		AgentRunID:  &agentRun.ID,
	}
	_ = s.DB.Create(&failMsg).Error
	s.Hub.Broadcast(runID, websocket.Event{Type: "new_message", Data: map[string]interface{}{"message": failMsg}})
	s.Hub.Broadcast(runID, websocket.Event{
		Type: "agent_run_finished",
		Data: map[string]interface{}{
			"agent_run": agentRun,
			"agent":     agent,
			"error":     errMsg,
		},
	})
	return agentRun, &failMsg, fmt.Errorf("%s", errMsg)
}

func (s *AgentService) callPythonAgent(req pythonInvokeRequest) (*pythonInvokeResponse, error) {
	url := strings.TrimRight(s.Cfg.AgentRuntime.PythonAgentURL, "/") + "/v1/invoke"
	payload, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}
	timeout := time.Duration(req.TimeoutSec) * time.Second
	if timeout <= 0 {
		timeout = 300 * time.Second
	}
	client := &http.Client{Timeout: timeout + 10*time.Second}
	httpReq, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("python agent unreachable at %s: %w", url, err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("python agent status %d: %s", resp.StatusCode, string(body))
	}
	var out pythonInvokeResponse
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

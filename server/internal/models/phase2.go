package models

import (
	"time"

	"gorm.io/gorm"
)

// Handoff is a structured contract passed between role agents (Phase 2).
type Handoff struct {
	ID                 string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	RunID              string         `gorm:"index;not null" json:"run_id"`
	ProjectID          string         `gorm:"index;not null" json:"project_id"`
	FromAgentID        *string        `gorm:"type:uuid" json:"from_agent_id,omitempty"`
	FromRole           string         `gorm:"type:varchar(50);not null" json:"from_role"`
	ToRolesJSON        string         `gorm:"type:text;not null" json:"to_roles_json"` // JSON array of role ids
	TaskID             string         `gorm:"type:varchar(100)" json:"task_id,omitempty"`
	Summary            string         `gorm:"type:text;not null" json:"summary"`
	AcceptanceJSON     string         `gorm:"type:text" json:"acceptance_criteria_json,omitempty"`
	OpenQuestionsJSON  string         `gorm:"type:text" json:"open_questions_json,omitempty"`
	ArtifactsJSON      string         `gorm:"type:text" json:"artifacts_json,omitempty"`
	PlaybookHint       string         `gorm:"type:varchar(100)" json:"playbook_hint,omitempty"`
	PRTitle            string         `gorm:"type:text" json:"pr_title,omitempty"`
	PRBody             string         `gorm:"type:text" json:"pr_body,omitempty"`
	VerificationSteps  string         `gorm:"type:text" json:"verification_steps,omitempty"`
	PRURL              string         `gorm:"type:text" json:"pr_url,omitempty"`
	MessageID          *string        `gorm:"type:uuid" json:"message_id,omitempty"`
	Status             string         `gorm:"type:varchar(30);not null;default:'open'" json:"status"` // open|passed|closed
	ContractVersion    int            `gorm:"not null;default:1" json:"contract_version"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Handoff) TableName() string { return "handoffs" }

// TaskPlan is a PM task-planning artifact that must be approved before children are created.
type TaskPlan struct {
	ID              string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	RunID           string         `gorm:"index;not null" json:"run_id"`
	ProjectID       string         `gorm:"index;not null" json:"project_id"`
	AgentID         *string        `gorm:"type:uuid" json:"agent_id,omitempty"`
	Goal            string         `gorm:"type:text;not null" json:"goal"`
	BodyMarkdown    string         `gorm:"type:text;not null" json:"body_markdown"`
	ChildrenJSON    string         `gorm:"type:text;not null" json:"children_json"` // []PlanChild
	Status          string         `gorm:"type:varchar(30);not null;default:'pending_approval'" json:"status"` // pending_approval|approved|rejected
	TicketID        *string        `gorm:"type:uuid" json:"ticket_id,omitempty"`
	MessageID       *string        `gorm:"type:uuid" json:"message_id,omitempty"`
	CreatedTaskIDs  string         `gorm:"type:text" json:"created_task_ids,omitempty"` // JSON array after approval
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

func (TaskPlan) TableName() string { return "task_plans" }

// PlanChild is the JSON shape stored in TaskPlan.ChildrenJSON.
type PlanChild struct {
	Title            string   `json:"title"`
	RoleID           string   `json:"role_id"`
	Acceptance       []string `json:"acceptance_criteria,omitempty"`
	BlockedByIndexes []int    `json:"blocked_by_indexes,omitempty"`
	StoryPoints      int      `json:"story_points,omitempty"`
}

// Routine is a scheduled wake that creates a task and invokes an agent.
type Routine struct {
	ID          string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	ProjectID   string         `gorm:"index;not null" json:"project_id"`
	Key         string         `gorm:"uniqueIndex;type:varchar(100);not null" json:"key"`
	Name        string         `gorm:"type:varchar(200);not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	CronExpr    string         `gorm:"type:varchar(100);not null" json:"cron_expr"`
	RoleID      string         `gorm:"type:varchar(50);not null" json:"role_id"`
	SkillSlug   string         `gorm:"type:varchar(100)" json:"skill_slug,omitempty"`
	PromptBody  string         `gorm:"type:text;not null" json:"prompt_body"`
	Enabled     bool           `gorm:"not null;default:true" json:"enabled"`
	LastRunAt   *time.Time     `json:"last_run_at,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Routine) TableName() string { return "routines" }

// RoutineRun audits one routine fire.
type RoutineRun struct {
	ID         string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	RoutineID  string         `gorm:"index;type:uuid;not null" json:"routine_id"`
	RunID      string         `gorm:"index;not null" json:"run_id"`
	AgentRunID *string        `gorm:"type:uuid" json:"agent_run_id,omitempty"`
	Status     string         `gorm:"type:varchar(30);not null" json:"status"`
	Detail     string         `gorm:"type:text" json:"detail,omitempty"`
	CreatedAt  time.Time      `json:"created_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

func (RoutineRun) TableName() string { return "routine_runs" }

// ProjectAgentConfig binds repo/cwd/token ceiling to a CGen project.
type ProjectAgentConfig struct {
	ID              string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	ProjectID       string         `gorm:"uniqueIndex;not null" json:"project_id"`
	RepoURL         string         `gorm:"type:varchar(500)" json:"repo_url,omitempty"`
	PrimaryCwd      string         `gorm:"type:varchar(500)" json:"primary_cwd,omitempty"`
	EnvJSON         string         `gorm:"type:text" json:"env_json,omitempty"`
	SoftTokenBudget *int64         `json:"soft_token_budget,omitempty"`
	HardTokenBudget *int64         `json:"hard_token_budget,omitempty"`
	TokensUsed      int64          `gorm:"not null;default:0" json:"tokens_used"`
	BudgetPaused    bool           `gorm:"not null;default:false" json:"budget_paused"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

func (ProjectAgentConfig) TableName() string { return "project_agent_configs" }

// ExecutionPolicyRecord stores task execution policy (review → approval) keyed by task id.
type ExecutionPolicyRecord struct {
	ID               string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	TaskID           string         `gorm:"uniqueIndex;type:varchar(100);not null" json:"task_id"`
	ProjectID        string         `gorm:"index;not null" json:"project_id"`
	Mode             string         `gorm:"type:varchar(30);not null;default:'normal'" json:"mode"`
	CommentRequired  bool           `gorm:"not null;default:true" json:"comment_required"`
	MaxReviewRounds  int            `gorm:"not null;default:3" json:"max_review_rounds"`
	ReviewRoundsUsed int            `gorm:"not null;default:0" json:"review_rounds_used"`
	StagesJSON       string         `gorm:"type:text;not null" json:"stages_json"`
	CurrentStage     int            `gorm:"not null;default:0" json:"current_stage"`
	Status           string         `gorm:"type:varchar(30);not null;default:'idle'" json:"status"` // idle|in_review|awaiting_approval|escalated|cleared
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

func (ExecutionPolicyRecord) TableName() string { return "task_execution_policies" }

// DefaultImplementationPolicyJSON is the recommended EP1 default for impl tasks.
const DefaultImplementationPolicyJSON = `{"mode":"normal","commentRequired":true,"maxReviewRounds":3,"stages":[{"type":"review","participants":[{"type":"agent","roleId":"qa_lead"}]},{"type":"approval","participants":[{"type":"user","role":"human_requester"}]}]}`

// Soft/hard token fields on AgentInstance — stored via existing TokenBudget as hard;
// SoftTokenBudget added as column through AutoMigrate of extended struct fields below.

// Budget thresholds helpers live on AgentInstance (extended fields).

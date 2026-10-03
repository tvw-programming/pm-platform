package models

import (
	"time"

	"gorm.io/gorm"
)

type AgentStatus string

const (
	AgentStatusActive     AgentStatus = "active"
	AgentStatusPaused     AgentStatus = "paused"
	AgentStatusTerminated AgentStatus = "terminated"
)

type AgentRunStatus string

const (
	AgentRunStatusRunning   AgentRunStatus = "running"
	AgentRunStatusSucceeded AgentRunStatus = "succeeded"
	AgentRunStatusFailed    AgentRunStatus = "failed"
)

// AgentInstance is a long-lived project agent (hire once).
type AgentInstance struct {
	ID               string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	ProjectID        string         `gorm:"index;not null" json:"project_id"`
	Name             string         `gorm:"type:varchar(200);not null" json:"name"`
	RoleID           string         `gorm:"type:varchar(50);not null" json:"role_id"`
	Status           AgentStatus    `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
	Instructions     string         `gorm:"type:text" json:"instructions"`
	ModelName        string         `gorm:"column:model;type:varchar(200)" json:"model"`
	ReportsToAgentID *string        `gorm:"type:uuid" json:"reports_to_agent_id,omitempty"`
	TokenBudget      *int64         `json:"token_budget,omitempty"`
	TokensUsed       int64          `gorm:"not null;default:0" json:"tokens_used"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

func (AgentInstance) TableName() string { return "agent_instances" }

// AgentRun audits one wake / invoke.
type AgentRun struct {
	ID               string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	AgentID          string         `gorm:"index;type:uuid;not null" json:"agent_id"`
	RunID            string         `gorm:"index;not null" json:"run_id"`
	WakeReason       string         `gorm:"type:varchar(100);not null" json:"wake_reason"`
	Status           AgentRunStatus `gorm:"type:varchar(20);not null;default:'running'" json:"status"`
	InputRef         string         `gorm:"type:text" json:"input_ref,omitempty"`
	OutputMessageID  *string        `gorm:"type:uuid" json:"output_message_id,omitempty"`
	PromptTokens     int64          `gorm:"not null;default:0" json:"prompt_tokens"`
	CompletionTokens int64          `gorm:"not null;default:0" json:"completion_tokens"`
	ErrorMessage     string         `gorm:"type:text" json:"error_message,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

func (AgentRun) TableName() string { return "agent_runs" }

// Skill is a markdown procedure stored in the platform.
type Skill struct {
	ID          string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Slug        string         `gorm:"uniqueIndex;type:varchar(100);not null" json:"slug"`
	Name        string         `gorm:"type:varchar(200);not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	Body        string         `gorm:"type:text;not null" json:"body"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Skill) TableName() string { return "skills" }

// AgentSkill attaches a skill to an agent.
type AgentSkill struct {
	ID        string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	AgentID   string         `gorm:"index;type:uuid;not null" json:"agent_id"`
	SkillID   string         `gorm:"index;type:uuid;not null" json:"skill_id"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (AgentSkill) TableName() string { return "agent_skills" }

// RuntimeConfig stores LM Studio connection settings (singleton row key=lmstudio).
type RuntimeConfig struct {
	ID           string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Key          string         `gorm:"uniqueIndex;type:varchar(50);not null" json:"key"`
	BaseURL      string         `gorm:"type:varchar(500);not null" json:"base_url"`
	APIKey       string         `gorm:"type:varchar(500)" json:"api_key,omitempty"`
	DefaultModel string         `gorm:"type:varchar(200)" json:"default_model"`
	TimeoutSec   int            `gorm:"not null;default:300" json:"timeout_sec"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (RuntimeConfig) TableName() string { return "runtime_config" }

const RuntimeConfigKeyLMStudio = "lmstudio"

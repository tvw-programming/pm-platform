package models

import (
	"time"

	"gorm.io/gorm"
)

// AutoFlow stages for the Phase 3 virtual-team pipeline.
const (
	AutoFlowStagePMTriage     = "pm_triage"
	AutoFlowStageRouting      = "routing"
	AutoFlowStageFEPlanning   = "fe_planning"
	AutoFlowStageFEPlanReview = "fe_plan_review"
	AutoFlowStageFECoding     = "fe_coding"
	AutoFlowStageQA           = "qa"
	AutoFlowStageDone         = "done"
	AutoFlowStageRejected     = "rejected"
	AutoFlowStageError        = "error"
)

// AutoFlowRun tracks one requirement → PM → sfd/sbd → qa pipeline.
type AutoFlowRun struct {
	ID                string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	RunID             string         `gorm:"index;not null" json:"run_id"`
	ProjectID         string         `gorm:"index;not null" json:"project_id"`
	RequirementMsgID  string         `gorm:"type:uuid" json:"requirement_msg_id,omitempty"`
	RequirementText   string         `gorm:"type:text;not null" json:"requirement_text"`
	Stage             string         `gorm:"type:varchar(40);not null;default:'pm_triage'" json:"stage"`
	RoutesJSON        string         `gorm:"type:text" json:"routes_json,omitempty"` // JSON array of role ids
	PlanID            *string        `gorm:"type:uuid" json:"plan_id,omitempty"`
	Status            string         `gorm:"type:varchar(30);not null;default:'running'" json:"status"` // running|done|rejected|error
	LastError         string         `gorm:"type:text" json:"last_error,omitempty"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
}

func (AutoFlowRun) TableName() string { return "auto_flow_runs" }

// DefaultAlumniCwd is the example/default coding workspace for Phase 3 FE edits.
const DefaultAlumniCwd = "/Users/tejasvikaswaghulde/Documents/code/1 react/Alumni-web"

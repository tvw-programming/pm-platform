package models

import (
	"time"

	"gorm.io/gorm"
)

type ChatMode string

const (
	ChatModeNormal ChatMode = "normal"
	ChatModeWork   ChatMode = "work_event"
)

type TicketKind string

const (
	TicketApproveReject TicketKind = "approve_reject"
	TicketAck          TicketKind = "ack"
	TicketActionDone   TicketKind = "action_done"
	TicketReview       TicketKind = "review"
)

type TicketStatus string

const (
	TicketStatusPending  TicketStatus = "pending"
	TicketStatusApproved TicketStatus = "approved"
	TicketStatusRejected TicketStatus = "rejected"
	TicketStatusDone     TicketStatus = "done"
	TicketStatusAcked    TicketStatus = "acked"
	TicketStatusSkipped  TicketStatus = "skipped"
)

type SkipReason string

const (
	SkipReasonRoleAbsent SkipReason = "SKIPPED_ROLE_ABSENT"
	SkipReasonNotAsked   SkipReason = "NOT_ASKED"
)

type Message struct {
	gorm.Model
	ID           string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	RunID        string    `gorm:"index;not null" json:"run_id"`
	AuthorID     string    `gorm:"not null" json:"author_id"`
	AuthorName   string    `gorm:"not null" json:"author_name"`
	AuthorRoles  string    `gorm:"type:jsonb;default:'[]'" json:"author_roles"`
	Mode         ChatMode  `gorm:"type:varchar(20);not null;default:'normal'" json:"mode"`
	EventType    string    `gorm:"type:varchar(100)" json:"event_type,omitempty"`
	PlaybookID   string    `gorm:"type:varchar(50)" json:"playbook_id,omitempty"`
	TemplateID   string    `gorm:"type:varchar(100)" json:"template_id,omitempty"`
	Body         string    `gorm:"type:text;not null" json:"body"`
	ArtifactRefs string    `gorm:"type:jsonb;default:'[]'" json:"artifact_refs"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Ticket struct {
	gorm.Model
	ID                 string       `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	RunID              string       `gorm:"index;not null" json:"run_id"`
	PlaybookInstanceID string       `gorm:"type:uuid;not null" json:"playbook_instance_id"`
	RoleID             string       `gorm:"type:varchar(50);not null" json:"role_id"`
	UserID             string       `gorm:"type:varchar(100)" json:"user_id,omitempty"`
	Kind               TicketKind   `gorm:"type:varchar(30);not null" json:"kind"`
	Status             TicketStatus `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	SkippedReason      SkipReason   `gorm:"type:varchar(30)" json:"skipped_reason,omitempty"`
	ParentMessageID    string       `gorm:"type:uuid" json:"parent_message_id"`
	Comment            string       `gorm:"type:text" json:"comment,omitempty"`
	DueBy              *time.Time   `json:"due_by,omitempty"`
	ResolvedAt         *time.Time   `json:"resolved_at,omitempty"`
	CreatedAt          time.Time    `json:"created_at"`
	UpdatedAt          time.Time    `json:"updated_at"`
}

type PlaybookInstance struct {
	gorm.Model
	ID              string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	RunID           string    `gorm:"index;not null" json:"run_id"`
	PlaybookID      string    `gorm:"type:varchar(50);not null" json:"playbook_id"`
	TriggerMsgID    string    `gorm:"type:uuid;not null" json:"trigger_message_id"`
	Status          string    `gorm:"type:varchar(20);not null;default:'open'" json:"status"`
	ResolvedRoles   string    `gorm:"type:jsonb;default:'[]'" json:"resolved_roles"`
	SkippedRoles    string    `gorm:"type:jsonb;default:'[]'" json:"skipped_roles"`
	NotAskedRoles   string    `gorm:"type:jsonb;default:'[]'" json:"not_asked_roles"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type RosterEntry struct {
	gorm.Model
	ID       string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	RunID    string `gorm:"index;not null" json:"run_id"`
	RoleID   string `gorm:"type:varchar(50);not null" json:"role_id"`
	UserID   string `gorm:"type:varchar(100);not null" json:"user_id"`
	UserName string `gorm:"type:varchar(200);not null" json:"user_name"`
	Present  bool   `gorm:"not null;default:true" json:"present"`
}

type ProjectRoleConfig struct {
	gorm.Model
	ID        string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	ProjectID string `gorm:"uniqueIndex;not null" json:"project_id"`
	EnabledRoles string `gorm:"type:jsonb;not null;default:'[]'" json:"enabled_roles"`
}

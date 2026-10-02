package services

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"pm-platform/server/internal/models"
)

// CreateTicketsFromResolution creates tickets for all must-respond roles in a playbook resolution.
func CreateTicketsFromResolution(
	db *gorm.DB,
	runID string,
	playbookInstanceID string,
	parentMessageID string,
	resolution PlaybookResolution,
	steps []PlaybookStep,
) ([]models.Ticket, error) {
	var tickets []models.Ticket

	// Build a step-index lookup: role -> ticket kind from the playbook steps.
	roleTicketKind := make(map[string]models.TicketKind)
	for _, step := range steps {
		kind := models.TicketKind(step.ResponseKind)
		for _, roleID := range step.Roles {
			roleTicketKind[roleID] = kind
		}
	}

	now := time.Now()

	for _, r := range resolution.MustRespond {
		kind, ok := roleTicketKind[r.RoleID]
		if !ok {
			// Fallback: if resolved via escalation, check the original role
			if r.ResolvedFrom != "" {
				kind = roleTicketKind[r.ResolvedFrom]
			}
			if kind == "" {
				kind = models.TicketAck
			}
		}

		dueBy := calculateSLA(kind, now)

		ticket := models.Ticket{
			ID:                 uuid.New().String(),
			RunID:              runID,
			PlaybookInstanceID: playbookInstanceID,
			RoleID:             r.RoleID,
			UserID:             r.UserID,
			Kind:               kind,
			Status:             models.TicketStatusPending,
			ParentMessageID:    parentMessageID,
			DueBy:              dueBy,
		}
		tickets = append(tickets, ticket)
	}

	// Also create skipped tickets
	for _, r := range resolution.Skipped {
		ticket := models.Ticket{
			ID:                 uuid.New().String(),
			RunID:              runID,
			PlaybookInstanceID: playbookInstanceID,
			RoleID:             r.RoleID,
			Kind:               models.TicketAck,
			Status:             models.TicketStatusSkipped,
			SkippedReason:      r.Reason,
			ParentMessageID:    parentMessageID,
		}
		tickets = append(tickets, ticket)
	}

	if len(tickets) > 0 {
		if err := db.Create(&tickets).Error; err != nil {
			return nil, fmt.Errorf("create tickets: %w", err)
		}
	}

	return tickets, nil
}

// calculateSLA returns the due date based on ticket kind.
// approve_reject / review: 1 business day; action_done: 2 business days; ack: 4 hours.
func calculateSLA(kind models.TicketKind, from time.Time) *time.Time {
	var due time.Time
	switch kind {
	case models.TicketApproveReject, models.TicketReview:
		due = addBusinessDays(from, 1)
	case models.TicketActionDone:
		due = addBusinessDays(from, 2)
	case models.TicketAck:
		due = from.Add(4 * time.Hour)
	default:
		due = addBusinessDays(from, 1)
	}
	return &due
}

func addBusinessDays(from time.Time, days int) time.Time {
	t := from
	added := 0
	for added < days {
		t = t.Add(24 * time.Hour)
		if t.Weekday() != time.Saturday && t.Weekday() != time.Sunday {
			added++
		}
	}
	return t
}

// ResolveTicket resolves a ticket with the given status and comment.
func ResolveTicket(db *gorm.DB, ticketID string, status models.TicketStatus, comment string, resolverUserID string) (*models.Ticket, error) {
	var ticket models.Ticket
	if err := db.First(&ticket, "id = ?", ticketID).Error; err != nil {
		return nil, fmt.Errorf("ticket not found: %w", err)
	}

	if ticket.Status != models.TicketStatusPending {
		return nil, fmt.Errorf("ticket already resolved with status: %s", ticket.Status)
	}

	// Validate status transition
	switch status {
	case models.TicketStatusApproved, models.TicketStatusRejected:
		if ticket.Kind != models.TicketApproveReject && ticket.Kind != models.TicketReview {
			return nil, fmt.Errorf("cannot approve/reject a %s ticket", ticket.Kind)
		}
	case models.TicketStatusAcked:
		if ticket.Kind != models.TicketAck {
			return nil, fmt.Errorf("cannot ack a %s ticket", ticket.Kind)
		}
	case models.TicketStatusDone:
		if ticket.Kind != models.TicketActionDone {
			return nil, fmt.Errorf("cannot mark done a %s ticket", ticket.Kind)
		}
	default:
		return nil, fmt.Errorf("invalid resolution status: %s", status)
	}

	// Permission check: can't resolve someone else's ticket unless you are a manager-level role.
	if ticket.UserID != "" && ticket.UserID != resolverUserID {
		// Allow manager override (checked by the handler via roster lookup)
		// For now, return an error the handler can catch.
		return nil, fmt.Errorf("cannot resolve another user's ticket without manager override")
	}

	now := time.Now()
	ticket.Status = status
	ticket.Comment = comment
	ticket.ResolvedAt = &now

	if err := db.Save(&ticket).Error; err != nil {
		return nil, fmt.Errorf("save ticket: %w", err)
	}

	// Check if all mandatory tickets for this playbook instance are resolved.
	go checkPlaybookCompletion(db, ticket.PlaybookInstanceID)

	return &ticket, nil
}

// checkPlaybookCompletion checks if all pending tickets are resolved and closes the playbook instance.
func checkPlaybookCompletion(db *gorm.DB, playbookInstanceID string) {
	var pendingCount int64
	db.Model(&models.Ticket{}).
		Where("playbook_instance_id = ? AND status = ?", playbookInstanceID, models.TicketStatusPending).
		Count(&pendingCount)

	if pendingCount == 0 {
		db.Model(&models.PlaybookInstance{}).
			Where("id = ?", playbookInstanceID).
			Update("status", "closed")
	}
}

// CreatePlaybookInstance creates a playbook instance record.
func CreatePlaybookInstance(db *gorm.DB, runID, playbookID, triggerMsgID string, resolution PlaybookResolution) (*models.PlaybookInstance, error) {
	resolvedJSON, _ := json.Marshal(resolution.MustRespond)
	skippedJSON, _ := json.Marshal(resolution.Skipped)
	notAskedJSON, _ := json.Marshal(resolution.NotAsked)

	instance := models.PlaybookInstance{
		ID:            uuid.New().String(),
		RunID:         runID,
		PlaybookID:    playbookID,
		TriggerMsgID:  triggerMsgID,
		Status:        "open",
		ResolvedRoles: string(resolvedJSON),
		SkippedRoles:  string(skippedJSON),
		NotAskedRoles: string(notAskedJSON),
	}

	if err := db.Create(&instance).Error; err != nil {
		return nil, fmt.Errorf("create playbook instance: %w", err)
	}

	return &instance, nil
}

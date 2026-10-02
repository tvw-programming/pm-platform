package handlers

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"pm-platform/server/internal/models"
	"pm-platform/server/internal/services"
	"pm-platform/server/internal/websocket"
)

type TicketHandler struct {
	DB  *gorm.DB
	Hub *websocket.Hub
}

type ResolveTicketRequest struct {
	Status     string `json:"status"`
	Comment    string `json:"comment"`
	ResolverID string `json:"resolver_id"`
}

func (h *TicketHandler) ListTickets(c *fiber.Ctx) error {
	runID := c.Params("runId")
	var tickets []models.Ticket
	if err := h.DB.Where("run_id = ?", runID).Order("created_at ASC").Find(&tickets).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(tickets)
}

func (h *TicketHandler) ResolveTicket(c *fiber.Ctx) error {
	ticketID := c.Params("ticketId")

	var req ResolveTicketRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	ticket, err := services.ResolveTicket(h.DB, ticketID, models.TicketStatus(req.Status), req.Comment, req.ResolverID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	h.Hub.Broadcast(ticket.RunID, websocket.Event{
		Type: "ticket_resolved",
		Data: ticket,
	})

	return c.JSON(ticket)
}

func (h *TicketHandler) ListPlaybookInstances(c *fiber.Ctx) error {
	runID := c.Params("runId")
	var instances []models.PlaybookInstance
	if err := h.DB.Where("run_id = ?", runID).Order("created_at ASC").Find(&instances).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(instances)
}

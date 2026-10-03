package handlers

import (
	"github.com/gofiber/fiber/v2"

	"pm-platform/server/internal/services"
)

type RuntimeHandler struct {
	Agents *services.AgentService
}

type PutLMStudioRequest struct {
	BaseURL      string `json:"base_url"`
	APIKey       string `json:"api_key"`
	DefaultModel string `json:"default_model"`
	TimeoutSec   int    `json:"timeout_sec"`
}

func (h *RuntimeHandler) GetLMStudio(c *fiber.Ctx) error {
	cfg, err := h.Agents.GetLMStudioConfig()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	health, _ := h.Agents.CheckLMStudioHealth()
	return c.JSON(fiber.Map{
		"config": cfg,
		"health": health,
	})
}

func (h *RuntimeHandler) PutLMStudio(c *fiber.Ctx) error {
	var req PutLMStudioRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	cfg, err := h.Agents.UpsertLMStudioConfig(req.BaseURL, req.APIKey, req.DefaultModel, req.TimeoutSec)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	health, _ := h.Agents.CheckLMStudioHealth()
	return c.JSON(fiber.Map{
		"config": cfg,
		"health": health,
	})
}

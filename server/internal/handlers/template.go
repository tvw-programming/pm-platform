package handlers

import (
	"github.com/gofiber/fiber/v2"

	"pm-platform/server/internal/services"
)

type TemplateHandler struct{}

func (h *TemplateHandler) GetAll(c *fiber.Ctx) error {
	catalog := services.GetTemplateCatalog()
	return c.JSON(catalog)
}

func (h *TemplateHandler) GetByRole(c *fiber.Ctx) error {
	roleID := c.Params("roleId")
	templates := services.GetTemplatesForRole(roleID)
	if templates == nil {
		return c.Status(404).JSON(fiber.Map{"error": "role not found"})
	}

	shared := services.GetSharedTemplates()
	return c.JSON(fiber.Map{
		"role":   templates,
		"shared": shared,
	})
}

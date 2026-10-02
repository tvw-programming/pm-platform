package handlers

import (
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"pm-platform/server/internal/models"
)

type RoleHandler struct {
	DB *gorm.DB
}

func (h *RoleHandler) GetCatalog(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"roles":     models.RoleCatalog,
		"min_roles": 8,
		"max_roles": 21,
	})
}

func (h *RoleHandler) GetConfig(c *fiber.Ctx) error {
	projectID := c.Params("projectId")

	var cfg models.ProjectRoleConfig
	result := h.DB.Where("project_id = ?", projectID).First(&cfg)
	if result.Error == gorm.ErrRecordNotFound {
		// Return default: all roles enabled
		allRoles := make([]string, 0, len(models.RoleCatalog))
		for _, r := range models.RoleCatalog {
			allRoles = append(allRoles, r.ID)
		}
		return c.JSON(fiber.Map{"project_id": projectID, "enabled_roles": allRoles})
	}
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
	}

	var roles []string
	json.Unmarshal([]byte(cfg.EnabledRoles), &roles)
	return c.JSON(fiber.Map{"project_id": projectID, "enabled_roles": roles})
}

type UpdateRoleConfigRequest struct {
	EnabledRoles []string `json:"enabled_roles"`
}

func (h *RoleHandler) UpdateConfig(c *fiber.Ctx) error {
	projectID := c.Params("projectId")

	var req UpdateRoleConfigRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	if len(req.EnabledRoles) < 8 || len(req.EnabledRoles) > 21 {
		return c.Status(400).JSON(fiber.Map{"error": "enabled_roles must contain 8-21 roles"})
	}

	// Validate role IDs
	catalogMap := models.RoleCatalogMap()
	for _, roleID := range req.EnabledRoles {
		if _, ok := catalogMap[roleID]; !ok {
			return c.Status(400).JSON(fiber.Map{"error": "unknown role: " + roleID})
		}
	}

	rolesJSON, _ := json.Marshal(req.EnabledRoles)

	var cfg models.ProjectRoleConfig
	result := h.DB.Where("project_id = ?", projectID).First(&cfg)
	if result.Error == gorm.ErrRecordNotFound {
		cfg = models.ProjectRoleConfig{
			ProjectID:    projectID,
			EnabledRoles: string(rolesJSON),
		}
		h.DB.Create(&cfg)
	} else {
		cfg.EnabledRoles = string(rolesJSON)
		h.DB.Save(&cfg)
	}

	return c.JSON(fiber.Map{"project_id": projectID, "enabled_roles": req.EnabledRoles})
}

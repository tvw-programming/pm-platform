package database

import (
	"log"
	"sync"

	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"pm-platform/server/internal/config"
	"pm-platform/server/internal/models"
)

var (
	db   *gorm.DB
	once sync.Once
)

func Connect(cfg *config.DatabaseConfig) *gorm.DB {
	once.Do(func() {
		var err error
		db, err = gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err != nil {
			log.Fatalf("failed to connect to database: %v", err)
		}

		if err := db.AutoMigrate(
			&models.Message{},
			&models.Ticket{},
			&models.PlaybookInstance{},
			&models.RosterEntry{},
			&models.ProjectRoleConfig{},
			&models.AgentInstance{},
			&models.AgentRun{},
			&models.Skill{},
			&models.AgentSkill{},
			&models.RuntimeConfig{},
		); err != nil {
			log.Fatalf("failed to auto-migrate: %v", err)
		}

		seedSkills(db)
		seedRuntimeConfig(db)

		log.Println("database connected and migrated")
	})
	return db
}

func Get() *gorm.DB {
	if db == nil {
		log.Fatal("database not initialized; call Connect first")
	}
	return db
}

func seedSkills(db *gorm.DB) {
	skills := []models.Skill{
		{
			Slug:        "issue-triage",
			Name:        "Issue Triage",
			Description: "Use when: stale/blocked/noisy inbox or shift-start board hygiene. Don't use when: already checked out on one named task.",
			Body: `# Issue Triage

You are triaging open sprint work for this chat run.

For each touched item, emit exactly one verdict: resume | wake-needed | reassign | unblock | escalate | close.
Include one concrete next action. Prefer a concise summary table.
Do not @-mention other agents. If ambiguous, escalate to a human via a clear recommendation.
Triage keeps the board honest so FE/BE/QA wakes remain valid.`,
		},
		{
			Slug:        "task-planning",
			Name:        "Task Planning",
			Description: "Use when: scope/break down/plan before build. Don't use when: tiny one-heartbeat change or forensic debug.",
			Body: `# Task Planning

Produce a plan with sections in order:
1. Goal
2. Context reviewed
3. Constraints / non-goals
4. Approach
5. Work breakdown (child tasks with owner specialty, AC, blockers)
6. Acceptance
7. Risks
8. Deferrals

Do not create FE/BE/QA child tasks until a human approve_reject ticket is approved.
Cite goal/epic IDs when known. End with a short handoff summary for implementers.`,
		},
	}

	for _, s := range skills {
		var existing models.Skill
		if err := db.Where("slug = ?", s.Slug).First(&existing).Error; err == gorm.ErrRecordNotFound {
			s.ID = uuid.New().String()
			if err := db.Create(&s).Error; err != nil {
				log.Printf("seed skill %s: %v", s.Slug, err)
			}
		}
	}
}

func seedRuntimeConfig(db *gorm.DB) {
	var existing models.RuntimeConfig
	if err := db.Where("key = ?", models.RuntimeConfigKeyLMStudio).First(&existing).Error; err == gorm.ErrRecordNotFound {
		cfg := models.RuntimeConfig{
			ID:           uuid.New().String(),
			Key:          models.RuntimeConfigKeyLMStudio,
			BaseURL:      "http://127.0.0.1:1234/v1",
			APIKey:       "",
			DefaultModel: "",
			TimeoutSec:   300,
		}
		if err := db.Create(&cfg).Error; err != nil {
			log.Printf("seed runtime_config: %v", err)
		}
	}
}

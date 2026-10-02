package database

import (
	"log"
	"sync"

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
		); err != nil {
			log.Fatalf("failed to auto-migrate: %v", err)
		}

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

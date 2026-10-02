package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"pm-platform/server/internal/config"
	"pm-platform/server/internal/database"
	"pm-platform/server/internal/router"
	"pm-platform/server/internal/websocket"
)

func main() {
	cfg := config.Load()

	db := database.Connect(&cfg.Database)

	hub := websocket.NewHub()

	app := router.Setup(db, cfg, hub)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("shutting down server...")
		if err := app.Shutdown(); err != nil {
			log.Fatalf("server shutdown error: %v", err)
		}
	}()

	log.Printf("server starting on :%s", cfg.Server.Port)
	if err := app.Listen(":" + cfg.Server.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

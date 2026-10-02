package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

type Event struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type client struct {
	conn  *websocket.Conn
	runID string
}

type Hub struct {
	mu      sync.RWMutex
	clients map[*client]bool
}

func NewHub() *Hub {
	return &Hub{clients: make(map[*client]bool)}
}

func (h *Hub) Broadcast(runID string, event Event) {
	data, err := json.Marshal(event)
	if err != nil {
		log.Printf("ws broadcast marshal error: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for c := range h.clients {
		if c.runID == runID {
			if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
				log.Printf("ws write error: %v", err)
			}
		}
	}
}

func (h *Hub) register(c *client) {
	h.mu.Lock()
	h.clients[c] = true
	h.mu.Unlock()
}

func (h *Hub) unregister(c *client) {
	h.mu.Lock()
	delete(h.clients, c)
	h.mu.Unlock()
}

func (h *Hub) UpgradeMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	}
}

func (h *Hub) Handler() fiber.Handler {
	return websocket.New(func(c *websocket.Conn) {
		runID := c.Params("runId")
		cl := &client{conn: c, runID: runID}
		h.register(cl)
		defer h.unregister(cl)

		for {
			_, _, err := c.ReadMessage()
			if err != nil {
				break
			}
		}
	})
}

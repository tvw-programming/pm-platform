package services

import (
	"testing"

	"pm-platform/server/internal/models"
)

func TestShouldStartAutoFlow(t *testing.T) {
	cases := []struct {
		name string
		msg  models.Message
		want bool
	}{
		{"event new_requirement", models.Message{Mode: models.ChatModeWork, EventType: "new_requirement", Body: "Add dark mode"}, true},
		{"event brd_ready", models.Message{Mode: models.ChatModeWork, EventType: "brd_ready", Body: "BRD"}, true},
		{"slash require", models.Message{Mode: models.ChatModeNormal, Body: "/require Add logout button"}, true},
		{"tag", models.Message{Mode: models.ChatModeNormal, Body: "[requirement] Fix nav"}, true},
		{"normal chat", models.Message{Mode: models.ChatModeNormal, Body: "hello team"}, false},
		{"empty", models.Message{Mode: models.ChatModeWork, EventType: "new_requirement", Body: "  "}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := ShouldStartAutoFlow(&tc.msg)
			if got != tc.want {
				t.Fatalf("got %v want %v", got, tc.want)
			}
		})
	}
}

func TestParseRoutesAndDecision(t *testing.T) {
	ok, rej := parseDecision("Approve\nCGEN_DECISION: APPROVE\nCGEN_ROUTE: sfd,sbd")
	if !ok || rej {
		t.Fatalf("expected approve")
	}
	routes := parseRoutes("CGEN_ROUTE: sfd, sbd")
	if len(routes) != 2 || routes[0] != "senior_fe" || routes[1] != "senior_be" {
		t.Fatalf("routes=%v", routes)
	}
	if NormalizeRoleID("qa") != "qa_lead" {
		t.Fatalf("qa alias")
	}
}

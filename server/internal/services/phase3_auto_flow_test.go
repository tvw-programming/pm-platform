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
		{"event new_requirement", models.Message{Mode: models.ChatModeWork, EventType: "new_requirement", Body: "Add dark mode", AuthorID: "user-1"}, true},
		{"event brd_ready", models.Message{Mode: models.ChatModeWork, EventType: "brd_ready", Body: "BRD", AuthorID: "user-1"}, true},
		{"work event any type", models.Message{Mode: models.ChatModeWork, EventType: "architecture_decision", Body: "Change nav color", AuthorID: "user-1"}, true},
		{"work event empty type", models.Message{Mode: models.ChatModeWork, Body: "Update Alumni-web theme to light blue", AuthorID: "user-1"}, true},
		{"slash require", models.Message{Mode: models.ChatModeNormal, Body: "/require Add logout button", AuthorID: "user-1"}, true},
		{"tag", models.Message{Mode: models.ChatModeNormal, Body: "[requirement] Fix nav", AuthorID: "user-1"}, true},
		{"plain UI requirement", models.Message{Mode: models.ChatModeNormal, Body: "Change the Alumni-web primary theme color to light blue", AuthorID: "user-1"}, true},
		{"project path ask", models.Message{
			Mode: models.ChatModeNormal, Body: "Project Name is - Alumni-web path /Users/tejas/Alumni-web repo url - https://github.com/x",
			AuthorID: "user-1", AuthorRoles: `["project_manager","full_stack_em"]`,
		}, true},
		{"normal chat", models.Message{Mode: models.ChatModeNormal, Body: "hello team", AuthorID: "user-1"}, false},
		{"agent author ignored", models.Message{Mode: models.ChatModeNormal, Body: "Change the theme color please", AuthorID: "agent:abc"}, false},
		{"empty", models.Message{Mode: models.ChatModeWork, EventType: "new_requirement", Body: "  ", AuthorID: "user-1"}, false},
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
	// qa at triage is ignored (woken later after coding)
	routesQA := parseRoutes("CGEN_ROUTE: sfd, qa")
	if len(routesQA) != 1 || routesQA[0] != "senior_fe" {
		t.Fatalf("routes with qa=%v", routesQA)
	}
	// missing CGEN_ROUTE → nil so hard-guarantee / hierarchy default can apply
	if parseRoutes("Approve\nCGEN_DECISION: APPROVE") != nil {
		t.Fatalf("expected nil routes without CGEN_ROUTE")
	}
	if NormalizeRoleID("qa") != "qa_lead" {
		t.Fatalf("qa alias")
	}
}

func TestStatusHelpersAndNormalize(t *testing.T) {
	start := statusStart("FE coding", []string{"Touch theme", "No extra files"})
	if start != "I am starting FE coding.\n- Touch theme\n- No extra files" {
		t.Fatalf("start=%q", start)
	}
	done := statusDone([]string{"Theme updated", "Handed to qa"})
	if done != "Completed:\n- Theme updated\n- Handed to qa" {
		t.Fatalf("done=%q", done)
	}
	if got := normalizeRequirementText("[requirement] Change theme"); got != "Change theme" {
		t.Fatalf("normalize tag=%q", got)
	}
	if got := normalizeRequirementText("/require  Add button"); got != "Add button" {
		t.Fatalf("normalize slash=%q", got)
	}
}

func TestLooksLikeBackendRequirement(t *testing.T) {
	if !looksLikeBackendRequirement("Add a new REST API endpoint for alumni") {
		t.Fatal("expected BE")
	}
	if looksLikeBackendRequirement("Change the Alumni-web primary theme color to light blue") {
		t.Fatal("UI-only should not force BE")
	}
}

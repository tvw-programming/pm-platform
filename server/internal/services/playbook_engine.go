package services

import "pm-platform/server/internal/models"

type RoleResolution struct {
	RoleID       string            `json:"role_id"`
	ResolvedFrom string            `json:"resolved_from,omitempty"`
	UserID       string            `json:"user_id,omitempty"`
	UserName     string            `json:"user_name,omitempty"`
	Kind         string            `json:"kind,omitempty"`
	Reason       models.SkipReason `json:"reason,omitempty"`
}

type PlaybookResolution struct {
	PlaybookID  string           `json:"playbook_id"`
	MustRespond []RoleResolution `json:"must_respond"`
	Skipped     []RoleResolution `json:"skipped"`
	NotAsked    []RoleResolution `json:"not_asked"`
}

type PlaybookStep struct {
	Order        int      `json:"order"`
	Action       string   `json:"action"`
	Primitive    string   `json:"primitive"`
	Roles        []string `json:"roles"`
	ResponseKind string   `json:"response_kind"`
	Description  string   `json:"description"`
}

type PlaybookVariant struct {
	Condition   string `json:"condition"`
	Description string `json:"description"`
}

type PlaybookDef struct {
	ID                string            `json:"id"`
	Name              string            `json:"name"`
	Trigger           string            `json:"trigger"`
	Description       string            `json:"description"`
	Steps             []PlaybookStep    `json:"steps"`
	NotAskedRoles     []string          `json:"not_asked,omitempty"`
	NotAskedCondition string            `json:"not_asked_condition,omitempty"`
	FollowOn          string            `json:"follow_on,omitempty"`
	EscalateDefault   []string          `json:"escalate_default,omitempty"`
	Variants          []PlaybookVariant `json:"variants,omitempty"`
}

var PlaybookCatalog = []PlaybookDef{
	{
		ID: "P01", Name: "UX / UI design updated", Trigger: "design_updated",
		Description: "Route design handoff for approval, integration, and review",
		Steps: []PlaybookStep{
			{Order: 1, Action: "approve_design", Primitive: "first_present", Roles: []string{"fe_manager", "full_stack_em", "project_manager"}, ResponseKind: "approve_reject", Description: "Approve design"},
			{Order: 2, Action: "integrate", Primitive: "first_present", Roles: []string{"junior_fe", "senior_fe"}, ResponseKind: "action_done", Description: "Integrate approved design"},
		},
		NotAskedRoles: []string{"senior_fe"}, NotAskedCondition: "for approval when junior will implement; senior reviews only after integration (P03)",
		FollowOn: "P03", EscalateDefault: []string{"project_manager", "full_stack_em", "cto"},
		Variants: []PlaybookVariant{
			{Condition: "no_junior_fe", Description: "Senior FE implements; skip P03 self-review, use fe_tech_lead or fe_manager for review"},
			{Condition: "no_fe_manager_with_pm", Description: "PM approves; junior integrates; senior still not asked until integration"},
			{Condition: "no_fe_manager_no_pm", Description: "AI PM then full_stack_em; if none, escalate CTO / chief_architect"},
		},
	},
	{
		ID: "P02", Name: "Theme / design-system / tokens changed", Trigger: "theme_updated",
		Description: "Route design system changes for approval and cross-track notification",
		Steps: []PlaybookStep{
			{Order: 1, Action: "approve", Primitive: "first_present", Roles: []string{"fe_manager", "fe_tech_lead", "project_manager"}, ResponseKind: "approve_reject", Description: "Approve theme/token changes"},
			{Order: 2, Action: "implement", Primitive: "first_present", Roles: []string{"junior_fe", "senior_fe", "rn_dev"}, ResponseKind: "action_done", Description: "Implement token changes"},
			{Order: 3, Action: "notify_mobile", Primitive: "only_if_present", Roles: []string{"mobile_tech_lead"}, ResponseKind: "ack", Description: "Cross-track notify mobile"},
			{Order: 4, Action: "notify_ui", Primitive: "only_if_present", Roles: []string{"ui_designer"}, ResponseKind: "ack", Description: "Cross-track notify UI"},
		},
		NotAskedRoles: []string{"senior_fe"}, NotAskedCondition: "for approval if junior will implement",
		FollowOn: "P03",
	},
	{
		ID: "P03", Name: "Frontend implementation completed", Trigger: "frontend_integrated",
		Description: "Route completed FE implementation for review and QA",
		Steps: []PlaybookStep{
			{Order: 1, Action: "review", Primitive: "first_present", Roles: []string{"senior_fe", "fe_tech_lead", "fe_manager"}, ResponseKind: "review", Description: "Review implementation (step up if self)"},
			{Order: 2, Action: "qa_ready", Primitive: "only_if_present", Roles: []string{"qa_lead"}, ResponseKind: "ack", Description: "QA ack that test charter can start"},
		},
	},
	{
		ID: "P04", Name: "UX research / IA / journey map", Trigger: "research_completed",
		Description: "Route research readout for stakeholder acknowledgement",
		Steps: []PlaybookStep{
			{Order: 1, Action: "approve_direction", Primitive: "first_present", Roles: []string{"project_manager", "fe_manager"}, ResponseKind: "approve_reject", Description: "Ack/approve research direction"},
			{Order: 2, Action: "design_impact", Primitive: "only_if_present", Roles: []string{"ui_designer"}, ResponseKind: "ack", Description: "Optional design-system impact ack"},
		},
	},
	{
		ID: "P05", Name: "Backend API contract changed", Trigger: "api_contract_changed",
		Description: "Route API contract changes for approval, consumer ack, and implementation",
		Steps: []PlaybookStep{
			{Order: 1, Action: "approve_contract", Primitive: "first_present", Roles: []string{"be_manager", "be_tech_lead", "full_stack_em", "solution_architect"}, ResponseKind: "approve_reject", Description: "Approve contract"},
			{Order: 2, Action: "consumer_impact", Primitive: "all_present", Roles: []string{"senior_fe", "rn_dev", "senior_be"}, ResponseKind: "ack", Description: "Consumer impact ack"},
			{Order: 3, Action: "implement", Primitive: "first_present", Roles: []string{"junior_be", "senior_be"}, ResponseKind: "action_done", Description: "Implement contract"},
		},
		NotAskedRoles: []string{"senior_be"}, NotAskedCondition: "for contract approval if be_manager/lead exists and junior will implement",
		FollowOn: "P06",
	},
	{
		ID: "P06", Name: "Backend implementation completed", Trigger: "backend_implemented",
		Description: "Route completed BE implementation for review and QA",
		Steps: []PlaybookStep{
			{Order: 1, Action: "review", Primitive: "first_present", Roles: []string{"senior_be", "be_tech_lead", "be_manager"}, ResponseKind: "review", Description: "Review implementation (step up if self)"},
			{Order: 2, Action: "qa", Primitive: "first_present", Roles: []string{"qa_lead"}, ResponseKind: "ack", Description: "Contract test / QA ack"},
		},
	},
	{
		ID: "P07", Name: "Full-stack feature slice completed", Trigger: "fullstack_slice_done",
		Description: "Route completed full-stack slice for review, QA, and product ack",
		Steps: []PlaybookStep{
			{Order: 1, Action: "review", Primitive: "all_present", Roles: []string{"full_stack_em", "fe_tech_lead", "be_tech_lead"}, ResponseKind: "review", Description: "Review full-stack slice"},
			{Order: 2, Action: "qa", Primitive: "first_present", Roles: []string{"qa_lead"}, ResponseKind: "ack", Description: "QA ack"},
			{Order: 3, Action: "product_ack", Primitive: "only_if_present", Roles: []string{"project_manager"}, ResponseKind: "ack", Description: "Product acknowledgement"},
		},
	},
	{
		ID: "P08", Name: "Mobile change", Trigger: "mobile_build_done",
		Description: "Route mobile build for review and QA",
		Steps: []PlaybookStep{
			{Order: 1, Action: "review", Primitive: "first_present", Roles: []string{"mobile_tech_lead", "mobile_em"}, ResponseKind: "review", Description: "Review mobile build"},
			{Order: 2, Action: "qa", Primitive: "only_if_present", Roles: []string{"qa_lead"}, ResponseKind: "ack", Description: "QA ack"},
		},
	},
	{
		ID: "P09", Name: "QA test cycle / sign-off", Trigger: "qa_cycle_started",
		Description: "Route QA cycle for execution and exit approval",
		Steps: []PlaybookStep{
			{Order: 1, Action: "execute", Primitive: "first_present", Roles: []string{"qa_lead"}, ResponseKind: "action_done", Description: "Execute test cycle"},
			{Order: 2, Action: "approve_exit", Primitive: "first_present", Roles: []string{"qa_lead", "project_manager"}, ResponseKind: "approve_reject", Description: "Approve QA exit"},
		},
	},
	{
		ID: "P10", Name: "Defect found", Trigger: "defect_logged",
		Description: "Route defect for triage, fix, and verification",
		Steps: []PlaybookStep{
			{Order: 1, Action: "triage", Primitive: "first_present", Roles: []string{"qa_lead", "project_manager"}, ResponseKind: "action_done", Description: "Triage defect"},
			{Order: 2, Action: "fix", Primitive: "first_present", Roles: []string{"junior_fe", "junior_be", "senior_fe", "senior_be"}, ResponseKind: "action_done", Description: "Fix defect (track-based)"},
			{Order: 3, Action: "verify", Primitive: "first_present", Roles: []string{"qa_lead"}, ResponseKind: "approve_reject", Description: "Verify fix"},
		},
	},
	{
		ID: "P11", Name: "Database schema / migration", Trigger: "schema_change_proposed",
		Description: "Route schema changes for approval, implementation, and review",
		Steps: []PlaybookStep{
			{Order: 1, Action: "approve", Primitive: "first_present", Roles: []string{"be_tech_lead", "solution_architect"}, ResponseKind: "approve_reject", Description: "Approve schema change"},
			{Order: 2, Action: "implement", Primitive: "first_present", Roles: []string{"senior_be", "junior_be"}, ResponseKind: "action_done", Description: "Implement migration"},
			{Order: 3, Action: "review", Primitive: "first_present", Roles: []string{"be_tech_lead", "be_manager"}, ResponseKind: "review", Description: "Review migration"},
		},
		NotAskedRoles: []string{"senior_fe", "junior_fe", "fe_manager", "fe_tech_lead", "ux_designer", "ui_designer"},
	},
	{
		ID: "P12", Name: "Architecture / ADR", Trigger: "adr_proposed",
		Description: "Route ADR for review and decision",
		Steps: []PlaybookStep{
			{Order: 1, Action: "review", Primitive: "all_present", Roles: []string{"chief_architect", "solution_architect", "fe_tech_lead", "be_tech_lead"}, ResponseKind: "review", Description: "Review ADR"},
			{Order: 2, Action: "decide", Primitive: "first_present", Roles: []string{"chief_architect", "cto", "solution_architect"}, ResponseKind: "approve_reject", Description: "Decide on ADR"},
		},
		Variants: []PlaybookVariant{
			{Condition: "no_architects", Description: "full_stack_em then project_manager (provisional, flagged for later architect)"},
		},
	},
	{
		ID: "P13", Name: "Security finding", Trigger: "security_finding",
		Description: "Route security finding for triage, fix, and re-test",
		Steps: []PlaybookStep{
			{Order: 1, Action: "triage", Primitive: "require_one_of", Roles: []string{"appsec"}, ResponseKind: "action_done", Description: "Triage finding"},
			{Order: 2, Action: "fix", Primitive: "first_present", Roles: []string{"senior_fe", "senior_be"}, ResponseKind: "action_done", Description: "Fix (track senior, not junior unless appsec allows)"},
			{Order: 3, Action: "retest", Primitive: "first_present", Roles: []string{"appsec"}, ResponseKind: "approve_reject", Description: "Re-test"},
		},
		NotAskedRoles: []string{"ux_designer", "ui_designer"},
		EscalateDefault: []string{"full_stack_em", "cto"},
	},
	{
		ID: "P14", Name: "Performance / load issue", Trigger: "perf_regression",
		Description: "Route performance issue for confirmation, fix, and sign-off",
		Steps: []PlaybookStep{
			{Order: 1, Action: "confirm", Primitive: "first_present", Roles: []string{"qa_lead", "devops"}, ResponseKind: "ack", Description: "Confirm regression"},
			{Order: 2, Action: "fix", Primitive: "first_present", Roles: []string{"senior_be", "devops", "senior_fe"}, ResponseKind: "action_done", Description: "Own fix"},
			{Order: 3, Action: "signoff", Primitive: "first_present", Roles: []string{"qa_lead"}, ResponseKind: "approve_reject", Description: "Sign-off"},
		},
	},
	{
		ID: "P15", Name: "Infra / cloud / CI change", Trigger: "infra_change",
		Description: "Route infrastructure changes for approval and review",
		Steps: []PlaybookStep{
			{Order: 1, Action: "approve", Primitive: "first_present", Roles: []string{"devops", "full_stack_em"}, ResponseKind: "approve_reject", Description: "Approve infra change"},
			{Order: 2, Action: "implement", Primitive: "first_present", Roles: []string{"devops"}, ResponseKind: "action_done", Description: "Implement change"},
			{Order: 3, Action: "review", Primitive: "only_if_present", Roles: []string{"appsec"}, ResponseKind: "review", Description: "Security review"},
		},
	},
	{
		ID: "P16", Name: "Release candidate", Trigger: "release_requested",
		Description: "Route release for product go, QA exit, security, merge, and execute",
		Steps: []PlaybookStep{
			{Order: 1, Action: "product_go", Primitive: "first_present", Roles: []string{"project_manager"}, ResponseKind: "approve_reject", Description: "Product go/no-go"},
			{Order: 2, Action: "qa_exit", Primitive: "first_present", Roles: []string{"qa_lead"}, ResponseKind: "approve_reject", Description: "QA exit"},
			{Order: 3, Action: "security", Primitive: "only_if_present", Roles: []string{"appsec"}, ResponseKind: "approve_reject", Description: "Security sign-off"},
			{Order: 4, Action: "merge", Primitive: "first_present", Roles: []string{"senior_fe", "senior_be", "fe_tech_lead", "be_tech_lead"}, ResponseKind: "approve_reject", Description: "Merge approval"},
			{Order: 5, Action: "release", Primitive: "first_present", Roles: []string{"devops"}, ResponseKind: "action_done", Description: "Execute release"},
		},
	},
	{
		ID: "P17", Name: "Production incident", Trigger: "incident_opened",
		Description: "Route production incident for command, fix, and comms",
		Steps: []PlaybookStep{
			{Order: 1, Action: "command", Primitive: "first_present", Roles: []string{"devops", "full_stack_em"}, ResponseKind: "action_done", Description: "Incident command"},
			{Order: 2, Action: "fix", Primitive: "first_present", Roles: []string{"senior_be", "senior_fe", "devops"}, ResponseKind: "action_done", Description: "Fix (track senior)"},
			{Order: 3, Action: "comms", Primitive: "first_present", Roles: []string{"project_manager"}, ResponseKind: "action_done", Description: "Comms"},
		},
	},
	{
		ID: "P18", Name: "Data / ML / AI change", Trigger: "pipeline_changed",
		Description: "Route data/AI changes for product, review, implement, and QA",
		Steps: []PlaybookStep{
			{Order: 1, Action: "product", Primitive: "first_present", Roles: []string{"project_manager"}, ResponseKind: "approve_reject", Description: "Product review"},
			{Order: 2, Action: "review", Primitive: "first_present", Roles: []string{"senior_be"}, ResponseKind: "review", Description: "Engineering review"},
			{Order: 3, Action: "implement", Primitive: "first_present", Roles: []string{"senior_be", "junior_be"}, ResponseKind: "action_done", Description: "Implement"},
			{Order: 4, Action: "qa", Primitive: "only_if_present", Roles: []string{"qa_lead"}, ResponseKind: "ack", Description: "QA ack"},
		},
	},
	{
		ID: "P19", Name: "Requirements / BRD ready (gate 06)", Trigger: "brd_ready",
		Description: "Route BRD for mandatory product approval (binds to gate 06)",
		Steps: []PlaybookStep{
			{Order: 1, Action: "mandatory_approve", Primitive: "first_present", Roles: []string{"project_manager"}, ResponseKind: "approve_reject", Description: "Mandatory product approval"},
			{Order: 2, Action: "escalate", Primitive: "first_present", Roles: []string{"full_stack_em"}, ResponseKind: "approve_reject", Description: "Escalate to EM"},
			{Order: 3, Action: "optional_review", Primitive: "only_if_present", Roles: []string{"solution_architect", "ux_designer", "qa_lead"}, ResponseKind: "ack", Description: "Optional reviewers"},
		},
	},
	{
		ID: "P20", Name: "PR ready to merge (gate 24)", Trigger: "pr_ready",
		Description: "Route PR for mandatory tech review (binds to gate 24)",
		Steps: []PlaybookStep{
			{Order: 1, Action: "mandatory_review", Primitive: "first_present", Roles: []string{"fe_tech_lead", "be_tech_lead", "senior_fe", "senior_be"}, ResponseKind: "approve_reject", Description: "Mandatory tech review"},
			{Order: 2, Action: "escalate", Primitive: "first_present", Roles: []string{"full_stack_em"}, ResponseKind: "approve_reject", Description: "Escalate to EM"},
			{Order: 3, Action: "security_opt", Primitive: "only_if_present", Roles: []string{"appsec"}, ResponseKind: "ack", Description: "Optional security"},
			{Order: 4, Action: "qa_opt", Primitive: "only_if_present", Roles: []string{"qa_lead"}, ResponseKind: "ack", Description: "Optional QA"},
		},
	},
	{
		ID: "P21", Name: "Ambiguity / clarify (step 03)", Trigger: "clarify_needed",
		Description: "Route clarification questions to product",
		Steps: []PlaybookStep{
			{Order: 1, Action: "answer", Primitive: "first_present", Roles: []string{"project_manager"}, ResponseKind: "action_done", Description: "Answer questions"},
			{Order: 2, Action: "ux_input", Primitive: "only_if_present", Roles: []string{"ux_designer"}, ResponseKind: "ack", Description: "Optional UX input for UX questions"},
			{Order: 3, Action: "tech_input", Primitive: "only_if_present", Roles: []string{"fe_tech_lead", "be_tech_lead"}, ResponseKind: "ack", Description: "Optional tech lead input"},
		},
	},
	{
		ID: "P22", Name: "Sprint ceremony / impediment", Trigger: "impediment",
		Description: "Route impediment for facilitation and scope decision",
		Steps: []PlaybookStep{
			{Order: 1, Action: "facilitate", Primitive: "first_present", Roles: []string{"project_manager"}, ResponseKind: "action_done", Description: "Facilitate"},
			{Order: 2, Action: "decide_scope", Primitive: "all_present", Roles: []string{"project_manager", "full_stack_em"}, ResponseKind: "approve_reject", Description: "Decide scope (if both exist)"},
		},
	},
	{
		ID: "P23", Name: "New requirement (auto virtual team)", Trigger: "new_requirement",
		Description: "Phase 3 auto flow: wake PM to Approve/Reject, then auto-route sfd/sbd and later qa — no manual Assign/Run",
		Steps: []PlaybookStep{
			{Order: 1, Action: "pm_triage", Primitive: "first_present", Roles: []string{"project_manager"}, ResponseKind: "approve_reject", Description: "PM Approve/Reject requirement"},
			{Order: 2, Action: "fe_plan", Primitive: "only_if_present", Roles: []string{"senior_fe"}, ResponseKind: "action_done", Description: "sfd plans and implements (auto-woken)"},
			{Order: 3, Action: "be_plan", Primitive: "only_if_present", Roles: []string{"senior_be"}, ResponseKind: "ack", Description: "sbd plans when routed (auto-woken)"},
			{Order: 4, Action: "qa_verify", Primitive: "only_if_present", Roles: []string{"qa_lead"}, ResponseKind: "review", Description: "qa pass/fail after code update"},
		},
		EscalateDefault: []string{"project_manager", "cto"},
	},
}

func PlaybookCatalogMap() map[string]PlaybookDef {
	m := make(map[string]PlaybookDef, len(PlaybookCatalog))
	for _, p := range PlaybookCatalog {
		m[p.ID] = p
	}
	return m
}

func FindPlaybookByTrigger(trigger string) *PlaybookDef {
	for i := range PlaybookCatalog {
		if PlaybookCatalog[i].Trigger == trigger {
			return &PlaybookCatalog[i]
		}
	}
	return nil
}

type EventType struct {
	ID         string `json:"id"`
	Label      string `json:"label"`
	PlaybookID string `json:"playbook_id"`
}

func ListEventTypes() []EventType {
	types := make([]EventType, 0, len(PlaybookCatalog))
	for _, p := range PlaybookCatalog {
		types = append(types, EventType{
			ID:         p.Trigger,
			Label:      p.Name,
			PlaybookID: p.ID,
		})
	}
	return types
}

func rosterMap(roster []models.RosterEntry) map[string]models.RosterEntry {
	m := make(map[string]models.RosterEntry, len(roster))
	for _, r := range roster {
		if r.Present {
			m[r.RoleID] = r
		}
	}
	return m
}

func firstPresent(roles []string, rm map[string]models.RosterEntry) *RoleResolution {
	for _, roleID := range roles {
		if entry, ok := rm[roleID]; ok {
			return &RoleResolution{RoleID: roleID, UserID: entry.UserID, UserName: entry.UserName}
		}
	}
	return nil
}

func allPresent(roles []string, rm map[string]models.RosterEntry) (resolved []RoleResolution, skipped []RoleResolution) {
	for _, roleID := range roles {
		if entry, ok := rm[roleID]; ok {
			resolved = append(resolved, RoleResolution{RoleID: roleID, UserID: entry.UserID, UserName: entry.UserName})
		} else {
			skipped = append(skipped, RoleResolution{RoleID: roleID, Reason: models.SkipReasonRoleAbsent})
		}
	}
	return
}

func onlyIfPresent(roleID string, rm map[string]models.RosterEntry) *RoleResolution {
	if entry, ok := rm[roleID]; ok {
		return &RoleResolution{RoleID: roleID, UserID: entry.UserID, UserName: entry.UserName}
	}
	return nil
}

func requireOneOf(roles []string, rm map[string]models.RosterEntry) *RoleResolution {
	for _, roleID := range roles {
		if entry, ok := rm[roleID]; ok {
			return &RoleResolution{RoleID: roleID, UserID: entry.UserID, UserName: entry.UserName}
		}
	}
	catalog := models.RoleCatalogMap()
	for _, roleID := range roles {
		if def, ok := catalog[roleID]; ok {
			for _, fb := range def.DefaultFallback {
				if entry, fbOK := rm[fb]; fbOK {
					return &RoleResolution{RoleID: fb, ResolvedFrom: roleID, UserID: entry.UserID, UserName: entry.UserName}
				}
			}
		}
	}
	return nil
}

func escalateDefault(rm map[string]models.RosterEntry) *RoleResolution {
	return firstPresent([]string{"project_manager", "full_stack_em", "cto"}, rm)
}

func ResolvePlaybook(playbookID string, roster []models.RosterEntry, implementerUserID string) PlaybookResolution {
	pm := PlaybookCatalogMap()
	pb, ok := pm[playbookID]
	if !ok {
		return PlaybookResolution{PlaybookID: playbookID}
	}

	rm := rosterMap(roster)
	res := PlaybookResolution{PlaybookID: playbookID}

	notAskedSet := make(map[string]bool)
	for _, r := range pb.NotAskedRoles {
		notAskedSet[r] = true
		res.NotAsked = append(res.NotAsked, RoleResolution{RoleID: r, Reason: models.SkipReasonNotAsked})
	}

	for _, step := range pb.Steps {
		switch step.Primitive {
		case "first_present":
			if r := firstPresent(step.Roles, rm); r != nil {
				r.Kind = step.ResponseKind
				res.MustRespond = append(res.MustRespond, *r)
			} else {
				esc := pb.EscalateDefault
				if len(esc) == 0 {
					esc = []string{"project_manager", "full_stack_em", "cto"}
				}
				if e := firstPresent(esc, rm); e != nil {
					e.ResolvedFrom = step.Roles[0]
					e.Kind = step.ResponseKind
					res.MustRespond = append(res.MustRespond, *e)
				} else {
					for _, roleID := range step.Roles {
						if !notAskedSet[roleID] {
							res.Skipped = append(res.Skipped, RoleResolution{RoleID: roleID, Reason: models.SkipReasonRoleAbsent})
						}
					}
				}
			}

		case "all_present":
			resolved, skipped := allPresent(step.Roles, rm)
			for i := range resolved {
				resolved[i].Kind = step.ResponseKind
			}
			res.MustRespond = append(res.MustRespond, resolved...)
			res.Skipped = append(res.Skipped, skipped...)

		case "only_if_present":
			for _, roleID := range step.Roles {
				if r := onlyIfPresent(roleID, rm); r != nil {
					r.Kind = step.ResponseKind
					res.MustRespond = append(res.MustRespond, *r)
				} else {
					res.Skipped = append(res.Skipped, RoleResolution{RoleID: roleID, Reason: models.SkipReasonRoleAbsent})
				}
			}

		case "require_one_of":
			if r := requireOneOf(step.Roles, rm); r != nil {
				r.Kind = step.ResponseKind
				res.MustRespond = append(res.MustRespond, *r)
			} else {
				esc := pb.EscalateDefault
				if len(esc) == 0 {
					esc = []string{"project_manager", "full_stack_em", "cto"}
				}
				if e := firstPresent(esc, rm); e != nil {
					e.ResolvedFrom = step.Roles[0]
					e.Kind = step.ResponseKind
					res.MustRespond = append(res.MustRespond, *e)
				} else {
					for _, roleID := range step.Roles {
						res.Skipped = append(res.Skipped, RoleResolution{RoleID: roleID, Reason: models.SkipReasonRoleAbsent})
					}
				}
			}

		case "not_asked":
			for _, roleID := range step.Roles {
				if !notAskedSet[roleID] {
					notAskedSet[roleID] = true
					res.NotAsked = append(res.NotAsked, RoleResolution{RoleID: roleID, Reason: models.SkipReasonNotAsked})
				}
			}
		}
	}

	// Self-review ban
	if implementerUserID != "" && len(res.MustRespond) > 0 {
		allSameUser := true
		for _, r := range res.MustRespond {
			if r.UserID != implementerUserID {
				allSameUser = false
				break
			}
		}
		if allSameUser {
			if esc := escalateDefault(rm); esc != nil && esc.UserID != implementerUserID {
				esc.Kind = "review"
				res.MustRespond = append(res.MustRespond, *esc)
			}
		}
	}

	if res.MustRespond == nil {
		res.MustRespond = []RoleResolution{}
	}
	if res.Skipped == nil {
		res.Skipped = []RoleResolution{}
	}
	if res.NotAsked == nil {
		res.NotAsked = []RoleResolution{}
	}

	return res
}

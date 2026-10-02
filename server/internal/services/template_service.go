package services

type RoleTemplates struct {
	RoleID  string   `json:"role_id"`
	Duties  []string `json:"duties"`
	Status  []string `json:"status"`
	Ask     []string `json:"ask"`
	Respond []string `json:"respond"`
}

type SharedTemplates struct {
	Normal    []string `json:"normal"`
	WorkEvent []string `json:"work_event"`
}

type TemplateCatalog struct {
	RoleTemplates   []RoleTemplates `json:"role_templates"`
	SharedTemplates SharedTemplates `json:"shared_templates"`
}

var sharedTemplates = SharedTemplates{
	Normal: []string{
		"Quick question on {feature}.",
		"FYI only — no response required.",
		"Thanks — that unblocks me.",
		"Out of office; {person} covers.",
	},
	WorkEvent: []string{
		"Work event: {feature}.",
		"Reassigning ticket to {role}.",
		"Overriding skip — {role} must respond.",
	},
}

var roleTemplatesCatalog = []RoleTemplates{
	{RoleID: "cto", Duties: []string{"Set engineering strategy and multi-year platform bets.", "Approve irreversible technology or vendor decisions.", "Resolve cross-org priority conflicts when managers disagree.", "Sponsor security, reliability, and cost guardrails.", "Review architecture only when it changes company risk.", "Communicate engineering status to the business."}, Status: []string{"Strategy decision recorded for {feature}.", "Vendor / build choice approved.", "Escalation accepted; I will decide by {date}.", "This is not a CTO decision — returning to EM.", "Org-level risk accepted for {risk}."}, Ask: []string{"Need exec decision on {risk}.", "Pause work pending architecture review."}, Respond: []string{"Approved at exec level.", "Rejected — does not match strategy.", "Delegating to {role}."}},
	{RoleID: "chief_architect", Duties: []string{"Define target architecture and NFRs.", "Own ADRs and cross-domain boundaries.", "Review designs that span more than one system.", "Guard against local optimizations that break the platform.", "Mentor solution architects and tech leads.", "Track technical debt that needs a program, not a ticket."}, Status: []string{"ADR-{n} drafted for {feature}.", "Architecture review completed.", "NFR set: {metric}.", "Boundary change required between {svc-a} and {svc-b}.", "Provisional architecture — pending CTO."}, Ask: []string{"Need solution architect impact analysis.", "Tech leads: confirm this ADR is implementable."}, Respond: []string{"Architecture approved.", "Changes requested on {section}.", "Out of scope for this ADR."}},
	{RoleID: "project_manager", Duties: []string{"Own scope, timeline, and stakeholder communication.", "Prioritize the backlog with engineering and design.", "Approve work when the track manager is absent (fallback).", "Track dependencies and risks across squads.", "Accept or reject scope changes in sprint.", "Ensure BRD / story clarity before build.", "Report status to leadership."}, Status: []string{"Priority set: {feature} is P{n}.", "Scope change accepted.", "Scope change rejected — park in backlog.", "BRD approved from product side.", "Dependency on {role} called out.", "Date at risk; need recovery plan.", "Stakeholder update sent."}, Ask: []string{"Need effort from {role} on {feature}.", "Please approve design in FE manager's absence.", "Clarify acceptance criteria for {ticket}."}, Respond: []string{"Approved as product fallback.", "Rejected — missing AC / users.", "Acknowledged; tracking in plan."}},
	{RoleID: "solution_architect", Duties: []string{"Turn ADRs into service-level designs.", "Choose integration patterns and data flows.", "Estimate complexity and sequencing of slices.", "Review API contracts for system fit.", "Document sequence diagrams for the run.", "Align build with enterprise constraints."}, Status: []string{"Solution design posted for {feature}.", "Integration pattern: {api}.", "Sequence diagram updated.", "Contract review completed.", "Cannot meet NFR without {feature}."}, Ask: []string{"BE lead: confirm contract.", "Security: review trust boundary."}, Respond: []string{"Solution approved.", "Revise interface {api}.", "Need chief architect input."}},
	{RoleID: "fe_manager", Duties: []string{"Own FE delivery quality and staffing.", "Approve UX/UI handoff when present.", "Decide FE vs postpone vs spike.", "Unblock juniors and leads.", "Accept FE capacity for the sprint.", "Escalate cross-team UI issues."}, Status: []string{"FE capacity confirmed for {feature}.", "Design approved for implementation.", "Design rejected — see comments.", "Assigning integration to junior FE.", "Senior FE will implement (no junior on roster).", "FE risk: {risk}."}, Ask: []string{"UX: attach states for empty/error/loading.", "Junior FE: integrate on {branch}."}, Respond: []string{"Approved for FE build.", "Rejected — not implementable as drawn.", "Reassigned to {person}."}},
	{RoleID: "be_manager", Duties: []string{"Own BE delivery, reliability, and API quality.", "Approve contract changes when present.", "Balance feature vs debt vs incidents.", "Staff junior/senior BE work.", "Align with DBA and platform."}, Status: []string{"API change approved.", "API change rejected.", "BE slice scheduled.", "Assigning implementation to junior BE.", "Needs schema playbook (P11)."}, Ask: []string{"Architect: confirm boundary.", "FE: ack breaking change {api}."}, Respond: []string{"Approved.", "Rejected — breaking without version.", "Defer to next sprint."}},
	{RoleID: "full_stack_em", Duties: []string{"Cover FE+BE when specialist managers are absent.", "Sequence end-to-end slices.", "Be the default engineering escalation.", "Map to today's engineering_manager gate role."}, Status: []string{"E2E slice approved.", "Acting as FE manager fallback.", "Acting as BE manager fallback.", "Escalation accepted.", "Staffing gap: no {role} on this run."}, Ask: []string{"Need both FE and BE estimates.", "PM: confirm MVP cut."}, Respond: []string{"Approved as EM.", "Rejected.", "Splitting into FE and BE tickets."}},
	{RoleID: "mobile_em", Duties: []string{"Own iOS/Android/RN delivery.", "Approve mobile design/build when present.", "Decide native vs RN.", "Align store release with release manager."}, Status: []string{"Mobile scope confirmed.", "Native required for {feature}.", "RN sufficient.", "Store release window: {date}."}, Ask: []string{"Mobile lead: pick platform owner.", "QA: device matrix please."}, Respond: []string{"Approved.", "Rejected — platform gap.", "Out of scope (no mobile roster)."}},
	{RoleID: "fe_tech_lead", Duties: []string{"Set FE standards, folders, and review bar.", "Review implementation when manager asked them to.", "Unblock juniors technically.", "Do not auto-own design approval if FE manager exists."}, Status: []string{"FE approach agreed.", "Review comments posted on {branch}.", "Spike result: {feature}.", "Not the design approver — FE manager owns that."}, Ask: []string{"Junior: add storybook for {component}.", "Senior: take review; I implemented."}, Respond: []string{"Implementation approved.", "Request changes.", "Acknowledged."}},
	{RoleID: "be_tech_lead", Duties: []string{"Own BE patterns, errors, and versioning.", "Review contracts if manager absent.", "Review implementation after junior/senior complete."}, Status: []string{"Contract v{n} accepted.", "Need versioning for {api}.", "Review done on {branch}."}, Ask: []string{"Junior BE: add consumer tests.", "DBA: migration plan."}, Respond: []string{"Approved.", "Changes requested.", "Security must see this."}},
	{RoleID: "mobile_tech_lead", Duties: []string{"Own mobile architecture and store constraints.", "Review junior mobile work.", "Fallback for mobile manager."}, Status: []string{"Platform approach: {feature}.", "Review complete.", "Offline / permission edge covered."}, Ask: []string{"Junior: implement screen {screen}."}, Respond: []string{"Approved.", "Changes requested.", "Needs design fallback."}},
	{RoleID: "senior_fe", Duties: []string{"Implement complex UI, performance, a11y.", "Review junior FE integration (P03).", "Raise when the design is not buildable.", "Mentor juniors."}, Status: []string{"Complex UI done on {branch}.", "A11y pass done for {screen}.", "Reviewing junior integration.", "Implementation approved.", "Implementation changes requested.", "I am implementer — requesting lead review."}, Ask: []string{"Junior: integrate latest design.", "UX: breakpoint behavior for {screen}?"}, Respond: []string{"Approved — matches design intent in code.", "Request changes — {issue}.", "Not assigned to design approval."}},
	{RoleID: "junior_fe", Duties: []string{"Integrate approved designs.", "Build standard components with senior support.", "Write basic tests and storybook.", "Ask early; do not silently skip states."}, Status: []string{"Layout update integrated.", "Theme changes integrated.", "Design integrated on {branch}.", "Empty/error/loading states added.", "Blocked on missing spec for {feature}.", "Ready for senior FE review."}, Ask: []string{"Need senior review of {branch}.", "UX: hover state missing."}, Respond: []string{"Started integration.", "Integration done.", "Cannot implement — missing asset."}},
	{RoleID: "senior_be", Duties: []string{"Design and review APIs, data, and failure modes.", "Review junior BE work (P06).", "Not default contract approver if BE manager/lead exists."}, Status: []string{"API {api} implemented.", "Idempotency added.", "Reviewing junior BE work.", "Implementation approved.", "I implemented — requesting lead review."}, Ask: []string{"Junior: add pagination to {api}.", "FE: confirm error codes."}, Respond: []string{"Approved.", "Request changes.", "Needs DBA."}},
	{RoleID: "junior_be", Duties: []string{"Implement approved contracts.", "Add tests and logs.", "Flag uncertainty on data or security."}, Status: []string{"Endpoint {api} implemented.", "Tests added.", "Ready for senior BE review.", "Blocked on schema approval."}, Ask: []string{"Need contract clarification.", "Need senior review."}, Respond: []string{"Implementation done.", "Cannot start — contract not approved."}},
	{RoleID: "rn_dev", Duties: []string{"Share UI across iOS/Android when RN is in scope.", "Call out native-module gaps.", "Fallback implementer if native juniors absent."}, Status: []string{"RN screen {screen} done.", "Needs native module for {capability}.", "Parity checked iOS/Android."}, Ask: []string{"Mobile lead: native or JS?", "Need review."}, Respond: []string{"Done.", "Blocked on native."}},
	{RoleID: "devops", Duties: []string{"CI/CD, environments, observability basics.", "Execute releases if no release manager.", "Review infra when cloud engineer implements."}, Status: []string{"Pipeline updated.", "{env} deploy succeeded.", "{env} deploy failed — {reason}.", "Rollback completed.", "CI gate added."}, Ask: []string{"Need cloud review of IAM.", "Need release window."}, Respond: []string{"Infra approved.", "Hold deploy.", "Deployed."}},
	{RoleID: "ux_designer", Duties: []string{"Conduct user research to uncover needs and pain points.", "Define personas and key scenarios for target users.", "Map user journeys and core workflows end-to-end.", "Create information architecture and user flows.", "Design wireframes and interactive prototypes.", "Plan and run usability tests.", "Iterate designs based on feedback.", "Maintain a design system with UI.", "Collaborate with PMs and engineers.", "Monitor post-launch metrics."}, Status: []string{"User research completed for {feature}.", "Personas updated.", "Journey map completed.", "IA / user flow updated.", "Wireframes ready for review.", "Prototype ready for usability test.", "Usability test completed — themes posted.", "Layout update completed.", "Theme changes completed.", "Design iterated from feedback.", "Handoff pack attached.", "Post-launch UX issue logged."}, Ask: []string{"FE manager (or PM): please approve design.", "Junior FE: integrate after approval.", "PM: priority for this flow?", "UI: tokens for this layout?"}, Respond: []string{"Updated design after reject.", "Acknowledged engineering constraint.", "Cannot change — validated in research."}},
	{RoleID: "ui_designer", Duties: []string{"Specify visual design, type, color, spacing, and states.", "Own component appearance in the design system.", "Produce redlines and asset export.", "Ensure brand and dark/light themes.", "Partner with UX on layout; with FE on tokens."}, Status: []string{"Visual design completed for {screen}.", "Theme changes completed.", "Tokens updated.", "Component spec posted.", "Assets exported.", "Dark mode variants added.", "Icon set updated."}, Ask: []string{"UX: confirm layout before visual lock.", "FE: confirm token names.", "FE manager: approve visual."}, Respond: []string{"Visual updated.", "Acknowledged — brand constraint."}},
	{RoleID: "qa_lead", Duties: []string{"Write charters, assign cases, triage defects.", "Approve cycle exit if manager absent.", "Decide automation vs manual."}, Status: []string{"Test charter posted.", "Cycle started.", "Cycle blocked.", "Sign-off recommended.", "Defect {ticket} severity {n}."}, Ask: []string{"QA: execute charter.", "Dev: fix {ticket}.", "PM: accept known issue?"}, Respond: []string{"Triage: assign to {role}.", "Verified fix.", "Reopened."}},
	{RoleID: "appsec", Duties: []string{"Threat-model features and review authz.", "Triage SAST/DAST/dep findings.", "Approve waivers only with expiry and owner.", "Ban secrets in artifacts."}, Status: []string{"Threat model posted.", "Finding {id} confirmed.", "Finding dismissed — false positive.", "Waiver granted until {date}.", "Waiver denied.", "Re-test passed."}, Ask: []string{"Need fix from {role}.", "Need EM escalation."}, Respond: []string{"Approved.", "Rejected.", "More info required."}},
}

func GetTemplateCatalog() TemplateCatalog {
	return TemplateCatalog{
		RoleTemplates:   roleTemplatesCatalog,
		SharedTemplates: sharedTemplates,
	}
}

func GetTemplatesForRole(roleID string) *RoleTemplates {
	for i := range roleTemplatesCatalog {
		if roleTemplatesCatalog[i].RoleID == roleID {
			return &roleTemplatesCatalog[i]
		}
	}
	return nil
}

func GetSharedTemplates() SharedTemplates {
	return sharedTemplates
}

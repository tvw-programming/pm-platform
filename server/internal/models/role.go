package models

type Seniority string

const (
	SeniorityJunior  Seniority = "junior"
	SeniorityMid     Seniority = "mid"
	SenioritySenior  Seniority = "senior"
	SeniorityLead    Seniority = "lead"
	SeniorityManager Seniority = "manager"
	SeniorityExec    Seniority = "exec"
)

type Track string

const (
	TrackFrontend   Track = "frontend"
	TrackBackend    Track = "backend"
	TrackMobile     Track = "mobile"
	TrackPlatform   Track = "platform"
	TrackData       Track = "data"
	TrackDesign     Track = "design"
	TrackQA         Track = "qa"
	TrackSecurity   Track = "security"
	TrackProduct    Track = "product"
	TrackLeadership Track = "leadership"
)

type RoleDef struct {
	ID              string   `json:"id"`
	Label           string   `json:"label"`
	Seniority       string   `json:"seniority"`
	Track           string   `json:"track"`
	Optional        bool     `json:"optional"`
	DefaultFallback []string `json:"default_fallback"`
}

var RoleCatalog = []RoleDef{
	{ID: "cto", Label: "Chief Technology Officer", Seniority: "exec", Track: "leadership", Optional: true, DefaultFallback: []string{"chief_architect"}},
	{ID: "chief_architect", Label: "Chief / Principal Architect", Seniority: "exec", Track: "leadership", Optional: true, DefaultFallback: []string{"solution_architect", "cto"}},
	{ID: "project_manager", Label: "Project Manager", Seniority: "manager", Track: "product", Optional: false, DefaultFallback: []string{"ai_product_manager", "full_stack_em"}},
	{ID: "solution_architect", Label: "Solution Architect", Seniority: "lead", Track: "leadership", Optional: true, DefaultFallback: []string{"chief_architect", "cto"}},
	{ID: "fe_manager", Label: "Front End Manager", Seniority: "manager", Track: "frontend", Optional: true, DefaultFallback: []string{"full_stack_em", "fe_tech_lead", "project_manager"}},
	{ID: "be_manager", Label: "Back End Manager", Seniority: "manager", Track: "backend", Optional: true, DefaultFallback: []string{"full_stack_em", "be_tech_lead", "project_manager"}},
	{ID: "full_stack_em", Label: "Full Stack Engineering Manager", Seniority: "manager", Track: "platform", Optional: true, DefaultFallback: []string{"fe_manager", "be_manager", "project_manager"}},
	{ID: "mobile_em", Label: "Mobile Engineering Manager", Seniority: "manager", Track: "mobile", Optional: true, DefaultFallback: []string{"mobile_tech_lead", "full_stack_em", "project_manager"}},
	{ID: "fe_tech_lead", Label: "Front End Tech Lead", Seniority: "lead", Track: "frontend", Optional: true, DefaultFallback: []string{"fe_manager", "senior_fe"}},
	{ID: "be_tech_lead", Label: "Back End Tech Lead", Seniority: "lead", Track: "backend", Optional: true, DefaultFallback: []string{"be_manager", "senior_be"}},
	{ID: "mobile_tech_lead", Label: "Mobile Tech Lead", Seniority: "lead", Track: "mobile", Optional: true, DefaultFallback: []string{"mobile_em", "rn_dev"}},
	{ID: "senior_fe", Label: "Senior Frontend Developer", Seniority: "senior", Track: "frontend", Optional: false, DefaultFallback: []string{"fe_tech_lead", "fe_manager"}},
	{ID: "junior_fe", Label: "Junior Frontend Developer", Seniority: "junior", Track: "frontend", Optional: true, DefaultFallback: []string{"senior_fe"}},
	{ID: "senior_be", Label: "Senior Backend Developer", Seniority: "senior", Track: "backend", Optional: false, DefaultFallback: []string{"be_tech_lead", "be_manager"}},
	{ID: "junior_be", Label: "Junior Backend Developer", Seniority: "junior", Track: "backend", Optional: true, DefaultFallback: []string{"senior_be"}},
	{ID: "rn_dev", Label: "React Native Developer", Seniority: "mid", Track: "mobile", Optional: true, DefaultFallback: []string{"mobile_tech_lead", "senior_fe"}},
	{ID: "devops", Label: "DevOps Engineer", Seniority: "mid", Track: "platform", Optional: true, DefaultFallback: []string{"release_manager"}},
	{ID: "ux_designer", Label: "UX Designer", Seniority: "mid", Track: "design", Optional: true, DefaultFallback: []string{"ui_designer", "project_manager"}},
	{ID: "ui_designer", Label: "UI Designer", Seniority: "mid", Track: "design", Optional: true, DefaultFallback: []string{"ux_designer"}},
	{ID: "qa_lead", Label: "QA Lead / Test Lead", Seniority: "lead", Track: "qa", Optional: true, DefaultFallback: []string{"senior_qa", "project_manager"}},
	{ID: "appsec", Label: "Application Security Engineer", Seniority: "senior", Track: "security", Optional: true, DefaultFallback: []string{"full_stack_em", "cto"}},
}

func RoleCatalogMap() map[string]RoleDef {
	m := make(map[string]RoleDef, len(RoleCatalog))
	for _, r := range RoleCatalog {
		m[r.ID] = r
	}
	return m
}

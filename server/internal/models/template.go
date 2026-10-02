package models

type TemplateCategory string

const (
	TemplateDuties   TemplateCategory = "duties"
	TemplateStatus   TemplateCategory = "status"
	TemplateAsk      TemplateCategory = "ask"
	TemplateRespond  TemplateCategory = "respond"
)

type RoleTemplate struct {
	RoleID   string           `json:"role_id"`
	Category TemplateCategory `json:"category"`
	Text     string           `json:"text"`
}

type SharedTemplate struct {
	ID       string `json:"id"`
	Category string `json:"category"`
	Text     string `json:"text"`
}

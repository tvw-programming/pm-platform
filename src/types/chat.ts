export type ChatMode = 'normal' | 'work_event';

export type TicketKind = 'approve_reject' | 'ack' | 'action_done' | 'review';
export type TicketStatus = 'pending' | 'approved' | 'rejected' | 'done' | 'acked' | 'skipped';
export type SkipReason = 'SKIPPED_ROLE_ABSENT' | 'NOT_ASKED';

export interface ChatMessage {
  id: string;
  run_id: string;
  author_id: string;
  author_name: string;
  author_roles: string[];
  mode: ChatMode;
  event_type?: string;
  playbook_id?: string;
  template_id?: string;
  body: string;
  artifact_refs: string[];
  agent_id?: string;
  agent_run_id?: string;
  created_at: string;
  updated_at: string;
}

export type AgentStatus = 'active' | 'paused' | 'terminated';
export type AgentRunStatus = 'running' | 'succeeded' | 'failed';

export interface AgentInstance {
  id: string;
  project_id: string;
  name: string;
  role_id: string;
  status: AgentStatus;
  instructions: string;
  model?: string;
  reports_to_agent_id?: string;
  token_budget?: number;
  tokens_used: number;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: string;
  agent_id: string;
  run_id: string;
  wake_reason: string;
  status: AgentRunStatus;
  input_ref?: string;
  output_message_id?: string;
  prompt_tokens: number;
  completion_tokens: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  slug: string;
  name: string;
  description: string;
  body: string;
}

export interface LMStudioConfig {
  id: string;
  key: string;
  base_url: string;
  api_key?: string;
  default_model: string;
  timeout_sec: number;
}

export interface LMStudioHealth {
  ok: boolean;
  base_url?: string;
  models?: unknown[];
  count?: number;
  error?: string;
}

export interface ChatTicket {
  id: string;
  run_id: string;
  playbook_instance_id: string;
  role_id: string;
  user_id?: string;
  kind: TicketKind;
  status: TicketStatus;
  skipped_reason?: SkipReason;
  parent_message_id: string;
  comment?: string;
  due_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface RoleResolution {
  role_id: string;
  resolved_from?: string;
  user_id?: string;
  user_name?: string;
  kind?: string;
  reason?: SkipReason;
}

export interface PlaybookResolution {
  playbook_id: string;
  must_respond: RoleResolution[];
  skipped: RoleResolution[];
  not_asked: RoleResolution[];
}

export interface PlaybookStep {
  order: number;
  action: string;
  primitive: string;
  roles: string[];
  response_kind: string;
  description: string;
}

export interface PlaybookDef {
  id: string;
  name: string;
  trigger: string;
  description: string;
  steps: PlaybookStep[];
  not_asked?: string[];
  not_asked_condition?: string;
  follow_on?: string;
  escalate_default?: string[];
}

export interface EventType {
  id: string;
  label: string;
  playbook_id: string;
}

export interface RosterEntry {
  id: string;
  run_id: string;
  role_id: string;
  user_id: string;
  user_name: string;
  agent_id?: string | null;
  present: boolean;
  role_label?: string;
  track?: string;
  seniority?: string;
}

export interface RoleDef {
  id: string;
  label: string;
  seniority: string;
  track: string;
  optional: boolean;
  default_fallback: string[];
}

export interface RoleTemplates {
  role_id: string;
  duties: string[];
  status: string[];
  ask: string[];
  respond: string[];
}

export interface SharedTemplates {
  normal: string[];
  work_event: string[];
}

export interface TemplateCatalog {
  role_templates: RoleTemplates[];
  shared_templates: SharedTemplates;
}

export interface PlaybookInstance {
  id: string;
  run_id: string;
  playbook_id: string;
  trigger_message_id: string;
  status: string;
  resolved_roles: string;
  skipped_roles: string;
  not_asked_roles: string;
  created_at: string;
}

import type {
  ChatMessage,
  ChatTicket,
  RosterEntry,
  RoleDef,
  TemplateCatalog,
  PlaybookDef,
  EventType,
  PlaybookResolution,
  PlaybookInstance,
  RoleTemplates,
  SharedTemplates,
  AgentInstance,
  AgentRun,
  Skill,
  LMStudioConfig,
  LMStudioHealth,
} from '@/types/chat';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5589';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ─── Messages ───

export function listMessages(runId: string): Promise<ChatMessage[]> {
  return request(`/api/chat/messages/${runId}`);
}

export function createMessage(data: {
  run_id: string;
  author_id: string;
  author_name: string;
  author_roles: string[];
  mode: string;
  event_type?: string;
  template_id?: string;
  body: string;
  artifact_refs?: string[];
}): Promise<{ message: ChatMessage; playbook_instance?: PlaybookInstance; tickets?: ChatTicket[]; resolution?: PlaybookResolution }> {
  return request('/api/chat/messages', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Tickets ───

export function listTickets(runId: string): Promise<ChatTicket[]> {
  return request(`/api/chat/tickets/${runId}`);
}

export function resolveTicket(ticketId: string, data: { status: string; comment: string; resolver_id: string }): Promise<ChatTicket> {
  return request(`/api/chat/tickets/${ticketId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function listPlaybookInstances(runId: string): Promise<PlaybookInstance[]> {
  return request(`/api/chat/playbook-instances/${runId}`);
}

// ─── Roster ───

export function getRoster(runId: string): Promise<RosterEntry[]> {
  return request(`/api/roster/${runId}`);
}

export function setRoster(runId: string, entries: {
  role_id: string;
  user_id?: string;
  user_name?: string;
  agent_id?: string | null;
  present: boolean;
}[]): Promise<RosterEntry[]> {
  return request(`/api/roster/${runId}`, { method: 'POST', body: JSON.stringify({ entries }) });
}

// ─── Agents ───

export function listAgents(projectId = 'project-default'): Promise<AgentInstance[]> {
  return request(`/api/agents?project_id=${encodeURIComponent(projectId)}`);
}

export function hireAgent(data: {
  project_id?: string;
  name: string;
  role_id: string;
  instructions?: string;
  model?: string;
  reports_to_agent_id?: string;
  token_budget?: number;
  seat_run_id?: string;
  skill_slugs?: string[];
}): Promise<{ agent: AgentInstance; roster_entry: RosterEntry }> {
  return request('/api/agents', { method: 'POST', body: JSON.stringify(data) });
}

export function getAgent(id: string): Promise<{ agent: AgentInstance; skills: Skill[] }> {
  return request(`/api/agents/${id}`);
}

export function patchAgent(id: string, data: {
  name?: string;
  instructions?: string;
  model?: string;
  status?: string;
  reports_to_agent_id?: string;
  token_budget?: number;
  seat_run_id?: string;
}): Promise<AgentInstance> {
  return request(`/api/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function createAgentRun(id: string, data: {
  run_id: string;
  wake_reason?: string;
  input?: string;
}): Promise<{ agent_run: AgentRun; message?: ChatMessage; error?: string }> {
  return request(`/api/agents/${id}/runs`, { method: 'POST', body: JSON.stringify(data) });
}

export function listAgentRuns(id: string): Promise<AgentRun[]> {
  return request(`/api/agents/${id}/runs`);
}

export function listSkills(): Promise<Skill[]> {
  return request('/api/skills');
}

// ─── Runtime / LM Studio ───

export function getLMStudio(): Promise<{ config: LMStudioConfig; health: LMStudioHealth }> {
  return request('/api/runtime/lmstudio');
}

export function putLMStudio(data: {
  base_url: string;
  api_key?: string;
  default_model?: string;
  timeout_sec?: number;
}): Promise<{ config: LMStudioConfig; health: LMStudioHealth }> {
  return request('/api/runtime/lmstudio', { method: 'PUT', body: JSON.stringify(data) });
}

export function removeRosterRole(runId: string, roleId: string): Promise<void> {
  return request(`/api/roster/${runId}/${roleId}`, { method: 'DELETE' });
}

// ─── Roles ───

export function getRoleCatalog(): Promise<{ roles: RoleDef[]; min_roles: number; max_roles: number }> {
  return request('/api/roles/catalog');
}

export function getRoleConfig(projectId: string): Promise<{ project_id: string; enabled_roles: string[] }> {
  return request(`/api/roles/config/${projectId}`);
}

export function updateRoleConfig(projectId: string, enabledRoles: string[]): Promise<{ project_id: string; enabled_roles: string[] }> {
  return request(`/api/roles/config/${projectId}`, { method: 'PUT', body: JSON.stringify({ enabled_roles: enabledRoles }) });
}

// ─── Templates ───

export function getTemplateCatalog(): Promise<TemplateCatalog> {
  return request('/api/templates/');
}

export function getTemplatesForRole(roleId: string): Promise<{ role: RoleTemplates; shared: SharedTemplates; role_templates?: RoleTemplates[] }> {
  return request(`/api/templates/${roleId}`);
}

// ─── Playbooks ───

export function listPlaybooks(): Promise<{ playbooks: PlaybookDef[]; event_types: EventType[] }> {
  return request('/api/playbooks/');
}

export function getPlaybook(playbookId: string): Promise<PlaybookDef> {
  return request(`/api/playbooks/${playbookId}`);
}

export function previewPlaybook(data: { run_id: string; event_type: string; author_id: string }): Promise<{ playbook: PlaybookDef; resolution: PlaybookResolution }> {
  return request('/api/playbooks/preview', { method: 'POST', body: JSON.stringify(data) });
}

// ─── WebSocket ───

export function connectWebSocket(runId: string, onMessage: (event: { type: string; data: unknown }) => void): WebSocket {
  const wsBase = API_BASE.replace(/^http/, 'ws');
  const ws = new WebSocket(`${wsBase}/ws/${runId}`);
  ws.onmessage = (e) => {
    try {
      const parsed = JSON.parse(e.data);
      onMessage(parsed);
    } catch {
      // ignore parse errors
    }
  };
  return ws;
}

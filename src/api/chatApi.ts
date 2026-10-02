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
} from '@/types/chat';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

export function setRoster(runId: string, entries: { role_id: string; user_id: string; user_name: string; present: boolean }[]): Promise<RosterEntry[]> {
  return request(`/api/roster/${runId}`, { method: 'POST', body: JSON.stringify({ entries }) });
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

export function getTemplatesForRole(roleId: string): Promise<{ role: RoleTemplates; shared: SharedTemplates }> {
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

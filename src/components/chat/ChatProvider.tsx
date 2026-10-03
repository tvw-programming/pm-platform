import { createContext, useContext, useCallback, useEffect, useReducer, useRef, type ReactNode } from 'react';
import type {
  ChatMessage,
  ChatTicket,
  RosterEntry,
  PlaybookInstance,
  EventType,
  PlaybookResolution,
  AgentInstance,
  AgentRun,
} from '@/types/chat';
import * as api from '@/api/chatApi';

interface ChatState {
  messages: ChatMessage[];
  tickets: ChatTicket[];
  roster: RosterEntry[];
  playbookInstances: PlaybookInstance[];
  eventTypes: EventType[];
  agents: AgentInstance[];
  runningAgentRuns: Record<string, AgentRun>;
  loading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_TICKETS'; payload: ChatTicket[] }
  | { type: 'UPDATE_TICKET'; payload: ChatTicket }
  | { type: 'ADD_TICKETS'; payload: ChatTicket[] }
  | { type: 'SET_ROSTER'; payload: RosterEntry[] }
  | { type: 'SET_PLAYBOOK_INSTANCES'; payload: PlaybookInstance[] }
  | { type: 'ADD_PLAYBOOK_INSTANCE'; payload: PlaybookInstance }
  | { type: 'SET_EVENT_TYPES'; payload: EventType[] }
  | { type: 'SET_AGENTS'; payload: AgentInstance[] }
  | { type: 'UPSERT_AGENT'; payload: AgentInstance }
  | { type: 'AGENT_RUN_STARTED'; payload: AgentRun }
  | { type: 'AGENT_RUN_FINISHED'; payload: AgentRun };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_MESSAGES': return { ...state, messages: action.payload };
    case 'ADD_MESSAGE': {
      if (state.messages.some(m => m.id === action.payload.id)) return state;
      return { ...state, messages: [...state.messages, action.payload] };
    }
    case 'SET_TICKETS': return { ...state, tickets: action.payload };
    case 'UPDATE_TICKET': return { ...state, tickets: state.tickets.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'ADD_TICKETS': return { ...state, tickets: [...state.tickets, ...action.payload] };
    case 'SET_ROSTER': return { ...state, roster: action.payload };
    case 'SET_PLAYBOOK_INSTANCES': return { ...state, playbookInstances: action.payload };
    case 'ADD_PLAYBOOK_INSTANCE': return { ...state, playbookInstances: [...state.playbookInstances, action.payload] };
    case 'SET_EVENT_TYPES': return { ...state, eventTypes: action.payload };
    case 'SET_AGENTS': return { ...state, agents: action.payload };
    case 'UPSERT_AGENT': {
      const idx = state.agents.findIndex(a => a.id === action.payload.id);
      if (idx === -1) return { ...state, agents: [...state.agents, action.payload] };
      const next = [...state.agents];
      next[idx] = action.payload;
      return { ...state, agents: next };
    }
    case 'AGENT_RUN_STARTED': {
      return {
        ...state,
        runningAgentRuns: { ...state.runningAgentRuns, [action.payload.id]: action.payload },
      };
    }
    case 'AGENT_RUN_FINISHED': {
      const { [action.payload.id]: _, ...rest } = state.runningAgentRuns;
      return { ...state, runningAgentRuns: rest };
    }
    default: return state;
  }
}

const initialState: ChatState = {
  messages: [],
  tickets: [],
  roster: [],
  playbookInstances: [],
  eventTypes: [],
  agents: [],
  runningAgentRuns: {},
  loading: false,
  error: null,
};

interface ChatContextValue {
  state: ChatState;
  sendMessage: (data: { mode: string; event_type?: string; template_id?: string; body: string }) => Promise<void>;
  resolveTicket: (ticketId: string, status: string, comment: string) => Promise<void>;
  updateRoster: (entries: { role_id: string; user_id?: string; user_name?: string; agent_id?: string | null; present: boolean }[]) => Promise<void>;
  removeRosterRole: (roleId: string) => Promise<void>;
  previewPlaybook: (eventType: string) => Promise<{ playbook: unknown; resolution: PlaybookResolution } | null>;
  refreshMessages: () => Promise<void>;
  hireAgent: (data: { name: string; role_id: string; instructions?: string; model?: string }) => Promise<AgentInstance>;
  patchAgent: (id: string, data: { status?: string; instructions?: string; model?: string; name?: string }) => Promise<AgentInstance>;
  assignAndRun: (agentId: string, input: string, wakeReason?: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface ChatProviderProps {
  runId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRoles: string[];
  projectId?: string;
  children: ReactNode;
}

export function ChatProvider({
  runId,
  currentUserId,
  currentUserName,
  currentUserRoles,
  projectId = 'project-default',
  children,
}: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);

  const loadData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [messages, tickets, roster, instances, playbooksData, agents] = await Promise.all([
        api.listMessages(runId),
        api.listTickets(runId),
        api.getRoster(runId),
        api.listPlaybookInstances(runId),
        api.listPlaybooks(),
        api.listAgents(projectId),
      ]);
      dispatch({ type: 'SET_MESSAGES', payload: messages || [] });
      dispatch({ type: 'SET_TICKETS', payload: tickets || [] });
      dispatch({ type: 'SET_ROSTER', payload: roster || [] });
      dispatch({ type: 'SET_PLAYBOOK_INSTANCES', payload: instances || [] });
      dispatch({ type: 'SET_EVENT_TYPES', payload: playbooksData.event_types || [] });
      dispatch({ type: 'SET_AGENTS', payload: agents || [] });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to load chat data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [runId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const ws = api.connectWebSocket(runId, (event) => {
      if (event.type === 'new_message') {
        const data = event.data as { message: ChatMessage; tickets?: ChatTicket[]; playbook_instance?: PlaybookInstance };
        if (data.message) dispatch({ type: 'ADD_MESSAGE', payload: data.message });
        if (data.tickets) dispatch({ type: 'ADD_TICKETS', payload: data.tickets });
        if (data.playbook_instance) dispatch({ type: 'ADD_PLAYBOOK_INSTANCE', payload: data.playbook_instance });
      } else if (event.type === 'ticket_resolved') {
        dispatch({ type: 'UPDATE_TICKET', payload: event.data as ChatTicket });
      } else if (event.type === 'roster_updated') {
        api.getRoster(runId).then(r => dispatch({ type: 'SET_ROSTER', payload: r || [] }));
      } else if (event.type === 'agent_run_started') {
        const data = event.data as { agent_run: AgentRun; agent?: AgentInstance };
        if (data.agent_run) dispatch({ type: 'AGENT_RUN_STARTED', payload: data.agent_run });
        if (data.agent) dispatch({ type: 'UPSERT_AGENT', payload: data.agent });
      } else if (event.type === 'agent_run_finished') {
        const data = event.data as { agent_run: AgentRun; agent?: AgentInstance };
        if (data.agent_run) dispatch({ type: 'AGENT_RUN_FINISHED', payload: data.agent_run });
        if (data.agent) dispatch({ type: 'UPSERT_AGENT', payload: data.agent });
        api.listAgents(projectId).then(a => dispatch({ type: 'SET_AGENTS', payload: a || [] }));
      }
    });
    wsRef.current = ws;
    return () => { ws.close(); };
  }, [runId, projectId]);

  const sendMessage = useCallback(async (data: { mode: string; event_type?: string; template_id?: string; body: string }) => {
    const result = await api.createMessage({
      run_id: runId,
      author_id: currentUserId,
      author_name: currentUserName,
      author_roles: currentUserRoles,
      ...data,
    });
    dispatch({ type: 'ADD_MESSAGE', payload: result.message });
    if (result.tickets) dispatch({ type: 'ADD_TICKETS', payload: result.tickets });
    if (result.playbook_instance) dispatch({ type: 'ADD_PLAYBOOK_INSTANCE', payload: result.playbook_instance });
  }, [runId, currentUserId, currentUserName, currentUserRoles]);

  const resolveTicketFn = useCallback(async (ticketId: string, status: string, comment: string) => {
    const ticket = await api.resolveTicket(ticketId, { status, comment, resolver_id: currentUserId });
    dispatch({ type: 'UPDATE_TICKET', payload: ticket });
  }, [currentUserId]);

  const updateRoster = useCallback(async (entries: { role_id: string; user_id?: string; user_name?: string; agent_id?: string | null; present: boolean }[]) => {
    const roster = await api.setRoster(runId, entries);
    dispatch({ type: 'SET_ROSTER', payload: roster || [] });
  }, [runId]);

  const removeRosterRoleFn = useCallback(async (roleId: string) => {
    await api.removeRosterRole(runId, roleId);
    dispatch({ type: 'SET_ROSTER', payload: state.roster.filter(r => r.role_id !== roleId) });
  }, [runId, state.roster]);

  const previewPlaybookFn = useCallback(async (eventType: string) => {
    try {
      return await api.previewPlaybook({ run_id: runId, event_type: eventType, author_id: currentUserId });
    } catch { return null; }
  }, [runId, currentUserId]);

  const hireAgentFn = useCallback(async (data: { name: string; role_id: string; instructions?: string; model?: string }) => {
    const result = await api.hireAgent({
      ...data,
      project_id: projectId,
      seat_run_id: runId,
    });
    dispatch({ type: 'UPSERT_AGENT', payload: result.agent });
    const roster = await api.getRoster(runId);
    dispatch({ type: 'SET_ROSTER', payload: roster || [] });
    return result.agent;
  }, [projectId, runId]);

  const patchAgentFn = useCallback(async (id: string, data: { status?: string; instructions?: string; model?: string; name?: string }) => {
    const agent = await api.patchAgent(id, data);
    dispatch({ type: 'UPSERT_AGENT', payload: agent });
    return agent;
  }, []);

  const assignAndRunFn = useCallback(async (agentId: string, input: string, wakeReason = 'manual_assign') => {
    const result = await api.createAgentRun(agentId, {
      run_id: runId,
      wake_reason: wakeReason,
      input,
    });
    if (result.agent_run) {
      if (result.agent_run.status === 'running') {
        dispatch({ type: 'AGENT_RUN_STARTED', payload: result.agent_run });
      } else {
        dispatch({ type: 'AGENT_RUN_FINISHED', payload: result.agent_run });
      }
    }
    if (result.message) dispatch({ type: 'ADD_MESSAGE', payload: result.message });
    // Reload messages to pick up system banners created server-side
    const messages = await api.listMessages(runId);
    dispatch({ type: 'SET_MESSAGES', payload: messages || [] });
    const agents = await api.listAgents(projectId);
    dispatch({ type: 'SET_AGENTS', payload: agents || [] });
    if (result.error && result.agent_run?.status === 'failed') {
      throw new Error(result.error);
    }
  }, [runId, projectId]);

  const value: ChatContextValue = {
    state,
    sendMessage,
    resolveTicket: resolveTicketFn,
    updateRoster,
    removeRosterRole: removeRosterRoleFn,
    previewPlaybook: previewPlaybookFn,
    refreshMessages: loadData,
    hireAgent: hireAgentFn,
    patchAgent: patchAgentFn,
    assignAndRun: assignAndRunFn,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
}

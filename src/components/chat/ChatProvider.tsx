import { createContext, useContext, useCallback, useEffect, useReducer, useRef, type ReactNode } from 'react';
import type { ChatMessage, ChatTicket, RosterEntry, PlaybookInstance, EventType, PlaybookResolution } from '@/types/chat';
import * as api from '@/api/chatApi';

interface ChatState {
  messages: ChatMessage[];
  tickets: ChatTicket[];
  roster: RosterEntry[];
  playbookInstances: PlaybookInstance[];
  eventTypes: EventType[];
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
  | { type: 'SET_EVENT_TYPES'; payload: EventType[] };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_MESSAGES': return { ...state, messages: action.payload };
    case 'ADD_MESSAGE': return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_TICKETS': return { ...state, tickets: action.payload };
    case 'UPDATE_TICKET': return { ...state, tickets: state.tickets.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'ADD_TICKETS': return { ...state, tickets: [...state.tickets, ...action.payload] };
    case 'SET_ROSTER': return { ...state, roster: action.payload };
    case 'SET_PLAYBOOK_INSTANCES': return { ...state, playbookInstances: action.payload };
    case 'ADD_PLAYBOOK_INSTANCE': return { ...state, playbookInstances: [...state.playbookInstances, action.payload] };
    case 'SET_EVENT_TYPES': return { ...state, eventTypes: action.payload };
    default: return state;
  }
}

const initialState: ChatState = {
  messages: [],
  tickets: [],
  roster: [],
  playbookInstances: [],
  eventTypes: [],
  loading: false,
  error: null,
};

interface ChatContextValue {
  state: ChatState;
  sendMessage: (data: { mode: string; event_type?: string; template_id?: string; body: string }) => Promise<void>;
  resolveTicket: (ticketId: string, status: string, comment: string) => Promise<void>;
  updateRoster: (entries: { role_id: string; user_id: string; user_name: string; present: boolean }[]) => Promise<void>;
  removeRosterRole: (roleId: string) => Promise<void>;
  previewPlaybook: (eventType: string) => Promise<{ playbook: unknown; resolution: PlaybookResolution } | null>;
  refreshMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface ChatProviderProps {
  runId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRoles: string[];
  children: ReactNode;
}

export function ChatProvider({ runId, currentUserId, currentUserName, currentUserRoles, children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);

  const loadData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [messages, tickets, roster, instances, playbooksData] = await Promise.all([
        api.listMessages(runId),
        api.listTickets(runId),
        api.getRoster(runId),
        api.listPlaybookInstances(runId),
        api.listPlaybooks(),
      ]);
      dispatch({ type: 'SET_MESSAGES', payload: messages || [] });
      dispatch({ type: 'SET_TICKETS', payload: tickets || [] });
      dispatch({ type: 'SET_ROSTER', payload: roster || [] });
      dispatch({ type: 'SET_PLAYBOOK_INSTANCES', payload: instances || [] });
      dispatch({ type: 'SET_EVENT_TYPES', payload: playbooksData.event_types || [] });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to load chat data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [runId]);

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
      }
    });
    wsRef.current = ws;
    return () => { ws.close(); };
  }, [runId]);

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

  const updateRoster = useCallback(async (entries: { role_id: string; user_id: string; user_name: string; present: boolean }[]) => {
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

  const value: ChatContextValue = {
    state,
    sendMessage,
    resolveTicket: resolveTicketFn,
    updateRoster,
    removeRosterRole: removeRosterRoleFn,
    previewPlaybook: previewPlaybookFn,
    refreshMessages: loadData,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
}

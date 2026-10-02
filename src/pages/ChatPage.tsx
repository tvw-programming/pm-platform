import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Users, BookOpen } from 'lucide-react';
import { ChatProvider, useChat } from '@/components/chat/ChatProvider';
import { MessageList } from '@/components/chat/MessageList';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { RosterPanel } from '@/components/chat/RosterPanel';
import { RoleCardDrawer } from '@/components/chat/RoleCardDrawer';
import { ChatFilters, type ChatFilter } from '@/components/chat/ChatFilters';
import { PlaybookTracker } from '@/components/chat/PlaybookTracker';

const CURRENT_USER_ID = 'user-1';
const CURRENT_USER_NAME = 'Tejas Waghulde';
const CURRENT_USER_ROLES = ['project_manager', 'full_stack_em'];
const DEFAULT_RUN_ID = 'run-default';

function ChatInner() {
  const { state, sendMessage, resolveTicket, updateRoster, removeRosterRole, previewPlaybook } = useChat();
  const [rosterOpen, setRosterOpen] = useState(false);
  const [sideTab, setSideTab] = useState<'roster' | 'playbooks'>('roster');
  const [filter, setFilter] = useState<ChatFilter>('all');
  const [roleCard, setRoleCard] = useState<{ open: boolean; roleId: string | null; roleName?: string }>({ open: false, roleId: null });

  const mandatoryTickets = useMemo(() =>
    state.tickets.filter(t => t.user_id === CURRENT_USER_ID && t.status === 'pending'),
    [state.tickets]
  );

  const filteredMessages = useMemo(() => {
    switch (filter) {
      case 'mentions':
        return state.messages.filter(m => m.body.includes(`@${CURRENT_USER_NAME}`) || m.body.includes(`@${CURRENT_USER_ID}`));
      case 'mandatory': {
        const mandatoryMsgIds = new Set(mandatoryTickets.map(t => t.parent_message_id));
        return state.messages.filter(m => mandatoryMsgIds.has(m.id));
      }
      case 'playbooks':
        return state.messages.filter(m => m.mode === 'work_event');
      default:
        return state.messages;
    }
  }, [state.messages, filter, mandatoryTickets]);

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Run Chat</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={() => { setRosterOpen(!rosterOpen || sideTab !== 'playbooks'); setSideTab('playbooks'); }} sx={{ color: rosterOpen && sideTab === 'playbooks' ? 'primary.main' : 'text.secondary' }}>
              <BookOpen size={18} />
            </IconButton>
            <IconButton size="small" onClick={() => { setRosterOpen(!rosterOpen || sideTab !== 'roster'); setSideTab('roster'); }} sx={{ color: rosterOpen && sideTab === 'roster' ? 'primary.main' : 'text.secondary' }}>
              <Users size={18} />
            </IconButton>
          </Box>
        </Box>

        <ChatFilters
          value={filter}
          onChange={setFilter}
          mandatoryCount={mandatoryTickets.length}
          playbookCount={state.playbookInstances.filter(p => p.status === 'open').length}
        />

        <MessageList
          messages={filteredMessages}
          tickets={state.tickets}
          loading={state.loading}
          currentUserId={CURRENT_USER_ID}
          onResolveTicket={resolveTicket}
        />

        <MessageComposer
          eventTypes={state.eventTypes}
          authorRoles={CURRENT_USER_ROLES}
          onSend={sendMessage}
          onPreview={previewPlaybook}
        />
      </Box>

      <Drawer
        anchor="right"
        variant="persistent"
        open={rosterOpen}
        PaperProps={{ sx: { width: 300, position: 'relative', borderLeft: '1px solid', borderColor: 'divider' } }}
        sx={{ '& .MuiDrawer-paper': { position: 'relative' } }}
      >
        <Tabs value={sideTab} onChange={(_, v) => setSideTab(v)} sx={{ minHeight: 36, borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: '0.75rem', textTransform: 'none' } }}>
          <Tab value="roster" label="Roster" />
          <Tab value="playbooks" label="Playbooks" />
        </Tabs>
        {sideTab === 'roster' ? (
          <RosterPanel
            roster={state.roster}
            onUpdateRoster={updateRoster}
            onRemoveRole={removeRosterRole}
          />
        ) : (
          <PlaybookTracker instances={state.playbookInstances} />
        )}
      </Drawer>

      <RoleCardDrawer
        open={roleCard.open}
        onClose={() => setRoleCard({ open: false, roleId: null })}
        roleId={roleCard.roleId}
        roleName={roleCard.roleName}
      />
    </Box>
  );
}

export function ChatPage() {
  return (
    <ChatProvider
      runId={DEFAULT_RUN_ID}
      currentUserId={CURRENT_USER_ID}
      currentUserName={CURRENT_USER_NAME}
      currentUserRoles={CURRENT_USER_ROLES}
    >
      <ChatInner />
    </ChatProvider>
  );
}

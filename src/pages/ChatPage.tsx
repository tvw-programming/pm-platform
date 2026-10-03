import { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Drawer from '@mui/material/Drawer';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Users, BookOpen, Trash2 } from 'lucide-react';
import { ChatProvider, useChat } from '@/components/chat/ChatProvider';
import { MessageList } from '@/components/chat/MessageList';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { RosterPanel } from '@/components/chat/RosterPanel';
import { RoleCardDrawer } from '@/components/chat/RoleCardDrawer';
import { ChatFilters, type ChatFilter } from '@/components/chat/ChatFilters';
import { PlaybookTracker } from '@/components/chat/PlaybookTracker';
import type { AgentInstance, ApprovedChildTask } from '@/types/chat';
import type { Task } from '@/types/domain';
import { useWorkspaceDispatch } from '@/state/WorkspaceProvider';

const CURRENT_USER_ID = 'user-1';
const CURRENT_USER_NAME = 'Tejas Waghulde';
const CURRENT_USER_ROLES = ['project_manager', 'full_stack_em'];
const DEFAULT_RUN_ID = 'run-default';
const DEFAULT_PROJECT_ID = 'project-default';

function ChatInner() {
  const {
    state,
    sendMessage,
    resolveTicket,
    updateRoster,
    removeRosterRole,
    previewPlaybook,
    hireAgent,
    patchAgent,
    assignAndRun,
    installPod,
    passHandoff,
    approvePlan,
    rejectPlan,
    runRoutine,
    createDemoPlan,
    clearMessages,
  } = useChat();
  const [rosterOpen, setRosterOpen] = useState(true);
  const [sideTab, setSideTab] = useState<'roster' | 'playbooks'>('roster');
  const [filter, setFilter] = useState<ChatFilter>('all');
  const [roleCard, setRoleCard] = useState<{ open: boolean; roleId: string | null; roleName?: string; agent?: AgentInstance | null }>({
    open: false,
    roleId: null,
    agent: null,
  });

  const mandatoryTickets = useMemo(() =>
    state.tickets.filter(t => (t.user_id === CURRENT_USER_ID || t.role_id === 'human_requester') && t.status === 'pending'),
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

  const runningCount = Object.keys(state.runningAgentRuns).length;

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>CGen Run Chat</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Clear all messages">
              <IconButton size="small" onClick={clearMessages} sx={{ color: 'text.secondary' }}>
                <Trash2 size={18} />
              </IconButton>
            </Tooltip>
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
          runningAgentRuns={state.runningAgentRuns}
          onResolveTicket={resolveTicket}
          onPassHandoff={passHandoff}
          onApprovePlan={async (planId) => { await approvePlan(planId); }}
          onRejectPlan={rejectPlan}
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
        PaperProps={{ sx: { width: 320, position: 'relative', borderLeft: '1px solid', borderColor: 'divider' } }}
        sx={{ '& .MuiDrawer-paper': { position: 'relative' } }}
      >
        <Tabs value={sideTab} onChange={(_, v) => setSideTab(v)} sx={{ minHeight: 36, borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: '0.75rem', textTransform: 'none' } }}>
          <Tab value="roster" label="Roster" />
          <Tab value="playbooks" label="Playbooks" />
        </Tabs>
        {sideTab === 'roster' ? (
          <RosterPanel
            roster={state.roster}
            agents={state.agents}
            runningCount={runningCount}
            onUpdateRoster={updateRoster}
            onRemoveRole={removeRosterRole}
            onHireAgent={hireAgent}
            onPatchAgent={patchAgent}
            onAssignAndRun={assignAndRun}
            onInstallPod={installPod}
            onRunRoutine={runRoutine}
            onCreateDemoPlan={createDemoPlan}
            onOpenAgent={(agent) => setRoleCard({ open: true, roleId: agent.role_id, roleName: agent.name, agent })}
          />
        ) : (
          <PlaybookTracker instances={state.playbookInstances} />
        )}
      </Drawer>

      <RoleCardDrawer
        open={roleCard.open}
        onClose={() => setRoleCard({ open: false, roleId: null, agent: null })}
        roleId={roleCard.roleId}
        roleName={roleCard.roleName}
        agent={roleCard.agent}
        onPatchAgent={patchAgent}
      />
    </Box>
  );
}

export function ChatPage() {
  const dispatch = useWorkspaceDispatch();

  const onPlanChildren = useCallback((children: ApprovedChildTask[]) => {
    const now = new Date().toISOString();
    const tasks: Task[] = children.map((ch, index) => ({
      id: ch.id,
      key: ch.key,
      title: ch.title,
      description: (ch.acceptance_criteria || []).map((a) => `- ${a}`).join('\n'),
      type: 'story' as const,
      status: (ch.status === 'blocked' ? 'blocked' : 'todo') as Task['status'],
      priority: 'high' as const,
      projectId: ch.project_id === 'project-default' ? 'p-atlas' : ch.project_id,
      sprintId: ch.sprint_id || 's-atl-15',
      assigneeKind: 'agent' as const,
      assigneeAgentId: ch.assignee_agent_id,
      assigneeRoleId: ch.role_id,
      assigneeAgentName: ch.role_id.replace(/_/g, ' '),
      reporterId: 'u-1',
      labelIds: [],
      storyPoints: ch.story_points,
      createdAt: now,
      updatedAt: now,
      blockedReason: ch.blocked_by_task_ids?.length ? `Blocked by ${ch.blocked_by_task_ids.join(', ')}` : undefined,
      checklist: [],
      dependencies: (ch.blocked_by_task_ids || []).map((tid, i) => ({
        id: `dep-${ch.id}-${i}`,
        kind: 'blocked_by' as const,
        targetTaskId: tid,
      })),
      customFields: {},
      rank: -Date.now() - index,
      origin: 'plan' as const,
      executionPolicy: ch.role_id === 'senior_fe' || ch.role_id === 'senior_be'
        ? { mode: 'normal' as const, commentRequired: true, maxReviewRounds: 3, status: 'idle' as const }
        : undefined,
    }));
    dispatch({ type: 'task/upsertMany', tasks });
  }, [dispatch]);

  return (
    <ChatProvider
      runId={DEFAULT_RUN_ID}
      projectId={DEFAULT_PROJECT_ID}
      currentUserId={CURRENT_USER_ID}
      currentUserName={CURRENT_USER_NAME}
      currentUserRoles={CURRENT_USER_ROLES}
      onPlanChildren={onPlanChildren}
    >
      <ChatInner />
    </ChatProvider>
  );
}

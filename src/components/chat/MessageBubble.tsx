import { memo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { Bot, Zap } from 'lucide-react';
import type { ChatMessage, ChatTicket } from '@/types/chat';
import { TicketBar } from './TicketBar';
import { HandoffCard, parseHandoffFromBody } from './HandoffCard';
import { PlanCard, parsePlanFromBody } from './PlanCard';

interface MessageBubbleProps {
  message: ChatMessage;
  tickets: ChatTicket[];
  isOwn: boolean;
  onResolveTicket: (ticketId: string, status: string, comment: string) => void;
  currentUserId: string;
  onPassHandoff?: (handoffId: string, targetRoles: string[]) => Promise<void>;
  onApprovePlan?: (planId: string) => Promise<void>;
  onRejectPlan?: (planId: string) => Promise<void>;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  tickets,
  isOwn,
  onResolveTicket,
  currentUserId,
  onPassHandoff,
  onApprovePlan,
  onRejectPlan,
}: MessageBubbleProps) {
  const [busy, setBusy] = useState(false);
  const isWorkEvent = message.mode === 'work_event';
  const messageTickets = tickets.filter(t => t.parent_message_id === message.id);
  const roles: string[] = (() => {
    try { return JSON.parse(message.author_roles as unknown as string); } catch { return message.author_roles || []; }
  })();
  const isAgent = Boolean(message.agent_id) || message.author_id.startsWith('agent:');
  const isSystemRun = message.author_id === 'system' && Boolean(message.agent_run_id);

  const handoff = parseHandoffFromBody(message.body);
  const plan = parsePlanFromBody(message.body);
  const displayBody = handoff || plan
    ? message.body.replace(/```cgen-(handoff|plan)[\s\S]*?```/, '').trim()
    : message.body;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', mb: 1.5, maxWidth: '85%', alignSelf: isOwn ? 'flex-end' : 'flex-start' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {message.author_name}
        </Typography>
        {isAgent && <Chip icon={<Bot size={10} />} label="AI" size="small" color="primary" sx={{ height: 16, fontSize: '0.5625rem', '& .MuiChip-icon': { ml: 0.5 } }} />}
        {Array.isArray(roles) && roles.length > 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.625rem' }}>
            {roles.join(', ')}
          </Typography>
        )}
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem' }}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>

      <Box sx={{
        px: 1.5, py: 1, borderRadius: 2,
        bgcolor: isSystemRun
          ? 'rgba(14, 165, 233, 0.08)'
          : isAgent
            ? 'rgba(90, 75, 224, 0.06)'
            : isWorkEvent ? 'rgba(90, 75, 224, 0.08)' : (isOwn ? 'primary.main' : 'action.hover'),
        color: isOwn && !isWorkEvent && !isAgent ? 'primary.contrastText' : 'text.primary',
        border: (isWorkEvent || isAgent || isSystemRun || handoff || plan) ? '1px solid' : 'none',
        borderColor: isSystemRun ? 'info.light' : (isWorkEvent || isAgent || handoff || plan) ? 'primary.light' : undefined,
        width: '100%',
      }}>
        {isWorkEvent && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Zap size={12} />
            <Chip label={message.event_type?.replace(/_/g, ' ')} size="small" sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }} />
          </Box>
        )}
        {displayBody ? (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {displayBody}
          </Typography>
        ) : null}

        {handoff && onPassHandoff ? (
          <HandoffCard
            handoff={handoff}
            busy={busy}
            onPass={async (rolesToPass) => {
              if (!handoff.handoff_id) return;
              setBusy(true);
              try {
                await onPassHandoff(handoff.handoff_id, rolesToPass);
              } finally {
                setBusy(false);
              }
            }}
          />
        ) : null}

        {plan && onApprovePlan && onRejectPlan ? (
          <PlanCard
            plan={plan}
            busy={busy}
            onApprove={async () => {
              setBusy(true);
              try {
                await onApprovePlan(plan.plan_id);
              } finally {
                setBusy(false);
              }
            }}
            onReject={async () => {
              setBusy(true);
              try {
                await onRejectPlan(plan.plan_id);
              } finally {
                setBusy(false);
              }
            }}
          />
        ) : null}
      </Box>

      {messageTickets.length > 0 && (
        <Box sx={{ mt: 0.75, width: '100%' }}>
          {messageTickets.map(ticket => (
            <TicketBar key={ticket.id} ticket={ticket} onResolve={onResolveTicket} currentUserId={currentUserId} />
          ))}
        </Box>
      )}
    </Box>
  );
});

import { memo, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import type { ChatMessage, ChatTicket, AgentRun } from '@/types/chat';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  tickets: ChatTicket[];
  loading: boolean;
  currentUserId: string;
  runningAgentRuns: Record<string, AgentRun>;
  onResolveTicket: (ticketId: string, status: string, comment: string) => void;
  onPassHandoff?: (handoffId: string, targetRoles: string[]) => Promise<void>;
  onApprovePlan?: (planId: string) => Promise<void>;
  onRejectPlan?: (planId: string) => Promise<void>;
}

export const MessageList = memo(function MessageList({
  messages,
  tickets,
  loading,
  currentUserId,
  runningAgentRuns,
  onResolveTicket,
  onPassHandoff,
  onApprovePlan,
  onRejectPlan,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const running = Object.values(runningAgentRuns);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, running.length]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (messages.length === 0 && running.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, flexDirection: 'column', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">No messages yet</Typography>
        <Typography variant="caption" color="text.disabled">Hire an AI teammate, assign work, or send a message</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1.5, display: 'flex', flexDirection: 'column' }}>
      {messages.map(msg => (
        <MessageBubble
          key={msg.id}
          message={msg}
          tickets={tickets}
          isOwn={msg.author_id === currentUserId}
          onResolveTicket={onResolveTicket}
          currentUserId={currentUserId}
          onPassHandoff={onPassHandoff}
          onApprovePlan={onApprovePlan}
          onRejectPlan={onRejectPlan}
        />
      ))}

      {running.map(run => (
        <Alert
          key={run.id}
          severity="info"
          icon={<CircularProgress size={16} />}
          sx={{ mb: 1.5, alignItems: 'center' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Agent running…</Typography>
            <Chip label={run.wake_reason} size="small" sx={{ height: 20, fontSize: '0.625rem' }} />
            <Typography variant="caption" color="text.secondary">Final reply will appear when LM Studio completes.</Typography>
          </Box>
        </Alert>
      ))}

      <div ref={bottomRef} />
    </Box>
  );
});

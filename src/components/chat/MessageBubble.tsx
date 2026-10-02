import { memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { Zap } from 'lucide-react';
import type { ChatMessage, ChatTicket } from '@/types/chat';
import { TicketBar } from './TicketBar';

interface MessageBubbleProps {
  message: ChatMessage;
  tickets: ChatTicket[];
  isOwn: boolean;
  onResolveTicket: (ticketId: string, status: string, comment: string) => void;
  currentUserId: string;
}

export const MessageBubble = memo(function MessageBubble({ message, tickets, isOwn, onResolveTicket, currentUserId }: MessageBubbleProps) {
  const isWorkEvent = message.mode === 'work_event';
  const messageTickets = tickets.filter(t => t.parent_message_id === message.id);
  const roles: string[] = (() => {
    try { return JSON.parse(message.author_roles as unknown as string); } catch { return message.author_roles || []; }
  })();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', mb: 1.5, maxWidth: '85%', alignSelf: isOwn ? 'flex-end' : 'flex-start' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {message.author_name}
        </Typography>
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
        bgcolor: isWorkEvent ? 'rgba(90, 75, 224, 0.08)' : (isOwn ? 'primary.main' : 'action.hover'),
        color: isOwn && !isWorkEvent ? 'primary.contrastText' : 'text.primary',
        border: isWorkEvent ? '1px solid' : 'none',
        borderColor: isWorkEvent ? 'primary.light' : undefined,
        width: '100%',
      }}>
        {isWorkEvent && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Zap size={12} />
            <Chip label={message.event_type?.replace(/_/g, ' ')} size="small" sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }} />
          </Box>
        )}
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.body}
        </Typography>
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

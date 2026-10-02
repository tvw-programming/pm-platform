import { memo, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import type { ChatMessage, ChatTicket } from '@/types/chat';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  tickets: ChatTicket[];
  loading: boolean;
  currentUserId: string;
  onResolveTicket: (ticketId: string, status: string, comment: string) => void;
}

export const MessageList = memo(function MessageList({ messages, tickets, loading, currentUserId, onResolveTicket }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (messages.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, flexDirection: 'column', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">No messages yet</Typography>
        <Typography variant="caption" color="text.disabled">Send a message or start a work event</Typography>
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
        />
      ))}
      <div ref={bottomRef} />
    </Box>
  );
});

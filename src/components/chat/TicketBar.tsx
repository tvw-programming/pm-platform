import { memo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { Check, X, Clock, SkipForward, AlertTriangle } from 'lucide-react';
import type { ChatTicket } from '@/types/chat';

interface TicketBarProps {
  ticket: ChatTicket;
  onResolve: (ticketId: string, status: string, comment: string) => void;
  currentUserId: string;
}

const kindLabels: Record<string, string> = {
  approve_reject: 'Approve / Reject',
  ack: 'Acknowledge',
  action_done: 'Mark Done',
  review: 'Review',
};

const statusColors: Record<string, string> = {
  pending: '#B8690C',
  approved: '#1E8F5E',
  rejected: '#D92B2B',
  done: '#1E8F5E',
  acked: '#4A7BD4',
  skipped: '#8D96A8',
};

const statusIcons: Record<string, typeof Check> = {
  pending: Clock,
  approved: Check,
  rejected: X,
  done: Check,
  acked: Check,
  skipped: SkipForward,
};

export const TicketBar = memo(function TicketBar({ ticket, onResolve, currentUserId }: TicketBarProps) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const isResolved = ticket.status !== 'pending';
  const isAssignedToMe = ticket.user_id === currentUserId;
  const isSkipped = ticket.status === 'skipped';
  const StatusIcon = statusIcons[ticket.status] || Clock;
  const color = statusColors[ticket.status] || '#8D96A8';

  const handleResolve = (status: string) => {
    onResolve(ticket.id, status, comment);
    setComment('');
    setShowComment(false);
  };

  if (isSkipped) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: 1, bgcolor: 'action.hover', mb: 0.5, opacity: 0.7 }}>
        <SkipForward size={12} color={color} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {ticket.role_id.replace(/_/g, ' ')} — {ticket.skipped_reason === 'NOT_ASKED' ? 'Not asked' : 'Skipped (role absent)'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      px: 1.25, py: 0.75, borderRadius: 1, mb: 0.5,
      border: '1px solid', borderColor: isResolved ? 'divider' : (isAssignedToMe ? 'primary.main' : 'divider'),
      bgcolor: isAssignedToMe && !isResolved ? 'rgba(90, 75, 224, 0.04)' : 'background.paper',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <StatusIcon size={14} color={color} />
        <Typography variant="caption" sx={{ fontWeight: 600, flex: 1 }}>
          {ticket.role_id.replace(/_/g, ' ')}
        </Typography>
        <Chip label={kindLabels[ticket.kind] || ticket.kind} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
        <Chip label={ticket.status} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: color, color: '#fff', fontWeight: 700 }} />
        {ticket.due_by && !isResolved && (
          <Tooltip title={`Due: ${new Date(ticket.due_by).toLocaleString()}`}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {new Date(ticket.due_by) < new Date() && <AlertTriangle size={12} color="#D92B2B" />}
            </Box>
          </Tooltip>
        )}
      </Box>

      {ticket.comment && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary', fontStyle: 'italic' }}>
          {ticket.comment}
        </Typography>
      )}

      {!isResolved && isAssignedToMe && (
        <Box sx={{ mt: 0.75 }}>
          {showComment && (
            <TextField size="small" fullWidth multiline maxRows={3} placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} sx={{ mb: 0.75 }} />
          )}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {!showComment && (
              <Button size="small" variant="text" onClick={() => setShowComment(true)} sx={{ fontSize: '0.6875rem', minWidth: 0, px: 1 }}>
                + Comment
              </Button>
            )}
            {(ticket.kind === 'approve_reject' || ticket.kind === 'review') && (
              <>
                <Button size="small" variant="contained" color="success" onClick={() => handleResolve('approved')} sx={{ fontSize: '0.6875rem', minWidth: 0, px: 1.5 }}>
                  Approve
                </Button>
                <Button size="small" variant="outlined" color="error" onClick={() => handleResolve('rejected')} sx={{ fontSize: '0.6875rem', minWidth: 0, px: 1.5 }}>
                  Reject
                </Button>
              </>
            )}
            {ticket.kind === 'ack' && (
              <Button size="small" variant="contained" onClick={() => handleResolve('acked')} sx={{ fontSize: '0.6875rem', minWidth: 0, px: 1.5 }}>
                Acknowledge
              </Button>
            )}
            {ticket.kind === 'action_done' && (
              <Button size="small" variant="contained" color="success" onClick={() => handleResolve('done')} sx={{ fontSize: '0.6875rem', minWidth: 0, px: 1.5 }}>
                Mark Done
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
});

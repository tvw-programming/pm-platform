import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { Check, X } from 'lucide-react';
import type { PlanContract } from '@/types/chat';

interface PlanCardProps {
  plan: PlanContract;
  onApprove: () => void;
  onReject: () => void;
  busy?: boolean;
}

export function PlanCard({ plan, onApprove, onReject, busy }: PlanCardProps): React.JSX.Element {
  const pending = plan.status === 'pending_approval';

  return (
    <Box
      sx={{
        mt: 1,
        p: 1.25,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: pending ? 'warning.light' : 'success.light',
        bgcolor: pending ? 'rgba(245, 158, 11, 0.06)' : 'rgba(34, 197, 94, 0.06)',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
        <Chip label="Plan" size="small" color={pending ? 'warning' : 'success'} sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700 }} />
        <Chip label={plan.status.replace(/_/g, ' ')} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.625rem' }} />
      </Stack>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
        {plan.goal}
      </Typography>
      {plan.body ? (
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', display: 'block', mb: 1 }}>
          {plan.body.slice(0, 400)}
          {plan.body.length > 400 ? '…' : ''}
        </Typography>
      ) : null}
      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
        Work breakdown
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2, mb: 1 }}>
        {plan.children?.map((ch, i) => (
          <Typography component="li" key={`${ch.title}-${i}`} variant="caption" color="text.secondary">
            {ch.title} · <strong>{ch.role_id.replace(/_/g, ' ')}</strong>
            {ch.blocked_by_indexes?.length ? ` (blocked by #${ch.blocked_by_indexes.map((n) => n + 1).join(',')})` : ''}
          </Typography>
        ))}
      </Box>
      {pending ? (
        <Stack direction="row" spacing={0.75}>
          <Button size="small" variant="contained" color="success" disabled={busy} startIcon={<Check size={12} />} onClick={onApprove} sx={{ textTransform: 'none' }}>
            Approve & create children
          </Button>
          <Button size="small" variant="outlined" color="error" disabled={busy} startIcon={<X size={12} />} onClick={onReject} sx={{ textTransform: 'none' }}>
            Reject
          </Button>
        </Stack>
      ) : null}
    </Box>
  );
}

export function parsePlanFromBody(body: string): PlanContract | null {
  const match = body.match(/```cgen-plan\s*([\s\S]*?)```/);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1].trim()) as PlanContract;
  } catch {
    return null;
  }
}

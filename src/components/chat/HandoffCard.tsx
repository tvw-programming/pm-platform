import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { ArrowRight, GitPullRequest } from 'lucide-react';
import type { HandoffContract } from '@/types/chat';

interface HandoffCardProps {
  handoff: HandoffContract;
  onPass: (targetRoles: string[]) => void;
  busy?: boolean;
}

export function HandoffCard({ handoff, onPass, busy }: HandoffCardProps): React.JSX.Element {
  const targets = handoff.to_roles?.length ? handoff.to_roles : ['qa_lead'];

  return (
    <Box
      sx={{
        mt: 1,
        p: 1.25,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'primary.light',
        bgcolor: 'rgba(90, 75, 224, 0.04)',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
        <Chip label="Handoff" size="small" color="primary" sx={{ height: 18, fontSize: '0.625rem', fontWeight: 700 }} />
        <Typography variant="caption" color="text.secondary">
          {handoff.from_role?.replace(/_/g, ' ')} → {targets.map((r) => r.replace(/_/g, ' ')).join(', ')}
        </Typography>
        {handoff.task_id ? (
          <Chip label={handoff.task_id} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.625rem' }} />
        ) : null}
      </Stack>

      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {handoff.summary}
      </Typography>

      {handoff.acceptance_criteria && handoff.acceptance_criteria.length > 0 ? (
        <Box component="ul" sx={{ m: 0, pl: 2, mb: 1 }}>
          {handoff.acceptance_criteria.map((ac) => (
            <Typography component="li" key={ac} variant="caption" color="text.secondary">
              {ac}
            </Typography>
          ))}
        </Box>
      ) : null}

      {(handoff.pr_title || handoff.pr_body) && (
        <Box sx={{ mb: 1, p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
            <GitPullRequest size={12} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              PR draft
            </Typography>
          </Stack>
          {handoff.pr_title ? (
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
              {handoff.pr_title}
            </Typography>
          ) : null}
          {handoff.pr_body ? (
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', display: 'block', mt: 0.5 }}>
              {handoff.pr_body}
            </Typography>
          ) : null}
          {handoff.verification_steps ? (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              Verify: {handoff.verification_steps}
            </Typography>
          ) : null}
        </Box>
      )}

      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        {targets.map((role) => (
          <Button
            key={role}
            size="small"
            variant="contained"
            disabled={busy || !handoff.handoff_id}
            startIcon={<ArrowRight size={12} />}
            onClick={() => onPass([role])}
            sx={{ textTransform: 'none', fontSize: '0.7rem' }}
          >
            Pass to {role.replace(/_/g, ' ')}
          </Button>
        ))}
        {targets.length > 1 ? (
          <Button
            size="small"
            variant="outlined"
            disabled={busy || !handoff.handoff_id}
            onClick={() => onPass(targets)}
            sx={{ textTransform: 'none', fontSize: '0.7rem' }}
          >
            Pass to all
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}

export function parseHandoffFromBody(body: string): HandoffContract | null {
  const match = body.match(/```cgen-handoff\s*([\s\S]*?)```/);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1].trim()) as HandoffContract;
  } catch {
    return null;
  }
}

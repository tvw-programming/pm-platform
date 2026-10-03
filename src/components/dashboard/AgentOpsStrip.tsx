import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import { Bot, Pause, Play, AlertTriangle, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '@/api/chatApi';
import type { AgentOpsSummary } from '@/types/chat';
import { paths } from '@/app/navigation';

export function AgentOpsStrip(): React.JSX.Element {
  const navigate = useNavigate();
  const [ops, setOps] = useState<AgentOpsSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api.getAgentOps('project-default')
        .then((data) => { if (!cancelled) setOps(data); })
        .catch(() => { if (!cancelled) setOps(null); });
    };
    load();
    const id = window.setInterval(load, 15000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  const counts = ops?.counts ?? { active: 0, paused: 0, running: 0, error: 0, budget_soft: 0, budget_hard: 0 };
  const hard = ops?.project_config?.hard_token_budget ?? 0;
  const used = ops?.tokens_used ?? 0;
  const pct = hard > 0 ? Math.min(100, Math.round((used / hard) * 100)) : 0;

  return (
    <Box
      sx={{
        mb: 2.5,
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(120deg, rgba(90,75,224,0.06), rgba(14,165,233,0.05))',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Bot size={16} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Agent Ops</Typography>
          <Chip icon={<Play size={10} />} label={`${counts.active ?? 0} active`} size="small" color="success" sx={{ height: 22 }} />
          <Chip icon={<Bot size={10} />} label={`${counts.running ?? 0} running`} size="small" color="info" sx={{ height: 22 }} />
          <Chip icon={<Pause size={10} />} label={`${counts.paused ?? 0} paused`} size="small" color="warning" sx={{ height: 22 }} />
          <Chip icon={<AlertTriangle size={10} />} label={`${counts.error ?? 0} errors (24h)`} size="small" color={counts.error ? 'error' : 'default'} sx={{ height: 22 }} />
          <Chip icon={<Ticket size={10} />} label={`${ops?.pending_approvals ?? 0} approvals`} size="small" sx={{ height: 22 }} />
          {(counts.budget_soft ?? 0) > 0 || (counts.budget_hard ?? 0) > 0 ? (
            <Chip label={`budget soft ${counts.budget_soft ?? 0} / hard ${counts.budget_hard ?? 0}`} size="small" color="warning" sx={{ height: 22 }} />
          ) : null}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: { md: 220 } }}>
          <Box sx={{ flex: 1, minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">
              Tokens {used.toLocaleString()}{hard ? ` / ${hard.toLocaleString()}` : ''}
            </Typography>
            <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, mt: 0.25 }} />
          </Box>
          <Button size="small" variant="outlined" onClick={() => navigate(paths.chat)} sx={{ textTransform: 'none' }}>
            Open chat
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

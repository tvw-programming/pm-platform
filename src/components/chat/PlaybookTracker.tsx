import { memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import { BookOpen, CheckCircle, Clock, SkipForward } from 'lucide-react';
import type { PlaybookInstance } from '@/types/chat';

interface PlaybookTrackerProps {
  instances: PlaybookInstance[];
}

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  open: { color: '#4A7BD4', icon: Clock },
  resolved: { color: '#1E8F5E', icon: CheckCircle },
  partial: { color: '#B8690C', icon: SkipForward },
};

export const PlaybookTracker = memo(function PlaybookTracker({ instances }: PlaybookTrackerProps) {
  if (instances.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <BookOpen size={20} style={{ opacity: 0.4 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>No active playbooks</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1 }}>
      {instances.map(inst => {
        const mustRespond = inst.resolved_roles?.length ?? 0;
        const skipped = inst.skipped_roles?.length ?? 0;
        const notAsked = inst.not_asked_roles?.length ?? 0;
        const total = mustRespond + skipped + notAsked;
        const progress = total > 0 ? (mustRespond / total) * 100 : 0;
        const cfg = statusConfig[inst.status] ?? statusConfig.open;

        return (
          <Box key={inst.id} sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <cfg.icon size={12} color={cfg.color} />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem', flex: 1 }}>
                {inst.playbook_id.replace(/_/g, ' ')}
              </Typography>
              <Chip label={inst.status} size="small" sx={{ height: 18, fontSize: '0.5625rem', bgcolor: cfg.color, color: '#fff' }} />
            </Box>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 3, borderRadius: 2, mb: 0.5, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: cfg.color } }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#1E8F5E' }}>{mustRespond} resolved</Typography>
              <Typography variant="caption" sx={{ color: '#8D96A8' }}>{skipped} skipped</Typography>
              <Typography variant="caption" sx={{ color: '#8D96A8', opacity: 0.6 }}>{notAsked} not asked</Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
});

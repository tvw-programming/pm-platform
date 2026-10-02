import { memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { Check, SkipForward, EyeOff } from 'lucide-react';
import type { PlaybookResolution } from '@/types/chat';

interface RoutedPreviewProps {
  resolution: PlaybookResolution | null;
  loading?: boolean;
}

export const RoutedPreview = memo(function RoutedPreview({ resolution, loading }: RoutedPreviewProps) {
  if (loading) {
    return (
      <Box sx={{ px: 1.5, py: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
        <Typography variant="caption" color="text.secondary">Resolving routing...</Typography>
      </Box>
    );
  }

  if (!resolution) return null;

  return (
    <Box sx={{ px: 1.5, py: 1, borderRadius: 1, bgcolor: 'rgba(90, 75, 224, 0.04)', border: '1px solid', borderColor: 'divider' }}>
      {resolution.must_respond.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
          <Check size={12} color="#1E8F5E" />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#1E8F5E', mr: 0.5 }}>Must respond:</Typography>
          {resolution.must_respond.map((r, i) => (
            <Chip key={i} label={r.user_name || r.role_id.replace(/_/g, ' ')} size="small" sx={{ height: 18, fontSize: '0.625rem', bgcolor: '#1E8F5E', color: '#fff' }} />
          ))}
        </Box>
      )}

      {resolution.skipped.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
          <SkipForward size={12} color="#8D96A8" />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#8D96A8', mr: 0.5 }}>Skipped:</Typography>
          {resolution.skipped.map((r, i) => (
            <Chip key={i} label={`${r.role_id.replace(/_/g, ' ')} (not on roster)`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.625rem' }} />
          ))}
        </Box>
      )}

      {resolution.not_asked.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <EyeOff size={12} color="#8D96A8" />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#8D96A8', mr: 0.5 }}>Not asked:</Typography>
          {resolution.not_asked.map((r, i) => (
            <Chip key={i} label={r.role_id.replace(/_/g, ' ')} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.625rem', opacity: 0.6 }} />
          ))}
        </Box>
      )}
    </Box>
  );
});

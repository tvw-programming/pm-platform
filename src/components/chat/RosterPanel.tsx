import { memo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { UserPlus, Trash2, Users } from 'lucide-react';
import type { RosterEntry, RoleDef } from '@/types/chat';
import * as api from '@/api/chatApi';

interface RosterPanelProps {
  roster: RosterEntry[];
  onUpdateRoster: (entries: { role_id: string; user_id: string; user_name: string; present: boolean }[]) => Promise<void>;
  onRemoveRole: (roleId: string) => Promise<void>;
}

const trackColors: Record<string, string> = {
  frontend: '#4A7BD4',
  backend: '#1E8F5E',
  mobile: '#B8690C',
  platform: '#7C3AED',
  data: '#0891B2',
  design: '#DB2777',
  qa: '#EA580C',
  security: '#DC2626',
  product: '#5A4BE0',
  leadership: '#6366F1',
};

export const RosterPanel = memo(function RosterPanel({ roster, onUpdateRoster, onRemoveRole }: RosterPanelProps) {
  const [catalog, setCatalog] = useState<RoleDef[]>([]);
  const [addRoleId, setAddRoleId] = useState('');
  const [addUserName, setAddUserName] = useState('');

  useEffect(() => {
    api.getRoleCatalog().then(data => setCatalog(data.roles)).catch(() => {});
  }, []);

  const usedRoles = new Set(roster.map(r => r.role_id));
  const availableRoles = catalog.filter(r => !usedRoles.has(r.id));

  const handleAddRole = async () => {
    if (!addRoleId || !addUserName.trim()) return;
    await onUpdateRoster([{ role_id: addRoleId, user_id: addUserName.toLowerCase().replace(/\s+/g, '_'), user_name: addUserName.trim(), present: true }]);
    setAddRoleId('');
    setAddUserName('');
  };

  const byTrack = roster.reduce<Record<string, RosterEntry[]>>((acc, entry) => {
    const track = entry.track || 'other';
    (acc[track] ||= []).push(entry);
    return acc;
  }, {});

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Users size={18} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Run Roster</Typography>
        <Chip label={`${roster.length} roles`} size="small" sx={{ height: 20, fontSize: '0.625rem' }} />
      </Box>

      {Object.entries(byTrack).sort(([a], [b]) => a.localeCompare(b)).map(([track, entries]) => (
        <Box key={track} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: trackColors[track] || '#8D96A8' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
              {track}
            </Typography>
          </Box>
          {entries.map(entry => (
            <Box key={entry.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, px: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>{entry.role_label || entry.role_id.replace(/_/g, ' ')}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{entry.user_name}</Typography>
              </Box>
              <Chip label={entry.seniority || '—'} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.5625rem' }} />
              <IconButton size="small" onClick={() => onRemoveRole(entry.role_id)} sx={{ opacity: 0.5, '&:hover': { opacity: 1, color: 'error.main' } }}>
                <Trash2 size={12} />
              </IconButton>
            </Box>
          ))}
        </Box>
      ))}

      {roster.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No roles assigned yet. Add roles to enable routed work events.
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: 'text.secondary' }}>ADD ROLE</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>Role</InputLabel>
          <Select value={addRoleId} label="Role" onChange={e => setAddRoleId(e.target.value)} sx={{ fontSize: '0.75rem' }}>
            {availableRoles.map(r => (
              <MenuItem key={r.id} value={r.id} sx={{ fontSize: '0.75rem' }}>{r.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField size="small" placeholder="Person name" value={addUserName} onChange={e => setAddUserName(e.target.value)} sx={{ flex: 1, minWidth: 120 }} />
        <Button size="small" variant="contained" onClick={handleAddRole} disabled={!addRoleId || !addUserName.trim()} startIcon={<UserPlus size={14} />}>
          Add
        </Button>
      </Box>
    </Box>
  );
});

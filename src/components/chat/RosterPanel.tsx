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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { UserPlus, Trash2, Users, Bot, Pause, Play, Sparkles } from 'lucide-react';
import type { RosterEntry, RoleDef, AgentInstance } from '@/types/chat';
import * as api from '@/api/chatApi';

interface RosterPanelProps {
  roster: RosterEntry[];
  agents: AgentInstance[];
  runningCount: number;
  onUpdateRoster: (entries: { role_id: string; user_id?: string; user_name?: string; agent_id?: string | null; present: boolean }[]) => Promise<void>;
  onRemoveRole: (roleId: string) => Promise<void>;
  onHireAgent: (data: { name: string; role_id: string; instructions?: string; model?: string }) => Promise<AgentInstance>;
  onPatchAgent: (id: string, data: { status?: string }) => Promise<AgentInstance>;
  onAssignAndRun: (agentId: string, input: string) => Promise<void>;
  onInstallPod?: () => Promise<AgentInstance[]>;
  onRunRoutine?: (key: string) => Promise<void>;
  onCreateDemoPlan?: () => Promise<void>;
  onOpenAgent?: (agent: AgentInstance) => void;
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

export const RosterPanel = memo(function RosterPanel({
  roster,
  agents,
  runningCount,
  onUpdateRoster,
  onRemoveRole,
  onHireAgent,
  onPatchAgent,
  onAssignAndRun,
  onInstallPod,
  onRunRoutine,
  onCreateDemoPlan,
  onOpenAgent,
}: RosterPanelProps) {
  const [catalog, setCatalog] = useState<RoleDef[]>([]);
  const [addRoleId, setAddRoleId] = useState('');
  const [addUserName, setAddUserName] = useState('');
  const [hireOpen, setHireOpen] = useState(false);
  const [hireName, setHireName] = useState('');
  const [hireRoleId, setHireRoleId] = useState('project_manager');
  const [hireInstructions, setHireInstructions] = useState('');
  const [hireBusy, setHireBusy] = useState(false);
  const [hireError, setHireError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignAgentId, setAssignAgentId] = useState<string | null>(null);
  const [assignInput, setAssignInput] = useState('');
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [podBusy, setPodBusy] = useState(false);
  const [routineBusy, setRoutineBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [phase2Error, setPhase2Error] = useState<string | null>(null);

  useEffect(() => {
    api.getRoleCatalog().then(data => setCatalog(data.roles)).catch(() => {});
  }, []);

  const usedRoles = new Set(roster.map(r => r.role_id));
  const availableRoles = catalog.filter(r => !usedRoles.has(r.id));
  const hiredRoleIds = new Set(agents.filter(a => a.status !== 'terminated').map(a => a.role_id));
  const hireableRoles = catalog.filter(r => !hiredRoleIds.has(r.id));

  const agentById = new Map(agents.map(a => [a.id, a]));
  const agentByRole = new Map(agents.filter(a => a.status !== 'terminated').map(a => [a.role_id, a]));

  const handleAddRole = async () => {
    if (!addRoleId || !addUserName.trim()) return;
    await onUpdateRoster([{ role_id: addRoleId, user_id: addUserName.toLowerCase().replace(/\s+/g, '_'), user_name: addUserName.trim(), present: true }]);
    setAddRoleId('');
    setAddUserName('');
  };

  const handleHire = async () => {
    if (!hireName.trim() || !hireRoleId) return;
    setHireBusy(true);
    setHireError(null);
    try {
      await onHireAgent({
        name: hireName.trim(),
        role_id: hireRoleId,
        instructions: hireInstructions.trim() || undefined,
      });
      setHireOpen(false);
      setHireName('');
      setHireInstructions('');
    } catch (err) {
      setHireError(err instanceof Error ? err.message : 'Hire failed');
    } finally {
      setHireBusy(false);
    }
  };

  const openAssign = (agentId: string) => {
    setAssignAgentId(agentId);
    setAssignInput('');
    setAssignError(null);
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!assignAgentId || !assignInput.trim()) return;
    setAssignBusy(true);
    setAssignError(null);
    try {
      await onAssignAndRun(assignAgentId, assignInput.trim());
      setAssignOpen(false);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setAssignBusy(false);
    }
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
        {runningCount > 0 && (
          <Chip icon={<CircularProgress size={10} />} label={`${runningCount} running`} size="small" color="warning" sx={{ height: 20, fontSize: '0.625rem' }} />
        )}
      </Box>

      <Button
        fullWidth
        size="small"
        variant="contained"
        startIcon={<Bot size={14} />}
        onClick={() => setHireOpen(true)}
        sx={{ mb: 1 }}
      >
        Hire AI teammate
      </Button>

      {(onInstallPod || onRunRoutine || onCreateDemoPlan) && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
          {onInstallPod && (
            <Button
              fullWidth
              size="small"
              variant="outlined"
              disabled={podBusy}
              startIcon={podBusy ? <CircularProgress size={12} /> : <Users size={14} />}
              onClick={async () => {
                setPodBusy(true);
                setPhase2Error(null);
                try {
                  await onInstallPod();
                } catch (err) {
                  setPhase2Error(err instanceof Error ? err.message : 'Install pod failed');
                } finally {
                  setPodBusy(false);
                }
              }}
            >
              Install Product Eng Pod
            </Button>
          )}
          {onRunRoutine && (
            <Button
              fullWidth
              size="small"
              variant="outlined"
              disabled={routineBusy}
              startIcon={routineBusy ? <CircularProgress size={12} /> : <Sparkles size={14} />}
              onClick={async () => {
                setRoutineBusy(true);
                setPhase2Error(null);
                try {
                  await onRunRoutine('daily-triage');
                } catch (err) {
                  setPhase2Error(err instanceof Error ? err.message : 'Routine failed');
                } finally {
                  setRoutineBusy(false);
                }
              }}
            >
              Run daily triage
            </Button>
          )}
          {onCreateDemoPlan && (
            <Button
              fullWidth
              size="small"
              variant="outlined"
              disabled={demoBusy}
              startIcon={demoBusy ? <CircularProgress size={12} /> : <Sparkles size={14} />}
              onClick={async () => {
                setDemoBusy(true);
                setPhase2Error(null);
                try {
                  await onCreateDemoPlan();
                } catch (err) {
                  setPhase2Error(err instanceof Error ? err.message : 'Demo plan failed');
                } finally {
                  setDemoBusy(false);
                }
              }}
            >
              Demo PM plan
            </Button>
          )}
          {phase2Error && (
            <Typography variant="caption" color="error">{phase2Error}</Typography>
          )}
        </Box>
      )}

      {Object.entries(byTrack).sort(([a], [b]) => a.localeCompare(b)).map(([track, entries]) => (
        <Box key={track} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: trackColors[track] || '#8D96A8' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
              {track}
            </Typography>
          </Box>
          {entries.map(entry => {
            const agent = entry.agent_id ? agentById.get(entry.agent_id) : agentByRole.get(entry.role_id);
            const isAI = Boolean(entry.agent_id || agent);
            return (
              <Box key={entry.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.5, px: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                <Box sx={{ flex: 1, minWidth: 0, cursor: agent ? 'pointer' : 'default' }} onClick={() => agent && onOpenAgent?.(agent)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>{entry.role_label || entry.role_id.replace(/_/g, ' ')}</Typography>
                    {isAI && <Chip label="AI" size="small" color="primary" sx={{ height: 16, fontSize: '0.5625rem', fontWeight: 700 }} />}
                    {agent && (
                      <Chip
                        label={agent.status}
                        size="small"
                        color={agent.status === 'active' ? 'success' : agent.status === 'paused' ? 'warning' : 'default'}
                        sx={{ height: 16, fontSize: '0.5625rem' }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{entry.user_name || agent?.name}</Typography>
                </Box>
                {agent && agent.status === 'active' && (
                  <IconButton size="small" title="Assign / Run" onClick={() => openAssign(agent.id)} sx={{ color: 'primary.main' }}>
                    <Sparkles size={12} />
                  </IconButton>
                )}
                {agent && agent.status === 'active' && (
                  <IconButton size="small" title="Pause" onClick={() => onPatchAgent(agent.id, { status: 'paused' })}>
                    <Pause size={12} />
                  </IconButton>
                )}
                {agent && agent.status === 'paused' && (
                  <IconButton size="small" title="Resume" onClick={() => onPatchAgent(agent.id, { status: 'active' })}>
                    <Play size={12} />
                  </IconButton>
                )}
                <Chip label={entry.seniority || '—'} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.5625rem' }} />
                <IconButton size="small" onClick={() => onRemoveRole(entry.role_id)} sx={{ opacity: 0.5, '&:hover': { opacity: 1, color: 'error.main' } }}>
                  <Trash2 size={12} />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      ))}

      {roster.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No roles assigned yet. Hire an AI teammate or add a human role.
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: 'text.secondary' }}>ADD HUMAN ROLE</Typography>
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

      <Dialog open={hireOpen} onClose={() => !hireBusy && setHireOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Hire CGen AI teammate</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Name" size="small" value={hireName} onChange={e => setHireName(e.target.value)} placeholder="e.g. Ada PM" fullWidth />
            <FormControl size="small" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={hireRoleId} label="Role" onChange={e => setHireRoleId(e.target.value)}>
                {(hireableRoles.length ? hireableRoles : catalog).map(r => (
                  <MenuItem key={r.id} value={r.id}>{r.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Instructions"
              size="small"
              value={hireInstructions}
              onChange={e => setHireInstructions(e.target.value)}
              multiline
              minRows={3}
              placeholder="Persona, duties, response style…"
              fullWidth
            />
            {hireError && <Typography variant="caption" color="error">{hireError}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHireOpen(false)} disabled={hireBusy}>Cancel</Button>
          <Button variant="contained" onClick={handleHire} disabled={hireBusy || !hireName.trim()} startIcon={hireBusy ? <CircularProgress size={14} /> : <Bot size={14} />}>
            Hire & seat
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignOpen} onClose={() => !assignBusy && setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign work & run</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Human-directed wake. The agent replies with a final message (no streaming).
          </Typography>
          <TextField
            label="Assignment"
            value={assignInput}
            onChange={e => setAssignInput(e.target.value)}
            multiline
            minRows={4}
            fullWidth
            placeholder="e.g. Triage open sprint work and propose a plan for the login redesign."
          />
          {assignError && <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>{assignError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)} disabled={assignBusy}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} disabled={assignBusy || !assignInput.trim()} startIcon={assignBusy ? <CircularProgress size={14} /> : <Sparkles size={14} />}>
            Run agent
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

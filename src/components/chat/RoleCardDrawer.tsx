import { memo, useState, useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { X, Shield, ArrowUpRight, Bot } from 'lucide-react';
import type { RoleTemplates, AgentInstance, Skill, AgentRun } from '@/types/chat';
import * as api from '@/api/chatApi';

interface RoleCardDrawerProps {
  open: boolean;
  onClose: () => void;
  roleId: string | null;
  roleName?: string;
  agent?: AgentInstance | null;
  onPatchAgent?: (id: string, data: { instructions?: string; model?: string; status?: string; name?: string }) => Promise<AgentInstance>;
}

export const RoleCardDrawer = memo(function RoleCardDrawer({
  open,
  onClose,
  roleId,
  roleName,
  agent,
  onPatchAgent,
}: RoleCardDrawerProps) {
  const [templates, setTemplates] = useState<RoleTemplates | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [instructions, setInstructions] = useState('');
  const [model, setModel] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!roleId || !open) return;
    api.getTemplatesForRole(roleId).then(data => {
      const found = data.role?.role_id === roleId
        ? data.role
        : (data as unknown as { role_templates?: RoleTemplates[] }).role_templates?.find((t) => t.role_id === roleId);
      setTemplates(found || null);
    }).catch(() => {});
  }, [roleId, open]);

  useEffect(() => {
    if (!agent || !open) return;
    setInstructions(agent.instructions || '');
    setModel(agent.model || '');
    api.getAgent(agent.id).then(data => setSkills(data.skills || [])).catch(() => setSkills([]));
    api.listAgentRuns(agent.id).then(setRuns).catch(() => setRuns([]));
  }, [agent, open]);

  const sections: { title: string; key: keyof RoleTemplates; color: string }[] = [
    { title: 'Duties', key: 'duties', color: '#5A4BE0' },
    { title: 'Status Updates', key: 'status', color: '#1E8F5E' },
    { title: 'Ask', key: 'ask', color: '#4A7BD4' },
    { title: 'Respond', key: 'respond', color: '#B8690C' },
  ];

  const saveAgent = async () => {
    if (!agent || !onPatchAgent) return;
    setSaving(true);
    try {
      await onPatchAgent(agent.id, { instructions, model });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 380, bgcolor: 'background.paper' } }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {agent ? <Bot size={18} /> : <Shield size={18} />}
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {agent?.name || roleName || roleId?.replace(/_/g, ' ') || 'Role'}
            </Typography>
            {agent && <Chip label="AI" size="small" color="primary" sx={{ height: 18, fontSize: '0.625rem' }} />}
          </Box>
          <IconButton size="small" onClick={onClose}><X size={16} /></IconButton>
        </Box>

        {agent && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={0.75} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
              <Chip label={agent.status} size="small" color={agent.status === 'active' ? 'success' : 'warning'} />
              <Chip label={agent.role_id.replace(/_/g, ' ')} size="small" variant="outlined" />
              <Chip label={`${agent.tokens_used} tokens`} size="small" variant="outlined" />
            </Stack>
            <TextField
              label="Instructions"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              size="small"
              sx={{ mb: 1.5 }}
            />
            <TextField
              label="LM model override"
              value={model}
              onChange={e => setModel(e.target.value)}
              fullWidth
              size="small"
              helperText="Empty = Settings default model"
              sx={{ mb: 1.5 }}
            />
            <Button size="small" variant="contained" onClick={saveAgent} disabled={saving}>Save agent</Button>

            {skills.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>SKILLS</Typography>
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
                  {skills.map(s => <Chip key={s.id} label={s.slug} size="small" />)}
                </Stack>
              </Box>
            )}

            {runs.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>RECENT RUNS</Typography>
                {runs.slice(0, 5).map(r => (
                  <Box key={r.id} sx={{ py: 0.5 }}>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {r.status} · {r.wake_reason} · {r.prompt_tokens + r.completion_tokens} tok
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        {!templates && !agent && (
          <Typography variant="body2" color="text.secondary">Loading role details...</Typography>
        )}

        {templates && sections.map(({ title, key, color }) => {
          const items = templates[key];
          if (!items || !Array.isArray(items) || items.length === 0) return null;
          return (
            <Box key={key} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  {title}
                </Typography>
                <Chip label={items.length} size="small" sx={{ height: 16, fontSize: '0.5625rem', ml: 'auto' }} />
              </Box>
              {(items as string[]).map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, py: 0.5, px: 0.75, borderRadius: 0.75, '&:hover': { bgcolor: 'action.hover' } }}>
                  <ArrowUpRight size={10} style={{ marginTop: 4, flexShrink: 0, color }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem', lineHeight: 1.4 }}>{item}</Typography>
                </Box>
              ))}
              <Divider sx={{ mt: 1.5 }} />
            </Box>
          );
        })}
      </Box>
    </Drawer>
  );
});

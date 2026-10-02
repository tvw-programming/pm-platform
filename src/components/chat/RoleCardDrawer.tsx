import { memo, useState, useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { X, Shield, ArrowUpRight } from 'lucide-react';
import type { RoleTemplates } from '@/types/chat';
import * as api from '@/api/chatApi';

interface RoleCardDrawerProps {
  open: boolean;
  onClose: () => void;
  roleId: string | null;
  roleName?: string;
}

export const RoleCardDrawer = memo(function RoleCardDrawer({ open, onClose, roleId, roleName }: RoleCardDrawerProps) {
  const [templates, setTemplates] = useState<RoleTemplates | null>(null);

  useEffect(() => {
    if (!roleId || !open) return;
    api.getTemplatesForRole(roleId).then(data => {
      const found = data.role_templates?.find((t: RoleTemplates) => t.role_id === roleId);
      setTemplates(found || null);
    }).catch(() => {});
  }, [roleId, open]);

  const sections: { title: string; key: keyof RoleTemplates; color: string }[] = [
    { title: 'Duties', key: 'duties', color: '#5A4BE0' },
    { title: 'Status Updates', key: 'status', color: '#1E8F5E' },
    { title: 'Ask', key: 'ask', color: '#4A7BD4' },
    { title: 'Respond', key: 'respond', color: '#B8690C' },
  ];

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 360, bgcolor: 'background.paper' } }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield size={18} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {roleName || roleId?.replace(/_/g, ' ') || 'Role'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}><X size={16} /></IconButton>
        </Box>

        {!templates && (
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

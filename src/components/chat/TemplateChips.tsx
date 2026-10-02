import { memo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import type { RoleTemplates, SharedTemplates } from '@/types/chat';
import * as api from '@/api/chatApi';

interface TemplateChipsProps {
  roleIds: string[];
  mode: 'normal' | 'work_event';
  onSelect: (text: string) => void;
}

export const TemplateChips = memo(function TemplateChips({ roleIds, mode, onSelect }: TemplateChipsProps) {
  const [templates, setTemplates] = useState<RoleTemplates[]>([]);
  const [shared, setShared] = useState<SharedTemplates | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    api.getTemplateCatalog().then(catalog => {
      setTemplates(catalog.role_templates.filter(t => roleIds.includes(t.role_id)));
      setShared(catalog.shared_templates);
    }).catch(() => {});
  }, [roleIds]);

  const categories = mode === 'work_event' ? ['status', 'ask', 'respond'] as const : ['status', 'ask'] as const;

  const allChips: { label: string; text: string }[] = [];

  if (shared) {
    const sharedList = mode === 'work_event' ? shared.work_event : shared.normal;
    sharedList.forEach(t => allChips.push({ label: t, text: t }));
  }

  if (templates.length > 0 && categories[activeTab]) {
    const cat = categories[activeTab];
    templates.forEach(rt => {
      const items = rt[cat] || [];
      items.forEach(t => allChips.push({ label: t, text: t }));
    });
  }

  if (allChips.length === 0) return null;

  return (
    <Box sx={{ px: 1, py: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.625rem' }}>
          Templates
        </Typography>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ minHeight: 24, '& .MuiTab-root': { minHeight: 24, py: 0, px: 1, fontSize: '0.625rem' } }}>
          {categories.map(cat => <Tab key={cat} label={cat} />)}
        </Tabs>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxHeight: 80, overflow: 'auto' }}>
        {allChips.slice(0, 12).map((chip, i) => (
          <Chip key={i} label={chip.label} size="small" variant="outlined" onClick={() => onSelect(chip.text)} sx={{ height: 22, fontSize: '0.625rem', cursor: 'pointer', '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' } }} />
        ))}
      </Box>
    </Box>
  );
});

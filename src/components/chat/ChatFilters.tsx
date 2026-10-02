import { memo } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import { MessageCircle, AtSign, AlertCircle, BookOpen } from 'lucide-react';

export type ChatFilter = 'all' | 'mentions' | 'mandatory' | 'playbooks';

interface ChatFiltersProps {
  value: ChatFilter;
  onChange: (filter: ChatFilter) => void;
  mentionCount?: number;
  mandatoryCount?: number;
  playbookCount?: number;
}

const filters: { id: ChatFilter; label: string; Icon: typeof MessageCircle }[] = [
  { id: 'all', label: 'All', Icon: MessageCircle },
  { id: 'mentions', label: 'Mentions', Icon: AtSign },
  { id: 'mandatory', label: 'Mandatory', Icon: AlertCircle },
  { id: 'playbooks', label: 'Playbooks', Icon: BookOpen },
];

export const ChatFilters = memo(function ChatFilters({ value, onChange, mentionCount = 0, mandatoryCount = 0, playbookCount = 0 }: ChatFiltersProps) {
  const counts: Record<ChatFilter, number> = { all: 0, mentions: mentionCount, mandatory: mandatoryCount, playbooks: playbookCount };

  return (
    <Tabs
      value={value}
      onChange={(_, v) => onChange(v)}
      variant="scrollable"
      scrollButtons={false}
      sx={{ minHeight: 36, borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { minHeight: 36, py: 0, px: 1.5, fontSize: '0.75rem', textTransform: 'none' } }}
    >
      {filters.map(({ id, label, Icon }) => (
        <Tab
          key={id}
          value={id}
          icon={
            counts[id] > 0 ? (
              <Badge badgeContent={counts[id]} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.5625rem', height: 14, minWidth: 14 } }}>
                <Icon size={14} />
              </Badge>
            ) : (
              <Icon size={14} />
            )
          }
          iconPosition="start"
          label={label}
        />
      ))}
    </Tabs>
  );
});

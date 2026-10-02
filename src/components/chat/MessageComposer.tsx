import { memo, useState, useCallback, type KeyboardEvent } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { Send, MessageCircle, Zap } from 'lucide-react';
import type { EventType, PlaybookResolution } from '@/types/chat';
import { RoutedPreview } from './RoutedPreview';
import { TemplateChips } from './TemplateChips';

interface MessageComposerProps {
  eventTypes: EventType[];
  authorRoles: string[];
  onSend: (data: { mode: string; event_type?: string; template_id?: string; body: string }) => Promise<void>;
  onPreview: (eventType: string) => Promise<{ playbook: unknown; resolution: PlaybookResolution } | null>;
}

export const MessageComposer = memo(function MessageComposer({ eventTypes, authorRoles, onSend, onPreview }: MessageComposerProps) {
  const [mode, setMode] = useState<'normal' | 'work_event'>('normal');
  const [eventType, setEventType] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<PlaybookResolution | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleModeChange = (_: unknown, value: string | null) => {
    if (value) {
      setMode(value as 'normal' | 'work_event');
      setEventType('');
      setPreview(null);
    }
  };

  const handleEventChange = useCallback(async (trigger: string) => {
    setEventType(trigger);
    if (trigger) {
      setPreviewLoading(true);
      const result = await onPreview(trigger);
      setPreview(result?.resolution || null);
      setPreviewLoading(false);
    } else {
      setPreview(null);
    }
  }, [onPreview]);

  const handleSend = useCallback(async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await onSend({
        mode,
        event_type: mode === 'work_event' ? eventType : undefined,
        body: body.trim(),
      });
      setBody('');
      setPreview(null);
      setEventType('');
    } finally {
      setSending(false);
    }
  }, [body, mode, eventType, onSend]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplateSelect = (text: string) => {
    setBody(prev => prev ? `${prev}\n${text}` : text);
  };

  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <TemplateChips roleIds={authorRoles} mode={mode} onSelect={handleTemplateSelect} />

      {mode === 'work_event' && preview && (
        <Box sx={{ px: 1.5, py: 0.75 }}>
          <RoutedPreview resolution={preview} loading={previewLoading} />
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, p: 1.5 }}>
        <ToggleButtonGroup value={mode} exclusive onChange={handleModeChange} size="small" sx={{ '& .MuiToggleButton-root': { px: 1, py: 0.5 } }}>
          <ToggleButton value="normal"><MessageCircle size={14} /></ToggleButton>
          <ToggleButton value="work_event"><Zap size={14} /></ToggleButton>
        </ToggleButtonGroup>

        {mode === 'work_event' && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>Event type</InputLabel>
            <Select value={eventType} label="Event type" onChange={e => handleEventChange(e.target.value)} sx={{ fontSize: '0.75rem' }}>
              {eventTypes.map(et => (
                <MenuItem key={et.id} value={et.id} sx={{ fontSize: '0.75rem' }}>{et.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          size="small"
          fullWidth
          multiline
          maxRows={4}
          placeholder={mode === 'work_event' ? 'Describe the work event...' : 'Type a message...'}
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ '& .MuiInputBase-root': { fontSize: '0.875rem' } }}
        />

        <Button
          variant="contained"
          size="small"
          onClick={handleSend}
          disabled={sending || !body.trim() || (mode === 'work_event' && !eventType)}
          sx={{ minWidth: 40, px: 1.5 }}
        >
          <Send size={16} />
        </Button>
      </Box>
    </Box>
  );
});

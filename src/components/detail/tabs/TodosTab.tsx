import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import { Plus } from 'lucide-react';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { EmptyState } from '@/components/common/States';
import { checklistProgress } from '@/utils/selectors';

interface TodosTabProps {
  taskId: string;
}

export default function TodosTab({ taskId }: TodosTabProps): React.JSX.Element {
  const { taskById, dispatch } = useWorkspace();
  const [draft, setDraft] = useState('');
  const task = taskById(taskId);

  if (!task) {
    return <Typography variant="body2" color="text.secondary">Task not found.</Typography>;
  }

  const checklist = checklistProgress(task);

  return (
    <Stack spacing={2}>
      {checklist.total > 0 ? (
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="subtitle2">Progress</Typography>
            <Typography variant="caption" color="text.secondary">
              {checklist.done}/{checklist.total}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(checklist.done / checklist.total) * 100}
            aria-label="Checklist progress"
          />
        </Box>
      ) : null}

      {task.checklist.length === 0 ? (
        <EmptyState
          dense
          title="No to-do items"
          description="Add checklist items to break this task into smaller steps."
        />
      ) : (
        <Stack spacing={0.25}>
          {task.checklist.map((item) => (
            <FormControlLabel
              key={item.id}
              control={
                <Checkbox
                  size="small"
                  checked={item.done}
                  onChange={() => dispatch({ type: 'task/toggleChecklistItem', taskId: task.id, itemId: item.id })}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: item.done ? 'line-through' : 'none',
                    color: item.done ? 'text.disabled' : 'text.primary',
                  }}
                >
                  {item.label}
                </Typography>
              }
            />
          ))}
        </Stack>
      )}

      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          fullWidth
          placeholder="Add a checklist item"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              dispatch({ type: 'task/addChecklistItem', taskId: task.id, label: draft.trim() });
              setDraft('');
            }
          }}
        />
        <Button
          size="small"
          startIcon={<Plus size={14} />}
          disabled={!draft.trim()}
          onClick={() => {
            dispatch({ type: 'task/addChecklistItem', taskId: task.id, label: draft.trim() });
            setDraft('');
          }}
        >
          Add
        </Button>
      </Stack>
    </Stack>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import { Search } from 'lucide-react';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useUi } from '@/state/UiProvider';
import { paths } from '@/app/navigation';
import { StatusChip } from '@/components/common/TokenChip';
import type { TaskStatus } from '@/types/domain';

type Option =
  | { kind: 'task'; id: string; label: string; secondary: string; status: TaskStatus }
  | { kind: 'project'; id: string; label: string; secondary: string }
  | { kind: 'release'; id: string; label: string; secondary: string }
  | { kind: 'document'; id: string; label: string; secondary: string };

export function GlobalSearch({ compact = false }: { compact?: boolean }): React.JSX.Element {
  const { state, visibleTasks, projectById } = useWorkspace();
  const { openTask } = useUi();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');

  const options = useMemo<Option[]>(() => {
    const query = inputValue.trim().toLowerCase();
    if (query.length < 2) return [];

    const taskOptions: Option[] = visibleTasks
      .filter((task) => task.title.toLowerCase().includes(query) || task.key.toLowerCase().includes(query))
      .slice(0, 8)
      .map((task) => ({
        kind: 'task',
        id: task.id,
        label: `${task.key} · ${task.title}`,
        secondary: projectById(task.projectId)?.name ?? '',
        status: task.status,
      }));

    const projectOptions: Option[] = state.projects
      .filter((p) => p.name.toLowerCase().includes(query) || p.key.toLowerCase().includes(query))
      .slice(0, 4)
      .map((p) => ({ kind: 'project', id: p.id, label: p.name, secondary: `Project · ${p.key}` }));

    const releaseOptions: Option[] = state.releases
      .filter((r) => r.name.toLowerCase().includes(query) || r.version.includes(query))
      .slice(0, 3)
      .map((r) => ({ kind: 'release', id: r.id, label: `${r.name} ${r.version}`, secondary: 'Release' }));

    const documentOptions: Option[] = state.documents
      .filter((d) => d.title.toLowerCase().includes(query))
      .slice(0, 3)
      .map((d) => ({ kind: 'document', id: d.id, label: d.title, secondary: 'Document' }));

    return [...taskOptions, ...projectOptions, ...releaseOptions, ...documentOptions];
  }, [inputValue, visibleTasks, state.projects, state.releases, state.documents, projectById]);

  return (
    <Autocomplete<Option, false, false, false>
      size="small"
      options={options}
      filterOptions={(x) => x}
      inputValue={inputValue}
      onInputChange={(_, value) => setInputValue(value)}
      noOptionsText={inputValue.trim().length < 2 ? 'Type at least two characters' : 'No matches'}
      getOptionLabel={(option) => option.label}
      groupBy={(option) => option.kind}
      onChange={(_, option) => {
        if (!option) return;
        if (option.kind === 'task') openTask(option.id);
        if (option.kind === 'project') navigate(paths.project(option.id));
        if (option.kind === 'release') navigate(paths.release(option.id));
        if (option.kind === 'document') navigate(paths.documents);
        setInputValue('');
      }}
      renderOption={(props, option) => {
        const { key, ...rest } = props as typeof props & { key: string };
        return (
          <Box component="li" key={key} {...rest}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%', minWidth: 0 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {option.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {option.secondary}
                </Typography>
              </Box>
              {option.kind === 'task' ? <StatusChip status={option.status} /> : null}
            </Stack>
          </Box>
        );
      }}
      sx={{ width: compact ? '100%' : { md: 300, lg: 400 } }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search tasks, projects, releases…"
          aria-label="Global search"
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={15} aria-hidden />
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );
}

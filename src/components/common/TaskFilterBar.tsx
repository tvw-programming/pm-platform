import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import { Columns3, List as ListIcon, CalendarDays, SlidersHorizontal, Search, X } from 'lucide-react';
import { PRIORITIES, TASK_STATUSES, TASK_TYPES } from '@/types/domain';
import { priorityTokens, taskStatusTokens, taskTypeTokens } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';
import type { TaskFilterState, TaskGroupKey, TaskSortKey } from '@/hooks/useTaskFilters';

export type BoardView = 'board' | 'list' | 'calendar';

interface TaskFilterBarProps {
  filters: TaskFilterState;
  setFilter: <K extends keyof TaskFilterState>(key: K, value: TaskFilterState[K]) => void;
  reset: () => void;
  activeCount: number;
  /** Omit to hide the view switcher (e.g. on the backlog). */
  view?: BoardView;
  onViewChange?: (view: BoardView) => void;
  showGrouping?: boolean;
  showProjectFilter?: boolean;
  showSprintFilter?: boolean;
  rightSlot?: React.ReactNode;
}

const SORT_OPTIONS: { value: TaskSortKey; label: string }[] = [
  { value: 'rank', label: 'Manual rank' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'points', label: 'Story points' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'title', label: 'Title' },
];

const GROUP_OPTIONS: { value: TaskGroupKey; label: string }[] = [
  { value: 'none', label: 'No grouping' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'priority', label: 'Priority' },
  { value: 'type', label: 'Type' },
  { value: 'epic', label: 'Epic' },
];

export function TaskFilterBar({
  filters,
  setFilter,
  reset,
  activeCount,
  view,
  onViewChange,
  showGrouping = true,
  showProjectFilter = true,
  showSprintFilter = false,
  rightSlot,
}: TaskFilterBarProps): React.JSX.Element {
  const { state } = useWorkspace();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1.25}
      alignItems={{ xs: 'stretch', md: 'center' }}
      sx={{ mb: 2 }}
    >
      <TextField
        value={filters.search}
        onChange={(e) => setFilter('search', e.target.value)}
        placeholder="Search tasks"
        aria-label="Search tasks"
        sx={{ width: { xs: '100%', md: 260 } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search size={15} aria-hidden />
              </InputAdornment>
            ),
            endAdornment: filters.search ? (
              <InputAdornment position="end">
                <Button size="small" onClick={() => setFilter('search', '')} aria-label="Clear search" sx={{ minWidth: 0, p: 0.5 }}>
                  <X size={14} />
                </Button>
              </InputAdornment>
            ) : undefined,
          },
        }}
      />

      <Badge badgeContent={activeCount} color="primary">
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<SlidersHorizontal size={15} />}
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-haspopup="dialog"
        >
          Filters
        </Button>
      </Badge>

      <TextField
        select
        label="Sort"
        value={filters.sort}
        onChange={(e) => setFilter('sort', e.target.value as TaskSortKey)}
        sx={{ width: { xs: '100%', md: 170 } }}
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      {showGrouping ? (
        <TextField
          select
          label="Group by"
          value={filters.group}
          onChange={(e) => setFilter('group', e.target.value as TaskGroupKey)}
          sx={{ width: { xs: '100%', md: 160 } }}
        >
          {GROUP_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      ) : null}

      <Box sx={{ flex: 1 }} />

      {rightSlot}

      {view && onViewChange ? (
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          onChange={(_, value: BoardView | null) => value && onViewChange(value)}
          aria-label="View switcher"
        >
          <ToggleButton value="board" aria-label="Board view">
            <Tooltip title="Board">
              <Columns3 size={16} />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="list" aria-label="List view">
            <Tooltip title="List">
              <ListIcon size={16} />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="calendar" aria-label="Calendar view">
            <Tooltip title="Calendar">
              <CalendarDays size={16} />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      ) : null}

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 340, p: 2.5 } } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="h6">Filters</Typography>
          <Button size="small" onClick={reset} disabled={activeCount === 0}>
            Clear all
          </Button>
        </Stack>
        <Stack spacing={2}>
          {showProjectFilter ? (
            <Autocomplete
              multiple
              size="small"
              options={state.projects}
              getOptionLabel={(option) => `${option.key} · ${option.name}`}
              value={state.projects.filter((p) => filters.projectIds.includes(p.id))}
              onChange={(_, value) =>
                setFilter(
                  'projectIds',
                  value.map((v) => v.id),
                )
              }
              renderValue={(value, getItemProps) =>
                value.map((option, index) => {
                  const { key, ...itemProps } = getItemProps({ index });
                  return <Chip key={key} size="small" label={option.key} {...itemProps} />;
                })
              }
              renderInput={(params) => <TextField {...params} label="Projects" />}
            />
          ) : null}

          <Autocomplete
            multiple
            size="small"
            options={state.users}
            getOptionLabel={(option) => option.name}
            value={state.users.filter((u) => filters.assigneeIds.includes(u.id))}
            onChange={(_, value) =>
              setFilter(
                'assigneeIds',
                value.map((v) => v.id),
              )
            }
            renderValue={(value, getItemProps) =>
              value.map((option, index) => {
                const { key, ...itemProps } = getItemProps({ index });
                return <Chip key={key} size="small" label={option.initials} {...itemProps} />;
              })
            }
            renderInput={(params) => <TextField {...params} label="Assignees" />}
          />

          <Autocomplete
            multiple
            size="small"
            options={[...TASK_STATUSES]}
            getOptionLabel={(option) => taskStatusTokens[option].label}
            value={filters.statuses}
            onChange={(_, value) => setFilter('statuses', value)}
            renderValue={(value, getItemProps) =>
              value.map((option, index) => {
                const { key, ...itemProps } = getItemProps({ index });
                return <Chip key={key} size="small" label={taskStatusTokens[option].label} {...itemProps} />;
              })
            }
            renderInput={(params) => <TextField {...params} label="Status" />}
          />

          <Autocomplete
            multiple
            size="small"
            options={[...TASK_TYPES]}
            getOptionLabel={(option) => taskTypeTokens[option].label}
            value={filters.types}
            onChange={(_, value) => setFilter('types', value)}
            renderValue={(value, getItemProps) =>
              value.map((option, index) => {
                const { key, ...itemProps } = getItemProps({ index });
                return <Chip key={key} size="small" label={taskTypeTokens[option].label} {...itemProps} />;
              })
            }
            renderInput={(params) => <TextField {...params} label="Type" />}
          />

          <Autocomplete
            multiple
            size="small"
            options={[...PRIORITIES]}
            getOptionLabel={(option) => priorityTokens[option].label}
            value={filters.priorities}
            onChange={(_, value) => setFilter('priorities', value)}
            renderValue={(value, getItemProps) =>
              value.map((option, index) => {
                const { key, ...itemProps } = getItemProps({ index });
                return <Chip key={key} size="small" label={priorityTokens[option].label} {...itemProps} />;
              })
            }
            renderInput={(params) => <TextField {...params} label="Priority" />}
          />

          <Autocomplete
            multiple
            size="small"
            options={state.labels}
            getOptionLabel={(option) => option.name}
            value={state.labels.filter((l) => filters.labelIds.includes(l.id))}
            onChange={(_, value) =>
              setFilter(
                'labelIds',
                value.map((v) => v.id),
              )
            }
            renderValue={(value, getItemProps) =>
              value.map((option, index) => {
                const { key, ...itemProps } = getItemProps({ index });
                return <Chip key={key} size="small" label={option.name} {...itemProps} />;
              })
            }
            renderInput={(params) => <TextField {...params} label="Labels" />}
          />

          {showSprintFilter ? (
            <Autocomplete
              multiple
              size="small"
              options={state.sprints}
              getOptionLabel={(option) => option.name}
              value={state.sprints.filter((s) => filters.sprintIds.includes(s.id))}
              onChange={(_, value) =>
                setFilter(
                  'sprintIds',
                  value.map((v) => v.id),
                )
              }
              renderValue={(value, getItemProps) =>
                value.map((option, index) => {
                  const { key, ...itemProps } = getItemProps({ index });
                  return <Chip key={key} size="small" label={option.name} {...itemProps} />;
                })
              }
              renderInput={(params) => <TextField {...params} label="Sprints" />}
            />
          ) : null}

          <Divider />
          <FormControlLabel
            control={<Switch checked={filters.onlyMine} onChange={(e) => setFilter('onlyMine', e.target.checked)} />}
            label="Only my work"
          />
          <FormControlLabel
            control={
              <Switch checked={filters.onlyOverdue} onChange={(e) => setFilter('onlyOverdue', e.target.checked)} />
            }
            label="Only overdue"
          />
          <FormControlLabel
            control={
              <Switch checked={filters.onlyBlocked} onChange={(e) => setFilter('onlyBlocked', e.target.checked)} />
            }
            label="Only blocked"
          />
        </Stack>
      </Popover>
    </Stack>
  );
}

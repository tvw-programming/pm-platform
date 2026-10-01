import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { CALENDAR_EVENT_KINDS, type CalendarEventKind, type ID } from '@/types/domain';
import { PageHeader } from '@/components/common/PageHeader';
import { ProjectCalendar } from '@/components/calendar/ProjectCalendar';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { buildCalendarEvents } from '@/utils/selectors';
import { PRIORITIES, TASK_STATUSES } from '@/types/domain';
import { priorityTokens, taskStatusTokens } from '@/app/tokens';

interface CalendarPageProps {
  projectId?: ID;
  embedded?: boolean;
}

export function CalendarPage({ projectId, embedded = false }: CalendarPageProps): React.JSX.Element {
  const { state, visibleTasks } = useWorkspace();

  const [projectIds, setProjectIds] = useState<ID[]>(projectId ? [projectId] : []);
  const [teamId, setTeamId] = useState<ID | 'all'>('all');
  const [assigneeIds, setAssigneeIds] = useState<ID[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [kinds, setKinds] = useState<CalendarEventKind[]>([...CALENDAR_EVENT_KINDS]);

  const events = useMemo(() => {
    const all = buildCalendarEvents(visibleTasks, state.milestones, state.releases, state.sprints);
    const teamMemberIds =
      teamId === 'all' ? null : new Set(state.teams.find((t) => t.id === teamId)?.memberIds ?? []);

    return all.filter((event) => {
      if (projectIds.length > 0 && !projectIds.includes(event.projectId)) return false;
      if (event.kind === 'task') {
        if (assigneeIds.length > 0 && (!event.assigneeId || !assigneeIds.includes(event.assigneeId))) return false;
        if (teamMemberIds && (!event.assigneeId || !teamMemberIds.has(event.assigneeId))) return false;
        if (statusFilter !== 'all' && event.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && event.priority !== priorityFilter) return false;
      } else if (assigneeIds.length > 0 || statusFilter !== 'all' || priorityFilter !== 'all') {
        // Non-task events have no assignee/status, so person-level filters hide them.
        return false;
      }
      return true;
    });
  }, [
    visibleTasks,
    state.milestones,
    state.releases,
    state.sprints,
    state.teams,
    projectIds,
    assigneeIds,
    teamId,
    statusFilter,
    priorityFilter,
  ]);

  return (
    <Box>
      {!embedded ? (
        <PageHeader
          title="Calendar"
          description="Task due dates, milestones, release dates and sprint windows on one surface. Drag a task to reschedule it."
        />
      ) : null}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems={{ lg: 'center' }}>
        {!projectId ? (
          <Autocomplete
            multiple
            size="small"
            options={state.projects}
            getOptionLabel={(option) => `${option.key} · ${option.name}`}
            value={state.projects.filter((p) => projectIds.includes(p.id))}
            onChange={(_, value) => setProjectIds(value.map((v) => v.id))}
            renderValue={(value, getItemProps) =>
              value.map((option, index) => {
                const { key, ...itemProps } = getItemProps({ index });
                return <Chip key={key} size="small" label={option.key} {...itemProps} />;
              })
            }
            renderInput={(params) => <TextField {...params} label="Projects" placeholder="All" />}
            sx={{ width: { xs: '100%', lg: 240 } }}
          />
        ) : null}

        <TextField
          select
          label="Team"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value as ID | 'all')}
          sx={{ width: { xs: '100%', lg: 180 } }}
        >
          <MenuItem value="all">All teams</MenuItem>
          {state.teams.map((team) => (
            <MenuItem key={team.id} value={team.id}>
              {team.name}
            </MenuItem>
          ))}
        </TextField>

        <Autocomplete
          multiple
          size="small"
          options={state.users}
          getOptionLabel={(option) => option.name}
          value={state.users.filter((u) => assigneeIds.includes(u.id))}
          onChange={(_, value) => setAssigneeIds(value.map((v) => v.id))}
          renderValue={(value, getItemProps) =>
            value.map((option, index) => {
              const { key, ...itemProps } = getItemProps({ index });
              return <Chip key={key} size="small" label={option.initials} {...itemProps} />;
            })
          }
          renderInput={(params) => <TextField {...params} label="Assignees" placeholder="Anyone" />}
          sx={{ width: { xs: '100%', lg: 200 } }}
        />

        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ width: { xs: '100%', lg: 160 } }}
        >
          <MenuItem value="all">Any status</MenuItem>
          {TASK_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {taskStatusTokens[status].label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          sx={{ width: { xs: '100%', lg: 150 } }}
        >
          <MenuItem value="all">Any priority</MenuItem>
          {PRIORITIES.map((priority) => (
            <MenuItem key={priority} value={priority}>
              {priorityTokens[priority].label}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ flex: 1 }} />

        <ToggleButtonGroup
          size="small"
          value={kinds}
          onChange={(_, value: CalendarEventKind[]) => setKinds(value.length > 0 ? value : [...CALENDAR_EVENT_KINDS])}
          aria-label="Event types"
        >
          {CALENDAR_EVENT_KINDS.map((kind) => (
            <ToggleButton key={kind} value={kind} aria-label={kind}>
              {kind}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <ProjectCalendar events={events} visibleKinds={kinds} height={embedded ? 640 : 760} />
    </Box>
  );
}

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import ListItemButton from '@mui/material/ListItemButton';
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts';
import { Lock, Search, X } from 'lucide-react';
import type { ID } from '@/types/domain';
import { WORKSPACE_ROLES, type WorkspaceRole } from '@/types/domain';
import { layout } from '@/app/tokens';
import { PageHeader } from '@/components/common/PageHeader';
import { ChartCard, useChartTheme } from '@/components/common/ChartCard';
import { AvailabilityChip } from '@/components/common/TokenChip';
import { ProgressWithLabel } from '@/components/common/ProgressWithLabel';
import { UserAvatar, UserAvatarStack } from '@/components/common/UserAvatar';
import { TaskListTable } from '@/components/tasks/TaskListTable';
import { EmptyState } from '@/components/common/States';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useUi } from '@/state/UiProvider';
import { titleCase } from '@/utils/format';
import { isDone, workloadByUser } from '@/utils/selectors';

export function TeamsPage(): React.JSX.Element {
  const { state, visibleTasks, currentUser, userById } = useWorkspace();
  const { openTask } = useUi();
  const chart = useChartTheme();

  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState<ID | 'all'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<ID | null>(null);

  const canManageMembers = currentUser.role === 'owner' || currentUser.role === 'admin';

  const members = useMemo(() => {
    const query = search.trim().toLowerCase();
    return state.users.filter((user) => {
      if (teamFilter !== 'all' && !user.teamIds.includes(teamFilter)) return false;
      if (availabilityFilter !== 'all' && user.availability !== availabilityFilter) return false;
      if (!query) return true;
      return `${user.name} ${user.jobTitle} ${user.department} ${user.skills.join(' ')}`.toLowerCase().includes(query);
    });
  }, [state.users, search, teamFilter, availabilityFilter]);

  const workload = useMemo(() => workloadByUser(visibleTasks, members), [visibleTasks, members]);

  const selected = userById(selectedUserId ?? undefined);
  const selectedTasks = useMemo(
    () => visibleTasks.filter((task) => task.assigneeId === selectedUserId),
    [visibleTasks, selectedUserId],
  );
  const selectedProjects = useMemo(
    () => state.projects.filter((project) => selected && project.memberIds.includes(selected.id)),
    [state.projects, selected],
  );

  return (
    <Box>
      <PageHeader
        title="Teams"
        description="Who is on which team, what they are carrying, and where capacity is tight."
      />

      {!canManageMembers ? (
        <Alert severity="info" icon={<Lock size={16} />} sx={{ mb: 2.5 }}>
          You have {titleCase(currentUser.role)} access, so member records are read-only. Ask a workspace admin to
          change roles or availability.
        </Alert>
      ) : null}

      <Box sx={{ display: 'grid', '& > *': { minWidth: 0 }, gap: 2, mb: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
        <ChartCard
          title="Utilisation by person"
          subheader="Allocated hours against weekly capacity"
          summary={workload
            .slice(0, 8)
            .map((row) => `${row.name}: ${row.utilisation}%`)
            .join(', ')}
          empty={workload.length === 0}
          height={300}
        >
          <BarChart
            data={workload.slice(0, 10).map((row) => ({ name: row.initials, utilisation: row.utilisation, full: row.name }))}
            margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
            barSize={18}
          >
            <CartesianGrid stroke={chart.gridStroke} vertical={false} />
            <XAxis dataKey="name" tick={chart.tickStyle} stroke={chart.axisStroke} />
            <YAxis tick={chart.tickStyle} stroke={chart.axisStroke} unit="%" />
            <Tooltip
              contentStyle={chart.tooltipStyle}
              labelFormatter={(label) =>
                workload.find((row) => row.initials === label)?.name ?? String(label ?? '')
              }
            />
            <Bar dataKey="utilisation" name="Utilisation %" radius={[3, 3, 0, 0]}>
              {workload.slice(0, 10).map((row) => (
                <Cell
                  key={row.userId}
                  fill={row.utilisation > 100 ? '#C3362B' : row.utilisation > 85 ? '#B4720A' : '#0E8F86'}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <Card>
          <CardHeader title="Teams" subheader={`${state.teams.length} teams in this workspace`} />
          <CardContent sx={{ pt: 0 }}>
            <Stack spacing={2} divider={<Divider flexItem />}>
              {state.teams.map((team) => {
                const teamMembers = state.users.filter((u) => team.memberIds.includes(u.id));
                const open = visibleTasks.filter(
                  (task) => task.assigneeId && team.memberIds.includes(task.assigneeId) && !isDone(task),
                ).length;
                return (
                  <Box key={team.id}>
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: team.color }} />
                          <Typography variant="subtitle2">{team.name}</Typography>
                          <Chip size="small" label={team.key} sx={{ height: 18, fontSize: 10.5 }} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {team.description}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.25 }}>
                          Lead: {userById(team.leadId)?.name ?? '—'} · {open} open items
                        </Typography>
                      </Box>
                      <UserAvatarStack users={teamMembers} max={4} size={24} />
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people and skills"
          aria-label="Search team members"
          sx={{ width: { xs: '100%', md: 280 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={15} aria-hidden />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          label="Team"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value as ID | 'all')}
          sx={{ width: { xs: '100%', md: 200 } }}
        >
          <MenuItem value="all">All teams</MenuItem>
          {state.teams.map((team) => (
            <MenuItem key={team.id} value={team.id}>
              {team.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Availability"
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
          sx={{ width: { xs: '100%', md: 180 } }}
        >
          <MenuItem value="all">Any</MenuItem>
          <MenuItem value="available">Available</MenuItem>
          <MenuItem value="busy">Busy</MenuItem>
          <MenuItem value="overloaded">Overloaded</MenuItem>
          <MenuItem value="on_leave">On leave</MenuItem>
        </TextField>
      </Stack>

      {members.length === 0 ? (
        <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
          <EmptyState title="No one matches" description="Clear a filter or search for a different skill." />
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            '& > *': { minWidth: 0 },
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' },
          }}
        >
          {members.map((user) => {
            const row = workload.find((candidate) => candidate.userId === user.id);
            return (
              <Card key={user.id}>
                <ListItemButton
                  onClick={() => setSelectedUserId(user.id)}
                  sx={{ display: 'block', p: 2.25, borderRadius: 0 }}
                  aria-label={`Open details for ${user.name}`}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <UserAvatar user={user} size={40} showTooltip={false} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" noWrap>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {user.jobTitle}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                    <AvailabilityChip availability={user.availability} />
                    <Chip size="small" variant="outlined" label={titleCase(user.role)} />
                    <Chip size="small" label={user.department} sx={{ height: 20, fontSize: 11 }} />
                  </Stack>

                  <ProgressWithLabel
                    value={row?.utilisation ?? 0}
                    label={`${row?.openTasks ?? 0} open · ${row?.points ?? 0} pts`}
                    size="sm"
                    color={(row?.utilisation ?? 0) > 100 ? 'error' : (row?.utilisation ?? 0) > 85 ? 'warning' : 'primary'}
                  />

                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                    {user.skills.slice(0, 3).map((skill) => (
                      <Chip key={skill} size="small" variant="outlined" label={skill} sx={{ height: 20, fontSize: 10.5 }} />
                    ))}
                    {user.skills.length > 3 ? (
                      <Chip size="small" label={`+${user.skills.length - 3}`} sx={{ height: 20, fontSize: 10.5 }} />
                    ) : null}
                  </Stack>
                </ListItemButton>
              </Card>
            );
          })}
        </Box>
      )}

      <Drawer
        anchor="right"
        open={selected !== undefined}
        onClose={() => setSelectedUserId(null)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: layout.taskDrawerWidth } } } }}
      >
        {selected ? (
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <UserAvatar user={selected} size={44} showTooltip={false} />
                <Box>
                  <Typography variant="h5">{selected.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selected.jobTitle} · {selected.department}
                  </Typography>
                </Box>
              </Stack>
              <IconButton size="small" onClick={() => setSelectedUserId(null)} aria-label="Close member details">
                <X size={16} />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={0.75} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
              <AvailabilityChip availability={selected.availability} />
              <Chip size="small" variant="outlined" label={titleCase(selected.role)} />
              <Chip size="small" variant="outlined" label={selected.location} />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.5}>
              <TextField
                select
                label="Workspace role"
                value={selected.role}
                disabled={!canManageMembers}
                helperText={canManageMembers ? undefined : 'Requires admin access'}
                onChange={() => undefined}
              >
                {WORKSPACE_ROLES.map((role: WorkspaceRole) => (
                  <MenuItem key={role} value={role}>
                    {titleCase(role)}
                  </MenuItem>
                ))}
              </TextField>

              <Box>
                <ProgressWithLabel
                  value={Math.round((selected.allocatedHoursPerWeek / Math.max(1, selected.capacityHoursPerWeek)) * 100)}
                  label={`${selected.allocatedHoursPerWeek}h allocated of ${selected.capacityHoursPerWeek}h capacity`}
                  color={selected.allocatedHoursPerWeek > selected.capacityHoursPerWeek ? 'error' : 'primary'}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                  Skills
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {selected.skills.map((skill) => (
                    <Chip key={skill} size="small" label={skill} />
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                  Teams
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {selected.teamIds.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Not on a team
                    </Typography>
                  ) : (
                    selected.teamIds.map((id) => (
                      <Chip key={id} size="small" variant="outlined" label={state.teams.find((t) => t.id === id)?.name ?? id} />
                    ))
                  )}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                  Current projects
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {selectedProjects.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No active project assignments
                    </Typography>
                  ) : (
                    selectedProjects.map((project) => <Chip key={project.id} size="small" label={project.key} />)
                  )}
                </Stack>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Active work ({selectedTasks.filter((t) => !isDone(t)).length})
            </Typography>
            <TaskListTable tasks={selectedTasks.filter((t) => !isDone(t))} onOpenTask={openTask} height={360} />
          </Box>
        ) : null}
      </Drawer>
    </Box>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { Check, Lock, Plug, Plus, Shield, Cpu } from 'lucide-react';
import { SETTINGS_SECTIONS, paths, type SettingsSectionId } from '@/app/navigation';
import { TASK_STATUSES, WORKSPACE_ROLES } from '@/types/domain';
import { taskStatusTokens } from '@/app/tokens';
import { PageHeader } from '@/components/common/PageHeader';
import { UserAvatar } from '@/components/common/UserAvatar';
import { AvailabilityChip } from '@/components/common/TokenChip';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useColorMode } from '@/state/ColorModeProvider';
import { useToast } from '@/state/ToastProvider';
import { formatDateTime, titleCase } from '@/utils/format';
import * as chatApi from '@/api/chatApi';
import type { LMStudioHealth } from '@/types/chat';

const ROLE_PERMISSIONS: { capability: string; owner: boolean; admin: boolean; member: boolean; viewer: boolean }[] = [
  { capability: 'View projects and tasks', owner: true, admin: true, member: true, viewer: true },
  { capability: 'Create and edit tasks', owner: true, admin: true, member: true, viewer: false },
  { capability: 'Plan sprints and releases', owner: true, admin: true, member: true, viewer: false },
  { capability: 'Manage project settings', owner: true, admin: true, member: false, viewer: false },
  { capability: 'Invite and remove members', owner: true, admin: true, member: false, viewer: false },
  { capability: 'Change roles and permissions', owner: true, admin: false, member: false, viewer: false },
  { capability: 'Delete the workspace', owner: true, admin: false, member: false, viewer: false },
];

const INTEGRATIONS = [
  { id: 'chat', name: 'Team chat', description: 'Push status changes and mentions into channels.', connected: true },
  { id: 'scm', name: 'Source control', description: 'Link branches and pull requests to tasks.', connected: true },
  { id: 'calendar', name: 'Calendar', description: 'Sync milestones and release dates to calendars.', connected: false },
  { id: 'ci', name: 'CI pipeline', description: 'Surface build status on release readiness.', connected: false },
  { id: 'support', name: 'Support desk', description: 'Convert tickets into bugs with context.', connected: false },
];

export function SettingsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();
  const active = (SETTINGS_SECTIONS.find((s) => s.id === section)?.id ?? 'profile') as SettingsSectionId;

  return (
    <Box>
      <PageHeader
        title="Workspace settings"
        description="Configure the workspace, its people, its process and how it looks."
      />

      <Box sx={{ display: 'grid', '& > *': { minWidth: 0 }, gap: 2.5, gridTemplateColumns: { xs: '1fr', md: '240px minmax(0, 1fr)' } }}>
        <Paper variant="outlined" sx={{ borderRadius: 2.5, p: 1, alignSelf: 'start' }}>
          <List disablePadding component="nav" aria-label="Settings sections">
            {SETTINGS_SECTIONS.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  selected={item.id === active}
                  onClick={() => navigate(paths.settingsSection(item.id))}
                  sx={{ borderRadius: 1.5, mb: 0.25 }}
                >
                  <ListItemText primary={item.label} slotProps={{ primary: { variant: 'body2', fontWeight: item.id === active ? 650 : 500 } }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>

        <Box>
          {active === 'profile' ? <WorkspaceProfileSection /> : null}
          {active === 'members' ? <MembersSection /> : null}
          {active === 'roles' ? <RolesSection /> : null}
          {active === 'projects' ? <ProjectSettingsSection /> : null}
          {active === 'fields' ? <CustomFieldsSection /> : null}
          {active === 'statuses' ? <StatusSection /> : null}
          {active === 'chat-roles' ? <ChatRolesSection /> : null}
          {active === 'local-ai' ? <LocalAISection /> : null}
          {active === 'notifications' ? <NotificationsSection /> : null}
          {active === 'integrations' ? <IntegrationsSection /> : null}
          {active === 'appearance' ? <AppearanceSection /> : null}
          {active === 'audit' ? <AuditSection /> : null}
        </Box>
      </Box>
    </Box>
  );
}

function WorkspaceProfileSection(): React.JSX.Element {
  const { state } = useWorkspace();
  const { notify } = useToast();
  const workspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId) ?? state.workspaces[0]!;
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);

  return (
    <Card>
      <CardHeader title="Workspace profile" subheader="How this workspace is identified across Meridian" />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={2} sx={{ maxWidth: 520 }}>
          <TextField label="Workspace name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField
            label="URL slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            helperText={`meridian.app/${slug}`}
            fullWidth
          />
          <TextField select label="Plan" value={workspace.plan} fullWidth disabled helperText="Contact your account team to change plan">
            <MenuItem value="starter">Starter</MenuItem>
            <MenuItem value="growth">Growth</MenuItem>
            <MenuItem value="enterprise">Enterprise</MenuItem>
          </TextField>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => notify('Workspace profile saved')}>
              Save changes
            </Button>
            <Button
              color="inherit"
              onClick={() => {
                setName(workspace.name);
                setSlug(workspace.slug);
              }}
            >
              Reset
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function MembersSection(): React.JSX.Element {
  const { state, currentUser } = useWorkspace();
  const { notify } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const canManage = currentUser.role === 'owner' || currentUser.role === 'admin';

  return (
    <Card>
      <CardHeader
        title="Members"
        subheader={`${state.users.length} people in this workspace`}
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<Plus size={14} />}
            disabled={!canManage}
            onClick={() => setInviteOpen(true)}
          >
            Invite
          </Button>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {!canManage ? (
          <Alert severity="info" icon={<Lock size={16} />} sx={{ mb: 2 }}>
            Your role does not allow inviting or removing members.
          </Alert>
        ) : null}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Availability</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <UserAvatar user={user} size={28} showTooltip={false} />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={titleCase(user.role)} variant={user.role === 'owner' ? 'filled' : 'outlined'} />
                  </TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>
                    <AvailabilityChip availability={user.availability} />
                  </TableCell>
                  <TableCell>{user.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 650 }}>Invite a member</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              label="Work email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField select label="Role" defaultValue="member" fullWidth>
              {WORKSPACE_ROLES.filter((role) => role !== 'owner').map((role) => (
                <MenuItem key={role} value={role}>
                  {titleCase(role)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => setInviteOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!inviteEmail.includes('@')}
            onClick={() => {
              notify(`Invitation sent to ${inviteEmail}`, { severity: 'success' });
              setInviteEmail('');
              setInviteOpen(false);
            }}
          >
            Send invite
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

function RolesSection(): React.JSX.Element {
  return (
    <Card>
      <CardHeader title="Roles & permissions" subheader="What each workspace role can do" />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Capability</TableCell>
                {WORKSPACE_ROLES.map((role) => (
                  <TableCell key={role} align="center">
                    {titleCase(role)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {ROLE_PERMISSIONS.map((row) => (
                <TableRow key={row.capability} hover>
                  <TableCell>{row.capability}</TableCell>
                  {WORKSPACE_ROLES.map((role) => (
                    <TableCell key={role} align="center">
                      {row[role] ? (
                        <Box sx={{ display: 'inline-flex', color: 'success.main' }} aria-label="Allowed">
                          <Check size={15} />
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.disabled" aria-label="Not allowed">
                          —
                        </Typography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

function ProjectSettingsSection(): React.JSX.Element {
  const { state } = useWorkspace();
  const { notify } = useToast();
  const [defaultProject, setDefaultProject] = useState(state.projects[0]?.id ?? '');

  return (
    <Card>
      <CardHeader title="Project settings" subheader="Defaults applied to newly created projects" />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={2} sx={{ maxWidth: 520 }}>
          <TextField
            select
            label="Default project for quick create"
            value={defaultProject}
            onChange={(e) => setDefaultProject(e.target.value)}
            fullWidth
          >
            {state.projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.key} · {project.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Default sprint length" defaultValue="14" fullWidth>
            <MenuItem value="7">1 week</MenuItem>
            <MenuItem value="14">2 weeks</MenuItem>
            <MenuItem value="21">3 weeks</MenuItem>
          </TextField>
          <TextField select label="Default estimation scale" defaultValue="fibonacci" fullWidth>
            <MenuItem value="fibonacci">Fibonacci (1, 2, 3, 5, 8, 13)</MenuItem>
            <MenuItem value="linear">Linear (1–10)</MenuItem>
            <MenuItem value="tshirt">T-shirt sizes</MenuItem>
          </TextField>
          <FormControlLabel control={<Switch defaultChecked />} label="Require an estimate before a task enters a sprint" />
          <FormControlLabel control={<Switch defaultChecked />} label="Require a blocked reason when moving to Blocked" />
          <FormControlLabel control={<Switch />} label="Auto-archive tasks 90 days after completion" />
          <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => notify('Project defaults saved')}>
            Save defaults
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function CustomFieldsSection(): React.JSX.Element {
  const { state } = useWorkspace();
  return (
    <Card>
      <CardHeader title="Custom fields" subheader="Extra fields available on task records" />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Field</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Options</TableCell>
                <TableCell>Applies to</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.customFields.map((field) => (
                <TableRow key={field.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {field.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{titleCase(field.kind)}</TableCell>
                  <TableCell>
                    {field.options ? (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {field.options.map((option) => (
                          <Chip key={option} size="small" label={option} />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.disabled">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {field.appliesTo.map((type) => (
                        <Chip key={type} size="small" variant="outlined" label={titleCase(type)} />
                      ))}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

function StatusSection(): React.JSX.Element {
  const { state, dispatch } = useWorkspace();
  const { notify } = useToast();

  return (
    <Card>
      <CardHeader title="Status configuration" subheader="Which statuses appear as board columns" />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={1}>
          {TASK_STATUSES.map((status) => {
            const enabled = state.boardColumns.includes(status);
            const token = taskStatusTokens[status];
            return (
              <Stack
                key={status}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 1.5, py: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: token.color }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {token.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {state.tasks.filter((task) => task.status === status).length} tasks currently in this status
                    </Typography>
                  </Box>
                </Stack>
                <Switch
                  checked={enabled}
                  disabled={enabled}
                  onChange={() => {
                    dispatch({ type: 'board/addColumn', status });
                    notify(`${token.label} added to the board`);
                  }}
                  inputProps={{ 'aria-label': `Show ${token.label} as a board column` }}
                />
              </Stack>
            );
          })}
        </Stack>
        <Alert severity="info" sx={{ mt: 2 }}>
          Statuses already in use cannot be removed while tasks occupy them — move the work first.
        </Alert>
      </CardContent>
    </Card>
  );
}

function NotificationsSection(): React.JSX.Element {
  const { notify } = useToast();
  const rows = [
    { id: 'mention', label: 'Someone mentions me', email: true, push: true },
    { id: 'assigned', label: 'Work is assigned to me', email: true, push: true },
    { id: 'blocked', label: 'My work becomes blocked', email: true, push: false },
    { id: 'sprint', label: 'Sprint starts or closes', email: false, push: true },
    { id: 'release', label: 'Release readiness changes', email: true, push: false },
    { id: 'digest', label: 'Weekly delivery digest', email: true, push: false },
  ];

  return (
    <Card>
      <CardHeader title="Notification preferences" subheader="Per-event delivery for your account" />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell align="center">Email</TableCell>
                <TableCell align="center">In-app</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.label}</TableCell>
                  <TableCell align="center">
                    <Switch defaultChecked={row.email} inputProps={{ 'aria-label': `Email for ${row.label}` }} />
                  </TableCell>
                  <TableCell align="center">
                    <Switch defaultChecked={row.push} inputProps={{ 'aria-label': `In-app for ${row.label}` }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => notify('Notification preferences saved')}>
          Save preferences
        </Button>
      </CardContent>
    </Card>
  );
}

function IntegrationsSection(): React.JSX.Element {
  const { notify } = useToast();
  const [connected, setConnected] = useState<Record<string, boolean>>(
    Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i.connected])),
  );

  return (
    <Card>
      <CardHeader title="Integrations" subheader="Connect Meridian to the rest of your toolchain" />
      <CardContent sx={{ pt: 0 }}>
        <List disablePadding>
          {INTEGRATIONS.map((integration, index) => (
            <Box key={integration.id}>
              {index > 0 ? <Divider /> : null}
              <ListItem
                disableGutters
                secondaryAction={
                  <Button
                    size="small"
                    variant={connected[integration.id] ? 'outlined' : 'contained'}
                    color={connected[integration.id] ? 'inherit' : 'primary'}
                    onClick={() => {
                      setConnected((current) => ({ ...current, [integration.id]: !current[integration.id] }));
                      notify(
                        connected[integration.id]
                          ? `${integration.name} disconnected`
                          : `${integration.name} connected`,
                        { severity: connected[integration.id] ? 'info' : 'success' },
                      );
                    }}
                  >
                    {connected[integration.id] ? 'Disconnect' : 'Connect'}
                  </Button>
                }
                sx={{ py: 1.75 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Plug size={17} />
                </ListItemIcon>
                <ListItemText
                  primary={integration.name}
                  secondary={integration.description}
                  slotProps={{ primary: { variant: 'body2', fontWeight: 600 }, secondary: { variant: 'caption' } }}
                />
              </ListItem>
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

function AppearanceSection(): React.JSX.Element {
  const { mode, setMode } = useColorMode();

  return (
    <Card>
      <CardHeader title="Appearance" subheader="Theme and density for your account" />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={2.5} sx={{ maxWidth: 520 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Colour mode
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={mode}
              onChange={(_, value: 'light' | 'dark' | null) => value && setMode(value)}
              aria-label="Colour mode"
            >
              <ToggleButton value="light">Light</ToggleButton>
              <ToggleButton value="dark">Dark</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <FormControlLabel control={<Switch defaultChecked />} label="Show story points on board cards" />
          <FormControlLabel control={<Switch defaultChecked />} label="Show avatars in list views" />
          <FormControlLabel control={<Switch />} label="Compact row height in tables" />
        </Stack>
      </CardContent>
    </Card>
  );
}

const SDLC_ROLES: { id: string; label: string; track: string; seniority: string; optional: boolean }[] = [
  { id: 'cto', label: 'CTO', track: 'leadership', seniority: 'C-level', optional: false },
  { id: 'chief_architect', label: 'Chief Architect', track: 'leadership', seniority: 'C-level', optional: true },
  { id: 'project_manager', label: 'Project Manager', track: 'product', seniority: 'Senior', optional: false },
  { id: 'solution_architect', label: 'Solution Architect', track: 'platform', seniority: 'Senior', optional: true },
  { id: 'fe_manager', label: 'Frontend Manager', track: 'frontend', seniority: 'Manager', optional: true },
  { id: 'be_manager', label: 'Backend Manager', track: 'backend', seniority: 'Manager', optional: true },
  { id: 'full_stack_em', label: 'Full-Stack EM', track: 'platform', seniority: 'Manager', optional: false },
  { id: 'mobile_em', label: 'Mobile EM', track: 'mobile', seniority: 'Manager', optional: true },
  { id: 'fe_tech_lead', label: 'Frontend Tech Lead', track: 'frontend', seniority: 'Lead', optional: false },
  { id: 'be_tech_lead', label: 'Backend Tech Lead', track: 'backend', seniority: 'Lead', optional: false },
  { id: 'mobile_tech_lead', label: 'Mobile Tech Lead', track: 'mobile', seniority: 'Lead', optional: true },
  { id: 'senior_fe', label: 'Senior Frontend Dev', track: 'frontend', seniority: 'Senior', optional: false },
  { id: 'junior_fe', label: 'Junior Frontend Dev', track: 'frontend', seniority: 'Junior', optional: false },
  { id: 'senior_be', label: 'Senior Backend Dev', track: 'backend', seniority: 'Senior', optional: false },
  { id: 'junior_be', label: 'Junior Backend Dev', track: 'backend', seniority: 'Junior', optional: false },
  { id: 'rn_dev', label: 'React Native Dev', track: 'mobile', seniority: 'Mid', optional: true },
  { id: 'devops', label: 'DevOps Engineer', track: 'platform', seniority: 'Mid', optional: false },
  { id: 'ux_designer', label: 'UX Designer', track: 'design', seniority: 'Mid', optional: false },
  { id: 'ui_designer', label: 'UI Designer', track: 'design', seniority: 'Mid', optional: true },
  { id: 'qa_lead', label: 'QA Lead', track: 'qa', seniority: 'Lead', optional: false },
  { id: 'appsec', label: 'AppSec Engineer', track: 'security', seniority: 'Mid', optional: true },
];

const MIN_ROLES = 8;
const MAX_ROLES = 21;

const trackColor: Record<string, string> = {
  frontend: '#4A7BD4', backend: '#1E8F5E', mobile: '#B8690C', platform: '#7C3AED',
  design: '#DB2777', qa: '#EA580C', security: '#DC2626', product: '#5A4BE0', leadership: '#6366F1',
};

function ChatRolesSection(): React.JSX.Element {
  const { notify } = useToast();
  const [enabled, setEnabled] = useState<Set<string>>(new Set(SDLC_ROLES.map(r => r.id)));

  const toggleRole = (id: string) => {
    setEnabled(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= MIN_ROLES) {
          notify(`Minimum ${MIN_ROLES} roles required`, { severity: 'warning' });
          return prev;
        }
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const byTrack = SDLC_ROLES.reduce<Record<string, typeof SDLC_ROLES>>((acc, role) => {
    (acc[role.track] ||= []).push(role);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader
        title="Chat roles"
        subheader={`Configure which SDLC roles are active for routed work events (${enabled.size}/${MAX_ROLES} enabled, min ${MIN_ROLES})`}
        avatar={<Shield size={18} />}
      />
      <CardContent sx={{ pt: 0 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Roles determine who receives mandatory tickets when a work event is triggered. Disabled roles are skipped during playbook routing.
        </Alert>

        {Object.entries(byTrack).sort(([a], [b]) => a.localeCompare(b)).map(([track, roles]) => (
          <Box key={track} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: trackColor[track] || '#8D96A8' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                {track}
              </Typography>
            </Stack>
            {roles.map(role => (
              <Stack
                key={role.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 1.5, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, mb: 0.5 }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{role.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {role.seniority} · {role.optional ? 'Optional' : 'Core'}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={role.track} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.625rem' }} />
                  <Switch
                    checked={enabled.has(role.id)}
                    onChange={() => toggleRole(role.id)}
                    inputProps={{ 'aria-label': `Enable ${role.label}` }}
                  />
                </Stack>
              </Stack>
            ))}
          </Box>
        ))}

        <Button
          variant="contained"
          sx={{ mt: 1 }}
          onClick={() => notify(`${enabled.size} chat roles saved`, { severity: 'success' })}
        >
          Save role configuration
        </Button>
      </CardContent>
    </Card>
  );
}

function LocalAISection(): React.JSX.Element {
  const { notify } = useToast();
  const [baseUrl, setBaseUrl] = useState('http://127.0.0.1:1234/v1');
  const [apiKey, setApiKey] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [timeoutSec, setTimeoutSec] = useState(300);
  const [health, setHealth] = useState<LMStudioHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await chatApi.getLMStudio();
      setBaseUrl(data.config.base_url || 'http://127.0.0.1:1234/v1');
      setApiKey(data.config.api_key || '');
      setDefaultModel(data.config.default_model || '');
      setTimeoutSec(data.config.timeout_sec || 300);
      setHealth(data.health);
    } catch (err) {
      setHealth({ ok: false, error: err instanceof Error ? err.message : 'Failed to load LM Studio config' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const data = await chatApi.putLMStudio({
        base_url: baseUrl,
        api_key: apiKey,
        default_model: defaultModel,
        timeout_sec: timeoutSec,
      });
      setHealth(data.health);
      notify(data.health?.ok ? 'Local AI settings saved — LM Studio healthy' : 'Saved — LM Studio not reachable yet', {
        severity: data.health?.ok ? 'success' : 'warning',
      });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', { severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const modelOptions = (health?.models || [])
    .map((m) => {
      if (m && typeof m === 'object' && 'id' in m) return String((m as { id: string }).id);
      return '';
    })
    .filter(Boolean);

  return (
    <Card>
      <CardHeader
        avatar={<Cpu size={20} />}
        title="Local AI (LM Studio)"
        subheader="CGen agents call a local OpenAI-compatible endpoint. No cloud keys required."
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={2} sx={{ maxWidth: 560 }}>
          {health?.ok ? (
            <Alert severity="success">Healthy · {health.count ?? 0} model(s) at {health.base_url}</Alert>
          ) : (
            <Alert severity="warning">
              {health?.error || (loading ? 'Checking LM Studio…' : 'LM Studio not reachable. Start it locally and load a model.')}
            </Alert>
          )}
          <TextField label="Base URL" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} fullWidth helperText="Default http://127.0.0.1:1234/v1" />
          <TextField label="API key (optional)" value={apiKey} onChange={(e) => setApiKey(e.target.value)} fullWidth />
          {modelOptions.length > 0 ? (
            <TextField select label="Default model" value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} fullWidth>
              <MenuItem value="">(none)</MenuItem>
              {modelOptions.map((id) => (
                <MenuItem key={id} value={id}>{id}</MenuItem>
              ))}
            </TextField>
          ) : (
            <TextField label="Default model" value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} fullWidth helperText="Leave blank to let LM Studio pick the loaded model" />
          )}
          <TextField
            label="Timeout (seconds)"
            type="number"
            value={timeoutSec}
            onChange={(e) => setTimeoutSec(Number(e.target.value) || 300)}
            fullWidth
          />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => void save()} disabled={saving || loading}>
              Save
            </Button>
            <Button color="inherit" onClick={() => void refresh()} disabled={loading}>
              Refresh health
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function AuditSection(): React.JSX.Element {
  const { state, userById, projectById } = useWorkspace();

  return (
    <Card>
      <CardHeader title="Audit activity" subheader="Recent changes recorded across the workspace" />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer sx={{ maxHeight: 520 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Event</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.activities.slice(0, 60).map((activity) => (
                <TableRow key={activity.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(activity.createdAt)}</TableCell>
                  <TableCell>{userById(activity.actorId)?.name ?? '—'}</TableCell>
                  <TableCell>{projectById(activity.projectId)?.key ?? '—'}</TableCell>
                  <TableCell>{activity.summary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

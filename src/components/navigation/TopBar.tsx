import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Select from '@mui/material/Select';
import {
  Bell,
  BookOpen,
  CircleHelp,
  FolderPlus,
  Keyboard,
  LifeBuoy,
  Layers,
  Menu as MenuIcon,
  Moon,
  Plus,
  Search,
  Shield,
  Sun,
  GanttChartSquare,
  SquareCheck,
  LogOut,
  UserCog,
} from 'lucide-react';
import { PERSONA_ROLES, type PersonaRole } from '@/types/domain';
import { paths } from '@/app/navigation';
import { useColorMode } from '@/state/ColorModeProvider';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useUi } from '@/state/UiProvider';
import { GlobalSearch } from './GlobalSearch';
import { UserAvatar } from '@/components/common/UserAvatar';
import { formatRelative } from '@/utils/format';
import { EmptyState } from '@/components/common/States';

interface TopBarProps {
  onOpenMobileNav: () => void;
}

const SEGMENT_LABELS: Record<string, string> = {
  'my-work': 'My Work',
  projects: 'Projects',
  roadmap: 'Roadmap',
  calendar: 'Calendar',
  backlog: 'Backlog',
  sprints: 'Sprints',
  releases: 'Releases',
  reports: 'Reports',
  teams: 'Teams',
  documents: 'Documents',
  settings: 'Settings',
};

export function TopBar({ onOpenMobileNav }: TopBarProps): React.JSX.Element {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggle } = useColorMode();
  const { state, dispatch, currentUser, projectById } = useWorkspace();
  const { openCreateTask, openCreateProject, openCreateSprint, openCreateRoadmapItem, activeRole, setActiveRole } = useUi();

  const [createAnchor, setCreateAnchor] = useState<HTMLElement | null>(null);
  const [helpAnchor, setHelpAnchor] = useState<HTMLElement | null>(null);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const unread = state.notifications.filter((n) => !n.read).length;

  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = segments.map((segment, index) => {
    const to = `/${segments.slice(0, index + 1).join('/')}`;
    const project = projectById(segment);
    const label = project ? `${project.key} · ${project.name}` : (SEGMENT_LABELS[segment] ?? decodeURIComponent(segment));
    return { to, label, isLast: index === segments.length - 1 };
  });

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        color="inherit"
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, md: 60 }, gap: 1, px: { xs: 1.5, md: 2.5 } }}>
          {isMobile ? (
            <IconButton edge="start" onClick={onOpenMobileNav} aria-label="Open navigation">
              <MenuIcon size={19} />
            </IconButton>
          ) : null}

          {/* Breadcrumbs / title */}
          <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            {crumbs.length === 0 ? (
              <Typography variant="h5" component="h1" noWrap>
                Home
              </Typography>
            ) : (
              <Breadcrumbs
                separator="/"
                aria-label="Breadcrumb"
                sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap', overflow: 'hidden' }, minWidth: 0, overflow: 'hidden' }}
              >
                <Link component={RouterLink} to={paths.home} underline="hover" color="text.secondary" variant="body2">
                  Home
                </Link>
                {crumbs.map((crumb) =>
                  crumb.isLast ? (
                    <Typography key={crumb.to} variant="body2" color="text.primary" fontWeight={650} noWrap>
                      {crumb.label}
                    </Typography>
                  ) : (
                    <Link
                      key={crumb.to}
                      component={RouterLink}
                      to={crumb.to}
                      underline="hover"
                      color="text.secondary"
                      variant="body2"
                      noWrap
                    >
                      {crumb.label}
                    </Link>
                  ),
                )}
              </Breadcrumbs>
            )}
          </Box>

          {!isMobile ? <GlobalSearch /> : null}

          <Stack direction="row" spacing={0.5} alignItems="center">
            {isMobile ? (
              <IconButton onClick={() => setMobileSearchOpen(true)} aria-label="Search">
                <Search size={18} />
              </IconButton>
            ) : null}

            {isMobile ? (
              <IconButton
                color="primary"
                onClick={(e) => setCreateAnchor(e.currentTarget)}
                aria-label="Quick create"
                aria-haspopup="menu"
              >
                <Plus size={19} />
              </IconButton>
            ) : (
              <Button
                variant="contained"
                startIcon={<Plus size={15} />}
                onClick={(e) => setCreateAnchor(e.currentTarget)}
                aria-haspopup="menu"
              >
                Create
              </Button>
            )}

            <Tooltip title="Notifications">
              <IconButton onClick={() => setNotificationsOpen(true)} aria-label={`Notifications, ${unread} unread`}>
                <Badge badgeContent={unread} color="error">
                  <Bell size={18} />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Help">
              <IconButton onClick={(e) => setHelpAnchor(e.currentTarget)} aria-label="Help menu" aria-haspopup="menu">
                <CircleHelp size={18} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Switch persona to see role-based views">
              <Select<PersonaRole>
                size="small"
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as PersonaRole)}
                renderValue={(value) => (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Shield size={14} />
                    <Typography variant="caption" fontWeight={600}>{value}</Typography>
                  </Stack>
                )}
                sx={{
                  minWidth: 100,
                  height: 32,
                  '& .MuiSelect-select': { py: 0.5, pl: 1, pr: 2.5, display: 'flex', alignItems: 'center' },
                }}
                aria-label="Role switcher"
              >
                {PERSONA_ROLES.map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </Tooltip>

            <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              <IconButton onClick={toggle} aria-label="Toggle colour mode">
                {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </IconButton>
            </Tooltip>

            <Tooltip title={currentUser.name}>
              <IconButton
                onClick={(e) => setProfileAnchor(e.currentTarget)}
                aria-label="Account menu"
                aria-haspopup="menu"
                sx={{ ml: 0.25 }}
              >
                <UserAvatar user={currentUser} size={28} showTooltip={false} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Quick create */}
      <Menu anchorEl={createAnchor} open={Boolean(createAnchor)} onClose={() => setCreateAnchor(null)}>
        <MenuItem
          onClick={() => {
            setCreateAnchor(null);
            openCreateTask();
          }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <SquareCheck size={16} />
          </ListItemIcon>
          <ListItemText primary="Task" secondary="Story, bug or technical task" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateAnchor(null);
            openCreateProject();
          }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <FolderPlus size={16} />
          </ListItemIcon>
          <ListItemText primary="Project" secondary="New delivery workspace" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateAnchor(null);
            openCreateSprint();
          }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <Layers size={16} />
          </ListItemIcon>
          <ListItemText primary="Sprint" secondary="Plan the next iteration" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateAnchor(null);
            openCreateRoadmapItem();
          }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <GanttChartSquare size={16} />
          </ListItemIcon>
          <ListItemText primary="Roadmap item" secondary="Initiative, epic or milestone" />
        </MenuItem>
      </Menu>

      {/* Help */}
      <Menu anchorEl={helpAnchor} open={Boolean(helpAnchor)} onClose={() => setHelpAnchor(null)}>
        <MenuItem onClick={() => setHelpAnchor(null)}>
          <ListItemIcon sx={{ minWidth: 28 }}>
            <BookOpen size={15} />
          </ListItemIcon>
          Product guide
        </MenuItem>
        <MenuItem onClick={() => setHelpAnchor(null)}>
          <ListItemIcon sx={{ minWidth: 28 }}>
            <Keyboard size={15} />
          </ListItemIcon>
          Keyboard shortcuts
        </MenuItem>
        <MenuItem onClick={() => setHelpAnchor(null)}>
          <ListItemIcon sx={{ minWidth: 28 }}>
            <LifeBuoy size={15} />
          </ListItemIcon>
          Contact support
        </MenuItem>
      </Menu>

      {/* Profile */}
      <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}>
        <Box sx={{ px: 2, py: 1.25, minWidth: 220 }}>
          <Typography variant="subtitle2">{currentUser.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {currentUser.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            setProfileAnchor(null);
            navigate(paths.myWork);
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <SquareCheck size={15} />
          </ListItemIcon>
          My work
        </MenuItem>
        <MenuItem
          onClick={() => {
            setProfileAnchor(null);
            navigate(paths.settingsSection('profile'));
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <UserCog size={15} />
          </ListItemIcon>
          Workspace settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setProfileAnchor(null)}>
          <ListItemIcon sx={{ minWidth: 28 }}>
            <LogOut size={15} />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>

      {/* Notifications drawer */}
      <Drawer
        anchor="right"
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 380 } } } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2 }}>
          <Typography variant="h5">Notifications</Typography>
          <Button size="small" onClick={() => dispatch({ type: 'notification/markAllRead' })} disabled={unread === 0}>
            Mark all read
          </Button>
        </Stack>
        <Divider />
        {state.notifications.length === 0 ? (
          <EmptyState title="Nothing to catch up on" description="You are all caught up." />
        ) : (
          <List disablePadding>
            {state.notifications.map((notification) => (
              <ListItemButton
                key={notification.id}
                onClick={() => {
                  dispatch({ type: 'notification/markRead', id: notification.id });
                  if (notification.link) navigate(notification.link);
                  setNotificationsOpen(false);
                }}
                sx={{
                  alignItems: 'flex-start',
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Alert
                    severity={notification.severity}
                    variant="outlined"
                    sx={{ py: 0.25, mb: 0.75, border: 'none', px: 0, '& .MuiAlert-message': { py: 0 } }}
                  >
                    <Typography variant="subtitle2">{notification.title}</Typography>
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    {notification.body}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {formatRelative(notification.createdAt)}
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
          </List>
        )}
      </Drawer>

      {/* Mobile search */}
      <Drawer anchor="top" open={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)}>
        <Box sx={{ p: 2 }}>
          <GlobalSearch compact />
        </Box>
      </Drawer>
    </>
  );
}

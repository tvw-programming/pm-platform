import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import { alpha, useTheme } from '@mui/material/styles';
import { Check, ChevronsLeft, ChevronsRight, ChevronDown, Compass } from 'lucide-react';
import { navSections } from '@/app/navigation';
import { layout } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { isDone } from '@/utils/selectors';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isMobile: boolean;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  isMobile,
}: SidebarProps): React.JSX.Element {
  const width = collapsed && !isMobile ? layout.sidebarCollapsedWidth : layout.sidebarWidth;

  const content = (
    <SidebarContent collapsed={collapsed && !isMobile} onToggleCollapse={onToggleCollapse} isMobile={isMobile} onNavigate={onCloseMobile} />
  );

  if (isMobile) {
    return (
      <Drawer
        open={mobileOpen}
        onClose={onCloseMobile}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: layout.sidebarWidth, boxSizing: 'border-box' } }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        transition: (t) => t.transitions.create('width', { duration: 180 }),
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: (t) => t.transitions.create('width', { duration: 180 }),
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {content}
    </Drawer>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  onNavigate: () => void;
}

function SidebarContent({ collapsed, onToggleCollapse, isMobile, onNavigate }: SidebarContentProps): React.JSX.Element {
  const theme = useTheme();
  const location = useLocation();
  const { state, dispatch, visibleTasks } = useWorkspace();

  const badges = useMemo(() => {
    const mine = visibleTasks.filter((t) => t.assigneeId === state.currentUserId && !isDone(t));
    return { myOpenWork: mine.length, blocked: visibleTasks.filter((t) => t.status === 'blocked').length };
  }, [visibleTasks, state.currentUserId]);

  const activeWorkspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId) ?? state.workspaces[0]!;
  const [switcherAnchor, setSwitcherAnchor] = useState<HTMLElement | null>(null);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      {/* Brand + workspace switcher */}
      <Box sx={{ px: collapsed ? 1 : 2, pt: 2, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2, px: collapsed ? 0.5 : 0 }}>
          <Box
            aria-hidden
            sx={{
              width: 30,
              height: 30,
              flexShrink: 0,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Compass size={17} />
          </Box>
          {!collapsed ? (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 750, letterSpacing: '-0.01em' }}>
                CGen
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                Product delivery
              </Typography>
            </Box>
          ) : null}
        </Stack>

        <Tooltip title={collapsed ? activeWorkspace.name : ''} placement="right">
          <Button
            fullWidth
            onClick={(event) => setSwitcherAnchor(event.currentTarget)}
            aria-haspopup="menu"
            aria-label={`Switch workspace. Current workspace ${activeWorkspace.name}`}
            endIcon={collapsed ? undefined : <ChevronDown size={14} />}
            sx={{
              justifyContent: collapsed ? 'center' : 'space-between',
              bgcolor: alpha(theme.palette.text.primary, 0.04),
              color: 'text.primary',
              px: collapsed ? 1 : 1.25,
              minWidth: 0,
              '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.07) },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <Box
                aria-hidden
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: 0.75,
                  flexShrink: 0,
                  bgcolor: activeWorkspace.color,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {activeWorkspace.name.charAt(0)}
              </Box>
              {!collapsed ? (
                <Typography variant="body2" noWrap fontWeight={600}>
                  {activeWorkspace.name}
                </Typography>
              ) : null}
            </Stack>
          </Button>
        </Tooltip>
        <Menu
          anchorEl={switcherAnchor}
          open={Boolean(switcherAnchor)}
          onClose={() => setSwitcherAnchor(null)}
          slotProps={{ list: { dense: true } }}
        >
          <Typography variant="overline" color="text.secondary" sx={{ px: 2, py: 0.5, display: 'block' }}>
            Workspaces
          </Typography>
          {state.workspaces.map((workspace) => (
            <MenuItem
              key={workspace.id}
              selected={workspace.id === activeWorkspace.id}
              onClick={() => {
                dispatch({ type: 'workspace/switch', workspaceId: workspace.id });
                setSwitcherAnchor(null);
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <Box
                  aria-hidden
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: 0.75,
                    bgcolor: workspace.color,
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {workspace.name.charAt(0)}
                </Box>
              </ListItemIcon>
              <ListItemText primary={workspace.name} secondary={workspace.plan} />
              {workspace.id === activeWorkspace.id ? <Check size={14} /> : null}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <Divider />

      {/* Navigation */}
      <Box component="nav" aria-label="Main navigation" sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {navSections.map((section) => (
          <Box key={section.id} sx={{ mb: 0.5 }}>
            {section.label && !collapsed ? (
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ px: 2.5, pt: 1.5, pb: 0.5, display: 'block' }}
              >
                {section.label}
              </Typography>
            ) : null}
            {section.label && collapsed ? <Divider sx={{ my: 1, mx: 1.5 }} /> : null}
            <List disablePadding sx={{ px: 1 }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.matchPrefix
                  ? location.pathname.startsWith(item.matchPrefix)
                  : location.pathname === item.to;
                const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

                return (
                  <ListItem key={item.id} disablePadding sx={{ mb: 0.25 }}>
                    <Tooltip title={collapsed ? item.label : ''} placement="right">
                      <ListItemButton
                        component={NavLink}
                        to={item.to}
                        onClick={isMobile ? onNavigate : undefined}
                        selected={active}
                        aria-current={active ? 'page' : undefined}
                        sx={{
                          minHeight: 38,
                          px: collapsed ? 1.25 : 1.5,
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          color: active ? 'primary.main' : 'text.secondary',
                          '&.Mui-selected': {
                            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.09 : 0.16),
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.22),
                            },
                          },
                          '&:hover': { color: 'text.primary' },
                        }}
                      >
                        <ListItemIcon
                          sx={{ minWidth: collapsed ? 0 : 30, color: 'inherit', justifyContent: 'center' }}
                        >
                          <Badge
                            color="primary"
                            variant="dot"
                            invisible={!collapsed || badgeCount === 0}
                            overlap="circular"
                          >
                            <Icon size={17} aria-hidden />
                          </Badge>
                        </ListItemIcon>
                        {!collapsed ? (
                          <>
                            <ListItemText
                              primary={item.label}
                              slotProps={{
                                primary: {
                                  variant: 'body2',
                                  fontWeight: active ? 650 : 550,
                                  noWrap: true,
                                },
                              }}
                            />
                            {badgeCount > 0 ? (
                              <Box
                                component="span"
                                aria-label={`${badgeCount} items`}
                                sx={{
                                  ml: 1,
                                  px: 0.75,
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  bgcolor: alpha(theme.palette.primary.main, 0.14),
                                  color: 'primary.main',
                                }}
                              >
                                {badgeCount}
                              </Box>
                            ) : null}
                          </>
                        ) : null}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {!isMobile ? (
        <>
          <Divider />
          <Box sx={{ p: 1, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
            <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
              <IconButton
                size="small"
                onClick={onToggleCollapse}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-expanded={!collapsed}
              >
                {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : null}
    </Box>
  );
}

import { Suspense, useMemo, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { X } from 'lucide-react';
import type { ID } from '@/types/domain';
import { layout } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useCan } from '@/hooks/useCan';
import { drawerTabs, type DrawerTab } from './tabRegistry';

interface DetailDrawerProps {
  taskId: ID | null;
  onClose: () => void;
}

function TabFallback() {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
      <CircularProgress size={24} />
    </Stack>
  );
}

export function DetailDrawer({ taskId, onClose }: DetailDrawerProps): React.JSX.Element {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { state, taskById, projectById } = useWorkspace();
  const can = useCan();

  const task = taskById(taskId ?? undefined);
  const project = projectById(task?.projectId);
  const open = task !== undefined;

  const visibleTabs = useMemo<DrawerTab[]>(
    () => drawerTabs.filter((tab) => !tab.permission || can(tab.permission)),
    [can],
  );

  const [activeTabId, setActiveTabId] = useState(visibleTabs[0]?.id ?? 'overview');

  const activeTab = visibleTabs.find((t) => t.id === activeTabId) ?? visibleTabs[0];

  const counts = useMemo(() => {
    if (!task) return {} as Record<string, number>;
    return {
      comments: state.comments.filter((c) => c.taskId === task.id).length,
      todos: task.checklist.length,
      attachments: state.attachments.filter((a) => a.taskId === task.id).length,
      requirements: 0,
    };
  }, [task, state.comments, state.attachments]);

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100%' : layout.taskDrawerWidth,
            height: isMobile ? '92vh' : '100%',
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
          },
        },
      }}
      aria-label="Task detail drawer"
    >
      {task && project ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                <Chip
                  size="small"
                  label={task.key}
                  sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', fontWeight: 700 }}
                />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {project.name}
                </Typography>
              </Stack>
              <Tooltip title="Close">
                <IconButton size="small" onClick={onClose} aria-label="Close detail drawer">
                  <X size={17} />
                </IconButton>
              </Tooltip>
            </Stack>

            <Typography variant="h5" sx={{ mt: 1.5, fontWeight: 700 }}>
              {task.title}
            </Typography>
          </Box>

          {/* Tab bar with count badges */}
          <Tabs
            value={activeTab?.id ?? false}
            onChange={(_, value: string) => setActiveTabId(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            {visibleTabs.map((tab) => {
              const count = tab.countKey ? counts[tab.countKey] : undefined;
              return (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  label={
                    count !== undefined && count > 0 ? (
                      <Badge badgeContent={count} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
                        <span>{tab.label}</span>
                      </Badge>
                    ) : (
                      tab.label
                    )
                  }
                />
              );
            })}
          </Tabs>

          {/* Tab content */}
          <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
            {activeTab ? (
              <Suspense fallback={<TabFallback />}>
                <activeTab.component taskId={task.id} />
              </Suspense>
            ) : null}
          </Box>
        </Box>
      ) : null}
    </Drawer>
  );
}

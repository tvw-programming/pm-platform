import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { addMonths, startOfMonth } from 'date-fns';
import { Plus, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { ID, RoadmapItemKind } from '@/types/domain';
import { ROADMAP_ITEM_KINDS } from '@/types/domain';
import { layout, roadmapKindTokens } from '@/app/tokens';
import { PageHeader } from '@/components/common/PageHeader';
import { RoadmapTimeline, type RoadmapGrouping } from '@/components/roadmap/RoadmapTimeline';
import { HealthChip, PriorityChip, RoadmapKindChip } from '@/components/common/TokenChip';
import { ProgressWithLabel } from '@/components/common/ProgressWithLabel';
import { EmptyState } from '@/components/common/States';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useUi } from '@/state/UiProvider';
import { formatDate, formatShortDate } from '@/utils/format';

interface RoadmapPageProps {
  projectId?: ID;
  embedded?: boolean;
}

const RANGE_OPTIONS = [
  { months: 3, label: '3 months' },
  { months: 6, label: '6 months' },
  { months: 12, label: '12 months' },
] as const;

export function RoadmapPage({ projectId, embedded = false }: RoadmapPageProps): React.JSX.Element {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { state, userById, projectById } = useWorkspace();
  const { openCreateRoadmapItem } = useUi();

  const [grouping, setGrouping] = useState<RoadmapGrouping>('productArea');
  const [kindFilter, setKindFilter] = useState<RoadmapItemKind | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<ID | 'all'>(projectId ?? 'all');
  const [rangeMonths, setRangeMonths] = useState<number>(6);
  const [selectedId, setSelectedId] = useState<ID | null>(null);

  const items = useMemo(
    () =>
      state.roadmapItems.filter((item) => {
        if (projectId && item.projectId !== projectId) return false;
        if (!projectId && projectFilter !== 'all' && item.projectId !== projectFilter) return false;
        if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
        return true;
      }),
    [state.roadmapItems, projectId, projectFilter, kindFilter],
  );

  const windowStart = useMemo(() => startOfMonth(addMonths(new Date(), -1)), []);
  const windowEnd = useMemo(() => addMonths(windowStart, rangeMonths), [windowStart, rangeMonths]);

  const selected = items.find((item) => item.id === selectedId);
  const risksForSelected = state.risks.filter((risk) => selected && risk.projectId === selected.projectId);

  return (
    <Box>
      {!embedded ? (
        <PageHeader
          title="Product roadmap"
          description="Initiatives, epics, features, milestones and releases on one timeline, grouped the way your planning conversation runs."
          actions={
            <Button variant="contained" startIcon={<Plus size={15} />} onClick={() => openCreateRoadmapItem(projectId)}>
              Create roadmap item
            </Button>
          }
        />
      ) : null}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems={{ md: 'center' }}>
        <TextField
          select
          label="Group by"
          value={grouping}
          onChange={(e) => setGrouping(e.target.value as RoadmapGrouping)}
          sx={{ width: { xs: '100%', md: 180 } }}
        >
          <MenuItem value="productArea">Product area</MenuItem>
          <MenuItem value="team">Team</MenuItem>
          <MenuItem value="quarter">Quarter</MenuItem>
          <MenuItem value="project">Project</MenuItem>
        </TextField>

        <TextField
          select
          label="Item type"
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as RoadmapItemKind | 'all')}
          sx={{ width: { xs: '100%', md: 160 } }}
        >
          <MenuItem value="all">All types</MenuItem>
          {ROADMAP_ITEM_KINDS.map((kind) => (
            <MenuItem key={kind} value={kind}>
              {roadmapKindTokens[kind].label}
            </MenuItem>
          ))}
        </TextField>

        {!projectId ? (
          <TextField
            select
            label="Project"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value as ID | 'all')}
            sx={{ width: { xs: '100%', md: 220 } }}
          >
            <MenuItem value="all">All projects</MenuItem>
            {state.projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.key} · {project.name}
              </MenuItem>
            ))}
          </TextField>
        ) : null}

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton
            size="small"
            aria-label="Zoom in"
            onClick={() => setRangeMonths((m) => Math.max(3, m === 12 ? 6 : 3))}
          >
            <ZoomIn size={16} />
          </IconButton>
          <TextField
            select
            label="Range"
            value={rangeMonths}
            onChange={(e) => setRangeMonths(Number(e.target.value))}
            sx={{ width: 140 }}
          >
            {RANGE_OPTIONS.map((option) => (
              <MenuItem key={option.months} value={option.months}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <IconButton
            size="small"
            aria-label="Zoom out"
            onClick={() => setRangeMonths((m) => Math.min(12, m === 3 ? 6 : 12))}
          >
            <ZoomOut size={16} />
          </IconButton>
        </Stack>
      </Stack>

      {items.length === 0 ? (
        <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
          <EmptyState
            title="Nothing on the roadmap"
            description="Add an initiative or epic to start shaping the plan."
            action={
              <Button variant="contained" startIcon={<Plus size={15} />} onClick={() => openCreateRoadmapItem(projectId)}>
                Create roadmap item
              </Button>
            }
          />
        </Paper>
      ) : (
        <>
          {isDesktop ? (
            <Box sx={{ mb: 3 }}>
              <RoadmapTimeline
                items={items}
                grouping={grouping}
                selectedId={selectedId}
                onSelect={setSelectedId}
                windowStart={windowStart}
                windowEnd={windowEnd}
                height={embedded ? 420 : 520}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Scroll horizontally to pan. Hold Ctrl and scroll to zoom. Select an item to open its details.
              </Typography>
            </Box>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              The timeline is replaced by a grouped table on small screens — every field stays available.
            </Alert>
          )}

          {/* Table companion: the accessible, small-screen-friendly view of the same data. */}
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Progress</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Health</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    selected={item.id === selectedId}
                    onClick={() => setSelectedId(item.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.productArea} · {projectById(item.projectId)?.key}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <RoadmapKindChip kind={item.kind} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <UserAvatar user={userById(item.ownerId)} size={22} />
                        <Typography variant="body2" noWrap>
                          {userById(item.ownerId)?.name ?? '—'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{state.teams.find((t) => t.id === item.teamId)?.key ?? '—'}</TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {formatShortDate(item.startDate)} – {formatShortDate(item.endDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <ProgressWithLabel value={item.progress} size="sm" />
                    </TableCell>
                    <TableCell>
                      <PriorityChip priority={item.priority} />
                    </TableCell>
                    <TableCell>
                      <HealthChip health={item.health} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Drawer
        anchor="right"
        open={selected !== undefined}
        onClose={() => setSelectedId(null)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: layout.detailDrawerWidth } } } }}
      >
        {selected ? (
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
              <RoadmapKindChip kind={selected.kind} emphasis="soft" />
              <IconButton size="small" onClick={() => setSelectedId(null)} aria-label="Close roadmap item details">
                <X size={16} />
              </IconButton>
            </Stack>
            <Typography variant="h4" sx={{ mt: 1.5 }}>
              {selected.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {selected.description}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.5}>
              <DetailRow label="Project" value={projectById(selected.projectId)?.name ?? '—'} />
              <DetailRow label="Product area" value={selected.productArea} />
              <DetailRow label="Owner" value={userById(selected.ownerId)?.name ?? '—'} />
              <DetailRow label="Team" value={state.teams.find((t) => t.id === selected.teamId)?.name ?? '—'} />
              <DetailRow label="Starts" value={formatDate(selected.startDate)} />
              <DetailRow label="Target" value={formatDate(selected.endDate)} />
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary" sx={{ width: 110, flexShrink: 0 }}>
                  Priority
                </Typography>
                <PriorityChip priority={selected.priority} />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary" sx={{ width: 110, flexShrink: 0 }}>
                  Health
                </Typography>
                <HealthChip health={selected.health} />
              </Stack>
              <Box>
                <ProgressWithLabel value={selected.progress} label="Progress" />
              </Box>
            </Stack>

            {selected.dependsOnIds.length > 0 ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Depends on
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {selected.dependsOnIds.map((id) => (
                    <Chip
                      key={id}
                      size="small"
                      variant="outlined"
                      label={state.roadmapItems.find((candidate) => candidate.id === id)?.title ?? id}
                      onClick={() => setSelectedId(id)}
                    />
                  ))}
                </Stack>
              </>
            ) : null}

            {risksForSelected.length > 0 ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Project risks
                </Typography>
                <Stack spacing={1}>
                  {risksForSelected.map((risk) => (
                    <Alert
                      key={risk.id}
                      severity={
                        risk.severity === 'critical' || risk.severity === 'high'
                          ? 'error'
                          : risk.severity === 'medium'
                            ? 'warning'
                            : 'info'
                      }
                      variant="outlined"
                    >
                      <Typography variant="subtitle2">{risk.title}</Typography>
                      <Typography variant="caption">{risk.mitigation}</Typography>
                    </Alert>
                  ))}
                </Stack>
              </>
            ) : null}
          </Box>
        ) : null}
      </Drawer>
    </Box>
  );
}

function DetailRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <Stack direction="row" spacing={1} alignItems="baseline">
      <Typography variant="caption" color="text.secondary" sx={{ width: 110, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

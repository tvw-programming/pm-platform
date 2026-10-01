import { useEffect, useMemo, useRef } from 'react';
import { Timeline, type TimelineOptions } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { alpha, useTheme } from '@mui/material/styles';
import type { ID, RoadmapItem } from '@/types/domain';
import { roadmapKindTokens } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';

export type RoadmapGrouping = 'productArea' | 'team' | 'quarter' | 'project';

interface RoadmapTimelineProps {
  items: RoadmapItem[];
  grouping: RoadmapGrouping;
  selectedId: ID | null;
  onSelect: (itemId: ID | null) => void;
  /** Controls the visible window; bumping it re-fits the timeline. */
  windowStart?: Date;
  windowEnd?: Date;
  height?: number;
}

function quarterOf(dateIso: string): string {
  const date = new Date(dateIso);
  return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
}

/**
 * vis-timeline is imperative, so this component owns a single Timeline
 * instance and syncs DataSets on prop change rather than re-creating it.
 */
export function RoadmapTimeline({
  items,
  grouping,
  selectedId,
  onSelect,
  windowStart,
  windowEnd,
  height = 520,
}: RoadmapTimelineProps): React.JSX.Element {
  const theme = useTheme();
  const { state, userById, projectById } = useWorkspace();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<Timeline | null>(null);

  const { visItems, visGroups } = useMemo(() => {
    const groupKeyFor = (item: RoadmapItem): string => {
      switch (grouping) {
        case 'team':
          return state.teams.find((t) => t.id === item.teamId)?.name ?? 'Unassigned team';
        case 'quarter':
          return quarterOf(item.startDate);
        case 'project':
          return projectById(item.projectId)?.name ?? 'Unknown project';
        case 'productArea':
        default:
          return item.productArea;
      }
    };

    const groupNames = Array.from(new Set(items.map(groupKeyFor))).sort();

    return {
      visGroups: groupNames.map((name) => ({ id: name, content: name })),
      visItems: items.map((item) => {
        const token = roadmapKindTokens[item.kind];
        const owner = userById(item.ownerId);
        const isPoint = item.kind === 'milestone' || item.startDate === item.endDate;
        const dependencyNote =
          item.dependsOnIds.length > 0
            ? `<div class="mrd-dep">depends on ${item.dependsOnIds
                .map((id) => items.find((candidate) => candidate.id === id)?.title ?? id)
                .join(', ')}</div>`
            : '';

        return {
          id: item.id,
          group: groupKeyFor(item),
          content: `<div class="mrd-item"><span class="mrd-kind" style="background:${token.color}"></span><span class="mrd-title">${item.title}</span><span class="mrd-progress">${item.progress}%</span></div>`,
          start: item.startDate,
          end: isPoint ? undefined : item.endDate,
          type: isPoint ? ('point' as const) : ('range' as const),
          title: `${token.label}: ${item.title}\nOwner: ${owner?.name ?? 'Unassigned'}\nProgress: ${item.progress}%\nHealth: ${item.health.replace('_', ' ')}${dependencyNote ? '' : ''}`,
          style: `background-color:${alpha(token.color, theme.palette.mode === 'light' ? 0.16 : 0.26)};border-color:${token.color};color:${theme.palette.text.primary};`,
          className: `mrd-${item.kind} mrd-health-${item.health}`,
        };
      }),
    };
  }, [items, grouping, state.teams, projectById, userById, theme.palette.mode, theme.palette.text.primary]);

  // Create once.
  useEffect(() => {
    if (!containerRef.current || timelineRef.current) return;

    const options: TimelineOptions = {
      stack: true,
      stackSubgroups: true,
      horizontalScroll: true,
      verticalScroll: true,
      zoomKey: 'ctrlKey',
      zoomMin: 1000 * 60 * 60 * 24 * 14,
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 3,
      orientation: { axis: 'top', item: 'top' },
      margin: { item: { horizontal: 6, vertical: 8 }, axis: 10 },
      maxHeight: height,
      minHeight: 240,
      groupOrder: 'content',
      selectable: true,
      multiselect: false,
      tooltip: { followMouse: true, overflowMethod: 'cap' },
      showCurrentTime: true,
    };

    const timeline = new Timeline(containerRef.current, new DataSet([]), new DataSet([]), options);
    timeline.on('select', (properties: { items: (string | number)[] }) => {
      onSelect(properties.items.length > 0 ? String(properties.items[0]) : null);
    });
    timelineRef.current = timeline;

    return () => {
      timeline.destroy();
      timelineRef.current = null;
    };
    // Intentionally created once — data and options are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync data.
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    timeline.setGroups(new DataSet(visGroups));
    timeline.setItems(new DataSet(visItems));
  }, [visItems, visGroups]);

  // Sync visible window.
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    if (windowStart && windowEnd) {
      timeline.setWindow(windowStart, windowEnd, { animation: false });
    } else if (visItems.length > 0) {
      timeline.fit({ animation: false });
    }
  }, [windowStart, windowEnd, visItems]);

  // Sync selection coming from the table / drawer.
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    timeline.setSelection(selectedId ? [selectedId] : []);
  }, [selectedId]);

  return (
    <Paper variant="outlined" sx={{ p: 1, borderRadius: 2.5, overflow: 'hidden' }}>
      <Box
        ref={containerRef}
        aria-label="Roadmap timeline"
        sx={{
          '& .vis-timeline': {
            border: 'none',
            fontFamily: theme.typography.fontFamily,
            fontSize: '0.75rem',
          },
          '& .vis-panel': { borderColor: theme.palette.divider },
          '& .vis-time-axis .vis-text': { color: theme.palette.text.secondary, fontSize: '0.6875rem' },
          '& .vis-time-axis .vis-grid.vis-minor': { borderColor: alpha(theme.palette.divider, 0.6) },
          '& .vis-time-axis .vis-grid.vis-major': { borderColor: theme.palette.divider },
          '& .vis-labelset .vis-label': {
            color: theme.palette.text.primary,
            borderColor: theme.palette.divider,
            fontWeight: 600,
            paddingLeft: 8,
          },
          '& .vis-item': {
            borderRadius: 6,
            borderWidth: 1,
            borderLeftWidth: 3,
            fontSize: '0.75rem',
          },
          '& .vis-item.vis-selected': {
            boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
            backgroundColor: alpha(theme.palette.primary.main, 0.2),
          },
          '& .vis-item.vis-point .vis-dot': { borderColor: theme.palette.warning.main, borderWidth: 7 },
          '& .vis-current-time': { backgroundColor: theme.palette.error.main },
          '& .mrd-item': { display: 'flex', alignItems: 'center', gap: '6px', padding: '0 2px' },
          '& .mrd-kind': { width: 6, height: 6, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
          '& .mrd-title': { fontWeight: 600, whiteSpace: 'nowrap' },
          '& .mrd-progress': { opacity: 0.65, fontVariantNumeric: 'tabular-nums' },
          '& .mrd-health-off_track': { borderLeftColor: `${theme.palette.error.main} !important` },
          '& .mrd-health-at_risk': { borderLeftColor: `${theme.palette.warning.main} !important` },
          '& .vis-tooltip': {
            backgroundColor: `${theme.palette.mode === 'light' ? '#28313B' : '#EBEEF2'} !important`,
            color: `${theme.palette.mode === 'light' ? '#fff' : '#191F26'} !important`,
            borderRadius: '6px !important',
            border: 'none !important',
            fontFamily: `${theme.typography.fontFamily} !important`,
            fontSize: '0.75rem !important',
            whiteSpace: 'pre-line',
            padding: '6px 10px !important',
          },
        }}
      />
    </Paper>
  );
}

import { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import { X } from 'lucide-react';
import type { CalendarEvent, CalendarEventKind, ID } from '@/types/domain';
import { chartPalette, layout } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useToast } from '@/state/ToastProvider';
import { useUi } from '@/state/UiProvider';
import { formatDate } from '@/utils/format';
import { PriorityChip, StatusChip } from '@/components/common/TokenChip';

const KIND_COLORS: Record<CalendarEventKind, string> = {
  task: chartPalette[0],
  milestone: chartPalette[3],
  release: chartPalette[2],
  sprint: chartPalette[1],
};

const KIND_LABELS: Record<CalendarEventKind, string> = {
  task: 'Task due date',
  milestone: 'Milestone',
  release: 'Release',
  sprint: 'Sprint window',
};

interface ProjectCalendarProps {
  events: CalendarEvent[];
  /** Kinds the caller wants rendered — drives the colour legend too. */
  visibleKinds?: CalendarEventKind[];
  height?: number | string;
}

export function ProjectCalendar({
  events,
  visibleKinds = ['task', 'milestone', 'release', 'sprint'],
  height = 720,
}: ProjectCalendarProps): React.JSX.Element {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { dispatch, projectById, userById } = useWorkspace();
  const { notify } = useToast();
  const { openTask } = useUi();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const filtered = useMemo(
    () => events.filter((event) => visibleKinds.includes(event.kind)),
    [events, visibleKinds],
  );

  const fcEvents = useMemo<EventInput[]>(
    () =>
      filtered.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.kind === 'sprint' ? event.end : undefined,
        allDay: event.allDay,
        backgroundColor: alpha(KIND_COLORS[event.kind], event.kind === 'sprint' ? 0.18 : 0.14),
        borderColor: KIND_COLORS[event.kind],
        textColor: theme.palette.mode === 'light' ? KIND_COLORS[event.kind] : theme.palette.text.primary,
        // Only task due dates are meaningfully reschedulable by dragging.
        editable: event.kind === 'task',
        extendedProps: { source: event },
      })),
    [filtered, theme.palette.mode, theme.palette.text.primary],
  );

  const handleEventClick = (arg: EventClickArg): void => {
    const source = arg.event.extendedProps.source as CalendarEvent | undefined;
    if (source) setSelected(source);
  };

  const handleDrop = (arg: EventDropArg | EventResizeDoneArg): void => {
    const source = arg.event.extendedProps.source as CalendarEvent | undefined;
    const newStart = arg.event.start;
    if (!source || !newStart) {
      arg.revert();
      return;
    }
    if (source.kind !== 'task') {
      arg.revert();
      notify('Only task due dates can be rescheduled here', { severity: 'warning' });
      return;
    }
    const dueDate = newStart.toISOString().slice(0, 10);
    const previous = source.start;
    dispatch({ type: 'task/schedule', taskId: source.sourceId, dueDate });
    notify(`Rescheduled to ${formatDate(dueDate)}`, {
      actionLabel: 'Undo',
      onAction: () => dispatch({ type: 'task/schedule', taskId: source.sourceId, dueDate: previous }),
    });
  };

  const selectedProject = projectById(selected?.projectId);

  return (
    <>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 2.5 }}>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
          {visibleKinds.map((kind) => (
            <Stack key={kind} direction="row" spacing={0.75} alignItems="center">
              <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: KIND_COLORS[kind] }} />
              <Typography variant="caption" color="text.secondary">
                {KIND_LABELS[kind]}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Box
          sx={{
            // Scope FullCalendar's look to the Meridian theme rather than
            // shipping its stock chrome.
            '& .fc': {
              '--fc-border-color': theme.palette.divider,
              '--fc-page-bg-color': 'transparent',
              '--fc-neutral-bg-color': alpha(theme.palette.text.primary, 0.03),
              '--fc-today-bg-color': alpha(theme.palette.primary.main, 0.07),
              fontFamily: theme.typography.fontFamily,
              fontSize: '0.8125rem',
              color: theme.palette.text.primary,
            },
            '& .fc .fc-toolbar-title': { ...theme.typography.h5 },
            '& .fc .fc-button': {
              backgroundColor: 'transparent',
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8125rem',
              boxShadow: 'none',
            },
            '& .fc .fc-button:hover': { backgroundColor: theme.palette.action.hover },
            '& .fc .fc-button-primary:not(:disabled).fc-button-active': {
              backgroundColor: alpha(theme.palette.primary.main, 0.14),
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
            },
            '& .fc .fc-col-header-cell-cushion': {
              fontSize: '0.6875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 700,
              color: theme.palette.text.secondary,
              padding: '8px 4px',
            },
            '& .fc .fc-daygrid-day-number': { fontSize: '0.75rem', color: theme.palette.text.secondary },
            '& .fc-event': { borderRadius: 4, borderWidth: 1, borderLeftWidth: 3, cursor: 'pointer', padding: '1px 3px' },
            '& .fc-event-title': { fontWeight: 550 },
            '& .fc .fc-list-event:hover td': { backgroundColor: theme.palette.action.hover },
            '& .fc-theme-standard td, & .fc-theme-standard th': { borderColor: theme.palette.divider },
          }}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={isMobile ? 'listMonth' : 'dayGridMonth'}
            headerToolbar={{
              left: isMobile ? 'prev,next' : 'prev,next today',
              center: 'title',
              right: isMobile ? 'dayGridMonth,listMonth' : 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day', list: 'List' }}
            events={fcEvents}
            height={height}
            firstDay={1}
            dayMaxEvents={3}
            editable
            eventResizableFromStart
            eventClick={handleEventClick}
            eventDrop={handleDrop}
            eventResize={handleDrop}
            nowIndicator
            weekNumbers={false}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
          />
        </Box>
      </Paper>

      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={selected !== null}
        onClose={() => setSelected(null)}
        slotProps={{
          paper: {
            sx: {
              width: isMobile ? '100%' : layout.detailDrawerWidth,
              borderTopLeftRadius: isMobile ? 16 : 0,
              borderTopRightRadius: isMobile ? 16 : 0,
            },
          },
        }}
      >
        {selected ? (
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
              <Chip
                size="small"
                label={KIND_LABELS[selected.kind]}
                sx={{
                  bgcolor: alpha(KIND_COLORS[selected.kind], 0.16),
                  color: KIND_COLORS[selected.kind],
                  fontWeight: 700,
                }}
              />
              <IconButton size="small" onClick={() => setSelected(null)} aria-label="Close event details">
                <X size={16} />
              </IconButton>
            </Stack>
            <Typography variant="h5" sx={{ mt: 1.5 }}>
              {selected.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {selectedProject ? `${selectedProject.key} · ${selectedProject.name}` : 'Unknown project'}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1.25}>
              <Row label="Date" value={formatDate(selected.start)} />
              {selected.kind === 'sprint' ? <Row label="Ends" value={formatDate(selected.end)} /> : null}
              {selected.assigneeId ? <Row label="Assignee" value={userById(selected.assigneeId)?.name ?? '—'} /> : null}
              {selected.status ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary" sx={{ width: 90 }}>
                    Status
                  </Typography>
                  <StatusChip status={selected.status} />
                </Stack>
              ) : null}
              {selected.priority ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary" sx={{ width: 90 }}>
                    Priority
                  </Typography>
                  <PriorityChip priority={selected.priority} />
                </Stack>
              ) : null}
            </Stack>
            {selected.kind === 'task' ? (
              <Button
                variant="contained"
                fullWidth
                sx={{ mt: 2.5 }}
                onClick={() => {
                  const id: ID = selected.sourceId;
                  setSelected(null);
                  openTask(id);
                }}
              >
                Open task details
              </Button>
            ) : null}
          </Box>
        ) : null}
      </Drawer>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <Stack direction="row" spacing={1} alignItems="baseline">
      <Typography variant="caption" color="text.secondary" sx={{ width: 90, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

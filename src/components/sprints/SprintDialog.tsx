import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { addDays, format } from 'date-fns';
import { SPRINT_STATUSES, type ID, type Sprint } from '@/types/domain';
import { sprintStatusTokens } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useToast } from '@/state/ToastProvider';

const schema = z
  .object({
    name: z.string().min(3, 'Sprint name is required'),
    goal: z.string().min(5, 'A sprint goal keeps the team aligned'),
    projectId: z.string().min(1, 'Choose a project'),
    teamId: z.string().min(1, 'Choose a team'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    capacityPoints: z.coerce.number().min(1, 'Capacity must be at least 1').max(500),
    status: z.enum(SPRINT_STATUSES).optional(),
  })
  .refine((values) => values.endDate > values.startDate, {
    message: 'End date must be after the start date',
    path: ['endDate'],
  });

type FormValues = z.input<typeof schema>;

interface SprintDialogProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: ID;
  /** When provided the dialog edits that sprint instead of creating one. */
  sprint?: Sprint;
}

export function SprintDialog({ open, onClose, defaultProjectId, sprint }: SprintDialogProps): React.JSX.Element {
  const { state, dispatch } = useWorkspace();
  const { notify } = useToast();
  const isEdit = sprint !== undefined;

  const fallbackProject = defaultProjectId ?? state.projects[0]?.id ?? '';

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      goal: '',
      projectId: fallbackProject,
      teamId: state.teams[0]?.id ?? '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 13), 'yyyy-MM-dd'),
      capacityPoints: 40,
      status: 'planned',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      sprint
        ? {
            name: sprint.name,
            goal: sprint.goal,
            projectId: sprint.projectId,
            teamId: sprint.teamId,
            startDate: sprint.startDate,
            endDate: sprint.endDate,
            capacityPoints: sprint.capacityPoints,
            status: sprint.status,
          }
        : {
            name: '',
            goal: '',
            projectId: fallbackProject,
            teamId: state.teams[0]?.id ?? '',
            startDate: format(new Date(), 'yyyy-MM-dd'),
            endDate: format(addDays(new Date(), 13), 'yyyy-MM-dd'),
            capacityPoints: 40,
            status: 'planned',
          },
    );
  }, [open, sprint, reset, fallbackProject, state.teams]);

  const selectedProjectId = watch('projectId');
  const projectTeams = state.teams.filter((team) => {
    const project = state.projects.find((p) => p.id === selectedProjectId);
    return project ? project.teamIds.includes(team.id) : true;
  });

  const submit = handleSubmit((values) => {
    const parsed = schema.parse(values);
    if (isEdit && sprint) {
      dispatch({
        type: 'sprint/update',
        sprintId: sprint.id,
        patch: {
          name: parsed.name,
          goal: parsed.goal,
          teamId: parsed.teamId,
          startDate: parsed.startDate,
          endDate: parsed.endDate,
          capacityPoints: parsed.capacityPoints,
          status: parsed.status ?? sprint.status,
        },
      });
      notify(`Updated ${parsed.name}`, { severity: 'success' });
    } else {
      dispatch({
        type: 'sprint/create',
        input: {
          name: parsed.name,
          goal: parsed.goal,
          projectId: parsed.projectId,
          teamId: parsed.teamId,
          startDate: parsed.startDate,
          endDate: parsed.endDate,
          capacityPoints: parsed.capacityPoints,
        },
      });
      notify(`Planned ${parsed.name}`, { severity: 'success' });
    }
    onClose();
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 650 }}>{isEdit ? 'Edit sprint' : 'Plan sprint'}</DialogTitle>
      <DialogContent dividers>
        <Box component="form" id="sprint-form" onSubmit={submit} noValidate>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Sprint name"
                  required
                  autoFocus
                  fullWidth
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="goal"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Sprint goal"
                  required
                  fullWidth
                  multiline
                  minRows={2}
                  error={Boolean(errors.goal)}
                  helperText={errors.goal?.message}
                />
              )}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select required label="Project" fullWidth disabled={isEdit}>
                    {state.projects.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.key} · {p.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="teamId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select required label="Team" fullWidth>
                    {projectTeams.map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Start date"
                    type="date"
                    required
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={Boolean(errors.startDate)}
                    helperText={errors.startDate?.message}
                  />
                )}
              />
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="End date"
                    type="date"
                    required
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={Boolean(errors.endDate)}
                    helperText={errors.endDate?.message}
                  />
                )}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="capacityPoints"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Capacity (points)"
                    type="number"
                    required
                    fullWidth
                    slotProps={{ htmlInput: { min: 1, max: 500 } }}
                    error={Boolean(errors.capacityPoints)}
                    helperText={errors.capacityPoints?.message}
                  />
                )}
              />
              {isEdit ? (
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Status" fullWidth>
                      {SPRINT_STATUSES.map((status) => (
                        <MenuItem key={status} value={status}>
                          {sprintStatusTokens[status].label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              ) : (
                <Box sx={{ width: '100%' }} />
              )}
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button type="submit" form="sprint-form" variant="contained">
          {isEdit ? 'Save changes' : 'Create sprint'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

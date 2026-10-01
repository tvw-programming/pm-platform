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
import { PRIORITIES, ROADMAP_ITEM_KINDS, type ID } from '@/types/domain';
import { priorityTokens, roadmapKindTokens } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useToast } from '@/state/ToastProvider';

const schema = z
  .object({
    title: z.string().min(4, 'Title must be at least 4 characters'),
    description: z.string().min(10, 'Describe the outcome this delivers'),
    kind: z.enum(ROADMAP_ITEM_KINDS),
    projectId: z.string().min(1, 'Choose a project'),
    productArea: z.string().min(2, 'Product area is required'),
    teamId: z.string().min(1, 'Choose a team'),
    ownerId: z.string().min(1, 'Choose an owner'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    priority: z.enum(PRIORITIES),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: 'End date cannot be before the start date',
    path: ['endDate'],
  });

type FormValues = z.infer<typeof schema>;

interface CreateRoadmapItemDialogProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: ID;
}

export function CreateRoadmapItemDialog({
  open,
  onClose,
  defaultProjectId,
}: CreateRoadmapItemDialogProps): React.JSX.Element {
  const { state, dispatch } = useWorkspace();
  const { notify } = useToast();

  const fallbackProject = state.projects.find((p) => p.id === defaultProjectId) ?? state.projects[0];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      kind: 'feature',
      projectId: fallbackProject?.id ?? '',
      productArea: fallbackProject?.productArea ?? '',
      teamId: state.teams[0]?.id ?? '',
      ownerId: state.currentUserId,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 42), 'yyyy-MM-dd'),
      priority: 'medium',
    },
  });

  const submit = handleSubmit((values) => {
    dispatch({ type: 'roadmap/create', input: values });
    notify(`Added “${values.title}” to the roadmap`, { severity: 'success' });
    reset();
    onClose();
  });

  const handleClose = (): void => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 650 }}>Create roadmap item</DialogTitle>
      <DialogContent dividers>
        <Box component="form" id="roadmap-item-form" onSubmit={submit} noValidate>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Title"
                  required
                  autoFocus
                  fullWidth
                  error={Boolean(errors.title)}
                  helperText={errors.title?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  required
                  fullWidth
                  multiline
                  minRows={2}
                  error={Boolean(errors.description)}
                  helperText={errors.description?.message}
                />
              )}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="kind"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Item type" fullWidth>
                    {ROADMAP_ITEM_KINDS.map((kind) => (
                      <MenuItem key={kind} value={kind}>
                        {roadmapKindTokens[kind].label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Priority" fullWidth>
                    {PRIORITIES.map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        {priorityTokens[priority].label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    required
                    label="Project"
                    fullWidth
                    error={Boolean(errors.projectId)}
                    helperText={errors.projectId?.message}
                  >
                    {state.projects.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.key} · {p.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="productArea"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Product area"
                    required
                    fullWidth
                    error={Boolean(errors.productArea)}
                    helperText={errors.productArea?.message}
                  />
                )}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="teamId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select required label="Team" fullWidth>
                    {state.teams.map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="ownerId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select required label="Owner" fullWidth>
                    {state.users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
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
                    label="Target date"
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
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button type="submit" form="roadmap-item-form" variant="contained">
          Add to roadmap
        </Button>
      </DialogActions>
    </Dialog>
  );
}

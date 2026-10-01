import { useForm, Controller } from 'react-hook-form';
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
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import { PRIORITIES, TASK_STATUSES, TASK_TYPES, type ID } from '@/types/domain';
import { priorityTokens, taskStatusTokens, taskTypeTokens } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useToast } from '@/state/ToastProvider';

const schema = z.object({
  title: z.string().min(4, 'Give the task a title of at least 4 characters'),
  description: z.string().max(4000).optional(),
  type: z.enum(TASK_TYPES),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(PRIORITIES),
  projectId: z.string().min(1, 'Choose a project'),
  assigneeId: z.string().optional(),
  sprintId: z.string().optional(),
  storyPoints: z
    .union([z.coerce.number().min(0).max(100), z.literal('')])
    .optional()
    .transform((value) => (value === '' || value === undefined ? undefined : Number(value))),
  dueDate: z.string().optional(),
  labelIds: z.array(z.string()),
});

type FormValues = z.input<typeof schema>;

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: ID;
  defaultStatus?: (typeof TASK_STATUSES)[number];
  defaultSprintId?: ID;
}

export function CreateTaskDialog({
  open,
  onClose,
  defaultProjectId,
  defaultStatus = 'todo',
  defaultSprintId,
}: CreateTaskDialogProps): React.JSX.Element {
  const { state, dispatch } = useWorkspace();
  const { notify } = useToast();

  const firstProject = defaultProjectId ?? state.projects[0]?.id ?? '';

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      type: 'story',
      status: defaultStatus,
      priority: 'medium',
      projectId: firstProject,
      assigneeId: '',
      sprintId: defaultSprintId ?? '',
      storyPoints: '',
      dueDate: '',
      labelIds: [],
    },
  });

  const selectedProjectId = watch('projectId');
  const project = state.projects.find((p) => p.id === selectedProjectId);
  const members = state.users.filter((u) => project?.memberIds.includes(u.id));
  const projectSprints = state.sprints.filter((s) => s.projectId === selectedProjectId && s.status !== 'completed');

  const submit = handleSubmit((values) => {
    const parsed = schema.parse(values);
    dispatch({
      type: 'task/create',
      input: {
        title: parsed.title,
        description: parsed.description ?? '',
        type: parsed.type,
        status: parsed.status,
        priority: parsed.priority,
        projectId: parsed.projectId,
        assigneeId: parsed.assigneeId || undefined,
        sprintId: parsed.sprintId || undefined,
        storyPoints: parsed.storyPoints,
        dueDate: parsed.dueDate || undefined,
        labelIds: parsed.labelIds,
      },
    });
    notify(`Created “${parsed.title}”`, { severity: 'success' });
    reset();
    onClose();
  });

  const handleClose = (): void => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 650 }}>Create task</DialogTitle>
      <DialogContent dividers>
        <Box component="form" onSubmit={submit} noValidate id="create-task-form">
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
                <TextField {...field} label="Description" fullWidth multiline minRows={3} maxRows={8} />
              )}
            />

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
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Type" fullWidth>
                    {TASK_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {taskTypeTokens[type].label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Status" fullWidth>
                    {TASK_STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>
                        {taskStatusTokens[status].label}
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
                name="assigneeId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Assignee" fullWidth>
                    <MenuItem value="">Unassigned</MenuItem>
                    {members.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="sprintId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Sprint" fullWidth>
                    <MenuItem value="">Backlog (no sprint)</MenuItem>
                    {projectSprints.map((sprint) => (
                      <MenuItem key={sprint.id} value={sprint.id}>
                        {sprint.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="storyPoints"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Story points"
                    type="number"
                    fullWidth
                    slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }}
                  />
                )}
              />
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Due date"
                    type="date"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Stack>

            <Controller
              name="labelIds"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={state.labels}
                  getOptionLabel={(option) => option.name}
                  value={state.labels.filter((l) => field.value.includes(l.id))}
                  onChange={(_, value) => field.onChange(value.map((v) => v.id))}
                  renderValue={(value, getItemProps) =>
                    value.map((option, index) => {
                      const { key, ...itemProps } = getItemProps({ index });
                      return <Chip key={key} size="small" label={option.name} {...itemProps} />;
                    })
                  }
                  renderInput={(params) => <TextField {...params} label="Labels" placeholder="Add labels" />}
                />
              )}
            />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button type="submit" form="create-task-form" variant="contained" disabled={isSubmitting}>
          Create task
        </Button>
      </DialogActions>
    </Dialog>
  );
}

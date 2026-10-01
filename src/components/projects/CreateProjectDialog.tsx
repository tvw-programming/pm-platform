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
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import { PRIORITIES } from '@/types/domain';
import { priorityTokens } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useToast } from '@/state/ToastProvider';

const schema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  key: z
    .string()
    .min(2, 'Keys are 2–5 letters')
    .max(5, 'Keys are 2–5 letters')
    .regex(/^[A-Za-z]+$/, 'Letters only'),
  description: z.string().min(10, 'Add a sentence describing the project'),
  productOwnerId: z.string().min(1, 'Choose a product owner'),
  priority: z.enum(PRIORITIES),
  targetReleaseDate: z.string().min(1, 'Pick a target date'),
  productArea: z.string().min(2, 'Product area is required'),
  teamIds: z.array(z.string()).min(1, 'Assign at least one team'),
});

type FormValues = z.infer<typeof schema>;

export function CreateProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }): React.JSX.Element {
  const { state, dispatch } = useWorkspace();
  const { notify } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
      productOwnerId: state.currentUserId,
      priority: 'medium',
      targetReleaseDate: '',
      productArea: '',
      teamIds: [],
    },
  });

  const submit = handleSubmit((values) => {
    const duplicate = state.projects.some((p) => p.key.toUpperCase() === values.key.toUpperCase());
    if (duplicate) {
      notify(`Project key ${values.key.toUpperCase()} is already in use`, { severity: 'error' });
      return;
    }
    dispatch({ type: 'project/create', input: values });
    notify(`Created project ${values.name}`, { severity: 'success' });
    reset();
    onClose();
  });

  const handleClose = (): void => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 650 }}>Create project</DialogTitle>
      <DialogContent dividers>
        <Box component="form" id="create-project-form" onSubmit={submit} noValidate>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Project name"
                    required
                    autoFocus
                    fullWidth
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                  />
                )}
              />
              <Controller
                name="key"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Key"
                    required
                    sx={{ width: { xs: '100%', sm: 140 } }}
                    error={Boolean(errors.key)}
                    helperText={errors.key?.message ?? 'e.g. ATL'}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                  />
                )}
              />
            </Stack>
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
                  minRows={3}
                  error={Boolean(errors.description)}
                  helperText={errors.description?.message}
                />
              )}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="productOwnerId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    required
                    label="Product owner"
                    fullWidth
                    error={Boolean(errors.productOwnerId)}
                    helperText={errors.productOwnerId?.message}
                  >
                    {state.users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
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
              <Controller
                name="targetReleaseDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Target release date"
                    type="date"
                    required
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={Boolean(errors.targetReleaseDate)}
                    helperText={errors.targetReleaseDate?.message}
                  />
                )}
              />
            </Stack>
            <Controller
              name="teamIds"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={state.teams}
                  getOptionLabel={(option) => option.name}
                  value={state.teams.filter((t) => field.value.includes(t.id))}
                  onChange={(_, value) => field.onChange(value.map((v) => v.id))}
                  renderValue={(value, getItemProps) =>
                    value.map((option, index) => {
                      const { key, ...itemProps } = getItemProps({ index });
                      return <Chip key={key} size="small" label={option.key} {...itemProps} />;
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Teams"
                      required
                      error={Boolean(errors.teamIds)}
                      helperText={errors.teamIds?.message}
                    />
                  )}
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
        <Button type="submit" form="create-project-form" variant="contained">
          Create project
        </Button>
      </DialogActions>
    </Dialog>
  );
}

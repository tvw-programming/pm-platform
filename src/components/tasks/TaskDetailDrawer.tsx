import { useMemo, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import LinearProgress from '@mui/material/LinearProgress';
import Autocomplete from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Archive,
  CircleSlash,
  Copy,
  Ellipsis,
  Link2,
  Paperclip,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { PRIORITIES, TASK_STATUSES, TASK_TYPES, type ID, type Task, type TaskStatus } from '@/types/domain';
import { layout, priorityTokens, taskStatusTokens, taskTypeTokens } from '@/app/tokens';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useToast } from '@/state/ToastProvider';
import { UserAvatar } from '@/components/common/UserAvatar';
import { PriorityChip, StatusChip, TypeChip } from '@/components/common/TokenChip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/States';
import { formatBytes, formatDate, formatRelative, isOverdue } from '@/utils/format';
import { checklistProgress } from '@/utils/selectors';

interface TaskDetailDrawerProps {
  taskId: ID | null;
  onClose: () => void;
}

type DrawerTab = 'details' | 'subtasks' | 'comments' | 'activity';

export function TaskDetailDrawer({ taskId, onClose }: TaskDetailDrawerProps): React.JSX.Element {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { state, dispatch, userById, projectById, taskById } = useWorkspace();
  const { notify } = useToast();

  const [tab, setTab] = useState<DrawerTab>('details');
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [checklistDraft, setChecklistDraft] = useState('');
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [confirm, setConfirm] = useState<'delete' | 'archive' | null>(null);
  const [dependencyTarget, setDependencyTarget] = useState<Task | null>(null);

  const task = taskById(taskId ?? undefined);
  const project = projectById(task?.projectId);

  const subtasks = useMemo(
    () => state.subtasks.filter((s) => s.taskId === task?.id),
    [state.subtasks, task?.id],
  );
  const comments = useMemo(
    () =>
      state.comments
        .filter((c) => c.taskId === task?.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [state.comments, task?.id],
  );
  const attachments = useMemo(
    () => state.attachments.filter((a) => a.taskId === task?.id),
    [state.attachments, task?.id],
  );
  const activity = useMemo(
    () => state.activities.filter((a) => a.entityId === task?.id).slice(0, 25),
    [state.activities, task?.id],
  );

  const members = project ? state.users.filter((u) => project.memberIds.includes(u.id)) : state.users;
  const projectSprints = state.sprints.filter((s) => s.projectId === task?.projectId);
  const projectReleases = state.releases.filter((r) => r.projectId === task?.projectId);
  const siblingTasks = state.tasks.filter((t) => t.projectId === task?.projectId && t.id !== task?.id);
  const epics = state.tasks.filter((t) => t.type === 'epic' && t.projectId === task?.projectId);

  const open = task !== undefined;

  const update = (patch: Partial<Task>): void => {
    if (!task) return;
    dispatch({ type: 'task/update', taskId: task.id, patch });
  };

  const commitTitle = (): void => {
    if (!task || titleDraft === null) return;
    const trimmed = titleDraft.trim();
    if (trimmed.length < 4) {
      notify('A task title needs at least 4 characters', { severity: 'error' });
      setTitleDraft(task.title);
      return;
    }
    if (trimmed !== task.title) {
      update({ title: trimmed });
      notify('Title updated');
    }
    setTitleDraft(null);
  };

  const handleStatus = (status: TaskStatus): void => {
    if (!task) return;
    dispatch({ type: 'task/setStatus', taskId: task.id, status });
    notify(`${task.key} moved to ${taskStatusTokens[status].label}`);
  };

  const handleDelete = (): void => {
    if (!task) return;
    const snapshot = { ...task };
    dispatch({ type: 'task/delete', taskId: task.id });
    setConfirm(null);
    onClose();
    notify(`Deleted ${snapshot.key}`, {
      severity: 'warning',
      actionLabel: 'Undo',
      onAction: () =>
        dispatch({
          type: 'task/create',
          input: {
            title: snapshot.title,
            description: snapshot.description,
            type: snapshot.type,
            status: snapshot.status,
            priority: snapshot.priority,
            projectId: snapshot.projectId,
            assigneeId: snapshot.assigneeId,
            sprintId: snapshot.sprintId,
            storyPoints: snapshot.storyPoints,
            dueDate: snapshot.dueDate,
            labelIds: snapshot.labelIds,
          },
        }),
    });
  };

  const handleArchive = (): void => {
    if (!task) return;
    dispatch({ type: 'task/archive', taskId: task.id });
    setConfirm(null);
    onClose();
    notify(`Archived ${task.key}`, {
      severity: 'info',
      actionLabel: 'Undo',
      onAction: () => dispatch({ type: 'task/restore', taskId: task.id }),
    });
  };

  const checklist = task ? checklistProgress(task) : { done: 0, total: 0 };
  const overdue = task ? isOverdue(task.dueDate, task.status === 'done') : false;

  return (
    <>
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
        aria-label="Task details"
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
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="More actions">
                    <IconButton
                      size="small"
                      onClick={(e) => setMenuAnchor(e.currentTarget)}
                      aria-label="Task actions"
                    >
                      <Ellipsis size={17} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Close">
                    <IconButton size="small" onClick={onClose} aria-label="Close task details">
                      <X size={17} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              <TextField
                value={titleDraft ?? task.title}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitTitle();
                  }
                  if (e.key === 'Escape') setTitleDraft(null);
                }}
                variant="standard"
                fullWidth
                multiline
                label="Task title"
                slotProps={{
                  input: { disableUnderline: true, sx: { ...theme.typography.h4, py: 0.5 } },
                  inputLabel: { shrink: true, sx: { position: 'static', transform: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary' } },
                }}
                sx={{ mt: 1.5 }}
              />

              <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                <TypeChip type={task.type} />
                <StatusChip status={task.status} />
                <PriorityChip priority={task.priority} />
                {overdue ? <Chip size="small" color="error" label="Overdue" /> : null}
              </Stack>

              {task.status === 'blocked' && task.blockedReason ? (
                <Alert severity="error" icon={<CircleSlash size={16} />} sx={{ mt: 1.5 }}>
                  {task.blockedReason}
                </Alert>
              ) : null}
            </Box>

            <Tabs
              value={tab}
              onChange={(_, value: DrawerTab) => setTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ px: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Tab value="details" label="Details" />
              <Tab value="subtasks" label={`Subtasks (${subtasks.length})`} />
              <Tab value="comments" label={`Comments (${comments.length})`} />
              <Tab value="activity" label="Activity" />
            </Tabs>

            <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
              {tab === 'details' ? (
                <Stack spacing={2.5}>
                  <TextField
                    label="Description"
                    value={task.description}
                    onChange={(e) => update({ description: e.target.value })}
                    fullWidth
                    multiline
                    minRows={4}
                    maxRows={14}
                  />

                  <Box
                    sx={{
                      display: 'grid',
                      '& > *': { minWidth: 0 },
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    }}
                  >
                    <TextField
                      select
                      label="Status"
                      value={task.status}
                      onChange={(e) => handleStatus(e.target.value as TaskStatus)}
                    >
                      {TASK_STATUSES.map((status) => (
                        <MenuItem key={status} value={status}>
                          {taskStatusTokens[status].label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="Priority"
                      value={task.priority}
                      onChange={(e) => update({ priority: e.target.value as Task['priority'] })}
                    >
                      {PRIORITIES.map((priority) => (
                        <MenuItem key={priority} value={priority}>
                          {priorityTokens[priority].label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="Type"
                      value={task.type}
                      onChange={(e) => update({ type: e.target.value as Task['type'] })}
                    >
                      {TASK_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {taskTypeTokens[type].label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Story points"
                      type="number"
                      value={task.storyPoints ?? ''}
                      onChange={(e) =>
                        update({ storyPoints: e.target.value === '' ? undefined : Number(e.target.value) })
                      }
                      slotProps={{ htmlInput: { min: 0, max: 100 } }}
                    />
                    <TextField
                      select
                      label="Assignee"
                      value={task.assigneeId ?? ''}
                      onChange={(e) => update({ assigneeId: e.target.value || undefined })}
                    >
                      <MenuItem value="">Unassigned</MenuItem>
                      {members.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <UserAvatar user={user} size={20} showTooltip={false} />
                            <span>{user.name}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="Reporter"
                      value={task.reporterId}
                      onChange={(e) => update({ reporterId: e.target.value })}
                    >
                      {state.users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Due date"
                      type="date"
                      value={task.dueDate ?? ''}
                      onChange={(e) => update({ dueDate: e.target.value || undefined })}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                      select
                      label="Sprint"
                      value={task.sprintId ?? ''}
                      onChange={(e) =>
                        dispatch({ type: 'task/assignSprint', taskId: task.id, sprintId: e.target.value || undefined })
                      }
                    >
                      <MenuItem value="">Backlog (no sprint)</MenuItem>
                      {projectSprints.map((sprint) => (
                        <MenuItem key={sprint.id} value={sprint.id}>
                          {sprint.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="Release"
                      value={task.releaseId ?? ''}
                      onChange={(e) => update({ releaseId: e.target.value || undefined })}
                    >
                      <MenuItem value="">Not targeted</MenuItem>
                      {projectReleases.map((release) => (
                        <MenuItem key={release.id} value={release.id}>
                          {release.name} {release.version}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="Parent epic"
                      value={task.epicId ?? ''}
                      onChange={(e) => update({ epicId: e.target.value || undefined })}
                    >
                      <MenuItem value="">None</MenuItem>
                      {epics.map((epic) => (
                        <MenuItem key={epic.id} value={epic.id}>
                          {epic.key} · {epic.title}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  <Autocomplete
                    multiple
                    options={state.labels}
                    getOptionLabel={(option) => option.name}
                    value={state.labels.filter((l) => task.labelIds.includes(l.id))}
                    onChange={(_, value) => update({ labelIds: value.map((v) => v.id) })}
                    renderValue={(value, getItemProps) =>
                      value.map((option, index) => {
                        const { key, ...itemProps } = getItemProps({ index });
                        return (
                          <Chip
                            key={key}
                            size="small"
                            label={option.name}
                            {...itemProps}
                            sx={{ bgcolor: alpha(option.color, 0.16), color: option.color }}
                          />
                        );
                      })
                    }
                    renderInput={(params) => <TextField {...params} label="Labels" />}
                  />

                  {/* Checklist */}
                  <Box>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">Checklist</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {checklist.done}/{checklist.total}
                      </Typography>
                    </Stack>
                    {checklist.total > 0 ? (
                      <LinearProgress
                        variant="determinate"
                        value={(checklist.done / checklist.total) * 100}
                        sx={{ mb: 1 }}
                        aria-label="Checklist progress"
                      />
                    ) : null}
                    <Stack spacing={0.25}>
                      {task.checklist.map((item) => (
                        <FormControlLabel
                          key={item.id}
                          control={
                            <Checkbox
                              size="small"
                              checked={item.done}
                              onChange={() =>
                                dispatch({ type: 'task/toggleChecklistItem', taskId: task.id, itemId: item.id })
                              }
                            />
                          }
                          label={
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: item.done ? 'line-through' : 'none',
                                color: item.done ? 'text.disabled' : 'text.primary',
                              }}
                            >
                              {item.label}
                            </Typography>
                          }
                        />
                      ))}
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Add a checklist item"
                        value={checklistDraft}
                        onChange={(e) => setChecklistDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && checklistDraft.trim()) {
                            dispatch({ type: 'task/addChecklistItem', taskId: task.id, label: checklistDraft.trim() });
                            setChecklistDraft('');
                          }
                        }}
                      />
                      <Button
                        size="small"
                        startIcon={<Plus size={14} />}
                        disabled={!checklistDraft.trim()}
                        onClick={() => {
                          dispatch({ type: 'task/addChecklistItem', taskId: task.id, label: checklistDraft.trim() });
                          setChecklistDraft('');
                        }}
                      >
                        Add
                      </Button>
                    </Stack>
                  </Box>

                  {/* Dependencies */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Dependencies
                    </Typography>
                    {task.dependencies.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        No linked work.
                      </Typography>
                    ) : (
                      <Stack spacing={0.5} sx={{ mb: 1 }}>
                        {task.dependencies.map((dependency) => {
                          const target = taskById(dependency.targetTaskId);
                          return (
                            <Stack
                              key={dependency.id}
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{
                                px: 1,
                                py: 0.75,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                              }}
                            >
                              <Link2 size={14} aria-hidden />
                              <Chip size="small" label={dependency.kind.replace('_', ' ')} variant="outlined" />
                              <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                                {target ? `${target.key} · ${target.title}` : 'Unknown task'}
                              </Typography>
                              <IconButton
                                size="small"
                                aria-label="Remove dependency"
                                onClick={() =>
                                  dispatch({
                                    type: 'task/removeDependency',
                                    taskId: task.id,
                                    dependencyId: dependency.id,
                                  })
                                }
                              >
                                <X size={14} />
                              </IconButton>
                            </Stack>
                          );
                        })}
                      </Stack>
                    )}
                    <Stack direction="row" spacing={1}>
                      <Autocomplete
                        size="small"
                        sx={{ flex: 1 }}
                        options={siblingTasks}
                        value={dependencyTarget}
                        onChange={(_, value) => setDependencyTarget(value)}
                        getOptionLabel={(option) => `${option.key} · ${option.title}`}
                        renderInput={(params) => <TextField {...params} label="Link a task" />}
                      />
                      <Button
                        size="small"
                        disabled={!dependencyTarget}
                        onClick={() => {
                          if (!dependencyTarget) return;
                          dispatch({
                            type: 'task/addDependency',
                            taskId: task.id,
                            targetTaskId: dependencyTarget.id,
                            kind: 'blocked_by',
                          });
                          setDependencyTarget(null);
                          notify('Dependency added');
                        }}
                      >
                        Add
                      </Button>
                    </Stack>
                  </Box>

                  {/* Custom fields */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Custom fields
                    </Typography>
                    <Stack spacing={1.5}>
                      {state.customFields
                        .filter((field) => field.appliesTo.includes(task.type))
                        .map((field) => {
                          const value = task.customFields[field.id];
                          if (field.kind === 'boolean') {
                            return (
                              <FormControlLabel
                                key={field.id}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={value === true}
                                    onChange={(e) =>
                                      update({ customFields: { ...task.customFields, [field.id]: e.target.checked } })
                                    }
                                  />
                                }
                                label={<Typography variant="body2">{field.name}</Typography>}
                              />
                            );
                          }
                          if (field.kind === 'select') {
                            return (
                              <TextField
                                key={field.id}
                                select
                                label={field.name}
                                value={typeof value === 'string' ? value : ''}
                                onChange={(e) =>
                                  update({ customFields: { ...task.customFields, [field.id]: e.target.value } })
                                }
                              >
                                <MenuItem value="">—</MenuItem>
                                {(field.options ?? []).map((option) => (
                                  <MenuItem key={option} value={option}>
                                    {option}
                                  </MenuItem>
                                ))}
                              </TextField>
                            );
                          }
                          return (
                            <TextField
                              key={field.id}
                              label={field.name}
                              type={field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : 'text'}
                              value={value === null || value === undefined ? '' : String(value)}
                              slotProps={field.kind === 'date' ? { inputLabel: { shrink: true } } : undefined}
                              onChange={(e) =>
                                update({
                                  customFields: {
                                    ...task.customFields,
                                    [field.id]: field.kind === 'number' ? Number(e.target.value) : e.target.value,
                                  },
                                })
                              }
                            />
                          );
                        })}
                    </Stack>
                  </Box>

                  {/* Attachments */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Attachments ({attachments.length})
                    </Typography>
                    {attachments.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Nothing attached yet.
                      </Typography>
                    ) : (
                      <List disablePadding>
                        {attachments.map((attachment) => (
                          <ListItem key={attachment.id} disableGutters>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                              <Paperclip size={15} aria-hidden />
                            </ListItemIcon>
                            <ListItemText
                              primary={attachment.fileName}
                              secondary={`${formatBytes(attachment.sizeBytes)} · ${userById(attachment.uploadedById)?.name ?? 'Unknown'} · ${formatRelative(attachment.uploadedAt)}`}
                              slotProps={{ primary: { variant: 'body2' }, secondary: { variant: 'caption' } }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>

                  <Divider />
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Created {formatDate(task.createdAt)} · Updated {formatRelative(task.updatedAt)}
                    </Typography>
                    {task.completedAt ? (
                      <Typography variant="caption" color="text.secondary">
                        Completed {formatDate(task.completedAt)}
                      </Typography>
                    ) : null}
                  </Stack>
                </Stack>
              ) : null}

              {tab === 'subtasks' ? (
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Add a subtask"
                      value={subtaskDraft}
                      onChange={(e) => setSubtaskDraft(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      disabled={!subtaskDraft.trim()}
                      onClick={() => {
                        dispatch({ type: 'task/addSubtask', taskId: task.id, title: subtaskDraft.trim() });
                        setSubtaskDraft('');
                        notify('Subtask added');
                      }}
                    >
                      Add
                    </Button>
                  </Stack>
                  {subtasks.length === 0 ? (
                    <EmptyState dense title="No subtasks" description="Break this work down if it needs more than one pass." />
                  ) : (
                    <Stack spacing={0.5}>
                      {subtasks.map((subtask) => (
                        <Stack
                          key={subtask.id}
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ px: 1, py: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                        >
                          <Checkbox
                            size="small"
                            checked={subtask.status === 'done'}
                            onChange={() => dispatch({ type: 'task/toggleSubtask', subtaskId: subtask.id })}
                            inputProps={{ 'aria-label': `Toggle ${subtask.title}` }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              flex: 1,
                              textDecoration: subtask.status === 'done' ? 'line-through' : 'none',
                              color: subtask.status === 'done' ? 'text.disabled' : 'text.primary',
                            }}
                          >
                            {subtask.title}
                          </Typography>
                          <UserAvatar user={userById(subtask.assigneeId)} size={22} />
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Stack>
              ) : null}

              {tab === 'comments' ? (
                <Stack spacing={2}>
                  {comments.length === 0 ? (
                    <EmptyState dense title="No comments yet" description="Start the discussion — @mention a teammate to pull them in." />
                  ) : (
                    <Stack spacing={1.5}>
                      {comments.map((comment) => {
                        const author = userById(comment.authorId);
                        return (
                          <Stack key={comment.id} direction="row" spacing={1.25}>
                            <UserAvatar user={author} size={28} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" spacing={1} alignItems="baseline">
                                <Typography variant="subtitle2">{author?.name ?? 'Unknown'}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatRelative(comment.createdAt)}
                                </Typography>
                              </Stack>
                              <Typography variant="body2" sx={{ mt: 0.25 }}>
                                {comment.body}
                              </Typography>
                              {comment.mentionedUserIds.length > 0 ? (
                                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                                  {comment.mentionedUserIds.map((id) => (
                                    <Chip key={id} size="small" label={`@${userById(id)?.name ?? 'someone'}`} variant="outlined" />
                                  ))}
                                </Stack>
                              ) : null}
                            </Box>
                          </Stack>
                        );
                      })}
                    </Stack>
                  )}
                  <Divider />
                  <Stack spacing={1}>
                    <TextField
                      label="Add a comment"
                      placeholder="Use @ to mention a teammate"
                      multiline
                      minRows={3}
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                    />
                    <Stack direction="row" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        size="small"
                        disabled={commentDraft.trim().length < 2}
                        onClick={() => {
                          const mentioned = state.users
                            .filter((user) => commentDraft.includes(`@${user.name.split(' ')[0]}`))
                            .map((user) => user.id);
                          dispatch({
                            type: 'task/addComment',
                            taskId: task.id,
                            body: commentDraft.trim(),
                            mentionedUserIds: mentioned,
                          });
                          setCommentDraft('');
                          notify('Comment posted');
                        }}
                      >
                        Comment
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              ) : null}

              {tab === 'activity' ? (
                activity.length === 0 ? (
                  <EmptyState dense title="No activity recorded" description="Changes you make to this task will show up here." />
                ) : (
                  <Stack spacing={1.25}>
                    {activity.map((entry) => (
                      <Stack key={entry.id} direction="row" spacing={1.25} alignItems="flex-start">
                        <UserAvatar user={userById(entry.actorId)} size={24} />
                        <Box>
                          <Typography variant="body2">
                            <strong>{userById(entry.actorId)?.name ?? 'Someone'}</strong> {entry.summary}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatRelative(entry.createdAt)}
                          </Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                )
              ) : null}
            </Box>
          </Box>
        ) : null}
      </Drawer>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            if (task) {
              dispatch({ type: 'task/duplicate', taskId: task.id });
              notify(`Duplicated ${task.key}`);
            }
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <Copy size={15} />
          </ListItemIcon>
          Duplicate
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setConfirm('archive');
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <Archive size={15} />
          </ListItemIcon>
          Archive
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setConfirm('delete');
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: 'error.main' }}>
            <Trash2 size={15} />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this task?"
        description="The task, its comments and its attachments will be removed. You will get a short window to undo."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'archive'}
        title="Archive this task?"
        description="Archived tasks are hidden from boards and reports but keep their history."
        confirmLabel="Archive"
        onConfirm={handleArchive}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

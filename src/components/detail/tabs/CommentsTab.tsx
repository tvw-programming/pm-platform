import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useToast } from '@/state/ToastProvider';
import { UserAvatar } from '@/components/common/UserAvatar';
import { EmptyState } from '@/components/common/States';
import { formatRelative } from '@/utils/format';

interface CommentsTabProps {
  taskId: string;
}

export default function CommentsTab({ taskId }: CommentsTabProps): React.JSX.Element {
  const { state, taskById, userById, dispatch } = useWorkspace();
  const { notify } = useToast();
  const [draft, setDraft] = useState('');
  const task = taskById(taskId);

  const comments = useMemo(
    () =>
      state.comments
        .filter((c) => c.taskId === taskId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [state.comments, taskId],
  );

  if (!task) {
    return <Typography variant="body2" color="text.secondary">Task not found.</Typography>;
  }

  return (
    <Stack spacing={2}>
      {comments.length === 0 ? (
        <EmptyState dense title="No comments yet" description="Start the discussion." />
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
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            size="small"
            disabled={draft.trim().length < 2}
            onClick={() => {
              const mentioned = state.users
                .filter((user) => draft.includes(`@${user.name.split(' ')[0]}`))
                .map((user) => user.id);
              dispatch({
                type: 'task/addComment',
                taskId: task.id,
                body: draft.trim(),
                mentionedUserIds: mentioned,
              });
              setDraft('');
              notify('Comment posted');
            }}
          >
            Comment
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

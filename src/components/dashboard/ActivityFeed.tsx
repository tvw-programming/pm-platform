import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import type { Activity } from '@/types/domain';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { UserAvatar } from '@/components/common/UserAvatar';
import { EmptyState } from '@/components/common/States';
import { formatRelative } from '@/utils/format';

interface ActivityFeedProps {
  activities: Activity[];
  limit?: number;
  title?: string;
  maxHeight?: number;
}

export function ActivityFeed({
  activities,
  limit = 12,
  title = 'Recent activity',
  maxHeight = 420,
}: ActivityFeedProps): React.JSX.Element {
  const { userById, projectById } = useWorkspace();
  const rows = activities.slice(0, limit);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={title} subheader={`Last ${rows.length} events`} />
      <CardContent sx={{ pt: 0.5, flex: 1, overflowY: 'auto', maxHeight }}>
        {rows.length === 0 ? (
          <EmptyState dense title="No activity yet" description="Work you and your team do will show up here." />
        ) : (
          <Stack spacing={1.75}>
            {rows.map((activity) => {
              const actor = userById(activity.actorId);
              const project = projectById(activity.projectId);
              return (
                <Stack key={activity.id} direction="row" spacing={1.25} alignItems="flex-start">
                  <UserAvatar user={actor} size={26} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2">
                      <Box component="strong" sx={{ fontWeight: 650 }}>
                        {actor?.name ?? 'Someone'}
                      </Box>{' '}
                      {activity.summary}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                      {project ? <Chip size="small" label={project.key} sx={{ height: 18, fontSize: 10.5 }} /> : null}
                      <Typography variant="caption" color="text.disabled">
                        {formatRelative(activity.createdAt)}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

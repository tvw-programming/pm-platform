import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate } from 'react-router-dom';
import { CircleSlash, TriangleAlert } from 'lucide-react';
import type { Project } from '@/types/domain';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { HealthChip, PriorityChip, ProjectStatusChip } from '@/components/common/TokenChip';
import { ProgressWithLabel } from '@/components/common/ProgressWithLabel';
import { UserAvatarStack } from '@/components/common/UserAvatar';
import { paths } from '@/app/navigation';
import { formatShortDate } from '@/utils/format';
import { projectStats } from '@/utils/selectors';

export function ProjectCard({ project }: { project: Project }): React.JSX.Element {
  const navigate = useNavigate();
  const { state, visibleTasks, userById } = useWorkspace();
  const stats = projectStats(visibleTasks, project.id);
  const owner = userById(project.productOwnerId);
  const members = state.users.filter((u) => project.memberIds.includes(u.id));
  const openRisks = state.risks.filter((r) => r.projectId === project.id && r.status !== 'resolved').length;

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea
        onClick={() => navigate(paths.project(project.id))}
        sx={{ height: '100%', alignItems: 'stretch' }}
        aria-label={`Open ${project.name}`}
      >
        <Box sx={{ height: 4, bgcolor: project.color }} aria-hidden />
        <CardContent sx={{ p: 2.25 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Chip
                  size="small"
                  label={project.key}
                  sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: 'action.hover' }}
                />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {project.productArea}
                </Typography>
              </Stack>
              <Typography variant="h5" sx={{ mt: 0.75 }} noWrap>
                {project.name}
              </Typography>
            </Box>
            <HealthChip health={project.health} />
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.75,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.description}
          </Typography>

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.75 }}>
            <ProjectStatusChip status={project.status} />
            <PriorityChip priority={project.priority} />
            {stats.blocked > 0 ? (
              <Tooltip title={`${stats.blocked} blocked tasks`}>
                <Chip
                  size="small"
                  color="error"
                  variant="outlined"
                  icon={<CircleSlash size={12} />}
                  label={stats.blocked}
                />
              </Tooltip>
            ) : null}
            {stats.overdue > 0 ? (
              <Tooltip title={`${stats.overdue} overdue tasks`}>
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  icon={<TriangleAlert size={12} />}
                  label={stats.overdue}
                />
              </Tooltip>
            ) : null}
            {openRisks > 0 ? <Chip size="small" variant="outlined" label={`${openRisks} open risks`} /> : null}
          </Stack>

          <ProgressWithLabel
            value={stats.progress}
            label={`${stats.done} of ${stats.total} tasks`}
            color={project.health === 'on_track' ? 'primary' : project.health === 'at_risk' ? 'warning' : 'error'}
          />

          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mt: 1.75 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <UserAvatarStack users={members} max={4} size={24} />
            </Stack>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {owner?.name ?? 'No owner'}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                target {formatShortDate(project.targetReleaseDate)}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

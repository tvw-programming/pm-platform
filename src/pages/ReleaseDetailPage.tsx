import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Timeline from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { ArrowLeft, CircleCheck, Circle, Diamond } from 'lucide-react';
import { DEPLOYMENT_STATUSES, RELEASE_STATUSES, type DeploymentStatus, type ReleaseStatus } from '@/types/domain';
import { deploymentStatusTokens, releaseStatusTokens } from '@/app/tokens';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { DeploymentChip, ReleaseStatusChip, RiskChip } from '@/components/common/TokenChip';
import { ProgressWithLabel } from '@/components/common/ProgressWithLabel';
import { TaskListTable } from '@/components/tasks/TaskListTable';
import { UserAvatar } from '@/components/common/UserAvatar';
import { EmptyState } from '@/components/common/States';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useUi } from '@/state/UiProvider';
import { useToast } from '@/state/ToastProvider';
import { paths } from '@/app/navigation';
import { formatDate, percent } from '@/utils/format';
import { isDone, releaseReadiness } from '@/utils/selectors';

export function ReleaseDetailPage(): React.JSX.Element {
  const { releaseId } = useParams<{ releaseId: string }>();
  const navigate = useNavigate();
  const { state, dispatch, visibleTasks, userById, projectById } = useWorkspace();
  const { openTask } = useUi();
  const { notify } = useToast();

  const release = state.releases.find((r) => r.id === releaseId);

  const scopeTasks = useMemo(
    () => visibleTasks.filter((task) => task.releaseId === release?.id),
    [visibleTasks, release?.id],
  );
  const milestones = useMemo(
    () => state.milestones.filter((m) => m.releaseId === release?.id).sort((a, b) => a.date.localeCompare(b.date)),
    [state.milestones, release?.id],
  );
  const risks = useMemo(
    () => state.risks.filter((r) => r.releaseId === release?.id || r.projectId === release?.projectId),
    [state.risks, release?.id, release?.projectId],
  );

  if (!release) {
    return (
      <Box>
        <EmptyState
          title="Release not found"
          description="This release may have been removed or the link is out of date."
          action={
            <Button variant="contained" onClick={() => navigate(paths.releases)}>
              Back to releases
            </Button>
          }
        />
      </Box>
    );
  }

  const readiness = releaseReadiness(release);
  const features = scopeTasks.filter((task) => task.type === 'story' || task.type === 'improvement');
  const bugs = scopeTasks.filter((task) => task.type === 'bug');
  const project = projectById(release.projectId);

  return (
    <Box>
      <Button
        startIcon={<ArrowLeft size={15} />}
        onClick={() => navigate(paths.releases)}
        sx={{ mb: 1.5 }}
        color="inherit"
      >
        All releases
      </Button>

      <PageHeader
        title={`${release.name} ${release.version}`}
        description={release.description}
        meta={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <ReleaseStatusChip status={release.status} />
            <DeploymentChip status={release.deploymentStatus} />
            <Chip size="small" variant="outlined" label={project ? `${project.key} · ${project.name}` : 'No project'} />
            <Stack direction="row" spacing={0.75} alignItems="center">
              <UserAvatar user={userById(release.ownerId)} size={22} />
              <Typography variant="caption" color="text.secondary">
                {userById(release.ownerId)?.name ?? '—'}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Target {formatDate(release.targetDate)}
              {release.releasedOn ? ` · shipped ${formatDate(release.releasedOn)}` : ''}
            </Typography>
          </Stack>
        }
        actions={
          <>
            <TextField
              select
              size="small"
              label="Status"
              value={release.status}
              onChange={(e) => {
                dispatch({ type: 'release/update', releaseId: release.id, patch: { status: e.target.value as ReleaseStatus } });
                notify('Release status updated');
              }}
              sx={{ width: 170 }}
            >
              {RELEASE_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {releaseStatusTokens[status].label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Deployment"
              value={release.deploymentStatus}
              onChange={(e) => {
                dispatch({
                  type: 'release/update',
                  releaseId: release.id,
                  patch: { deploymentStatus: e.target.value as DeploymentStatus },
                });
                notify('Deployment status updated');
              }}
              sx={{ width: 170 }}
            >
              {DEPLOYMENT_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {deploymentStatusTokens[status].label}
                </MenuItem>
              ))}
            </TextField>
          </>
        }
      />

      {readiness < 100 && (release.status === 'in_testing' || release.status === 'in_development') ? (
        <Alert severity={readiness >= 70 ? 'warning' : 'error'} sx={{ mb: 3 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>
            {release.readiness.filter((c) => !c.done).length} readiness{' '}
            {release.readiness.filter((c) => !c.done).length === 1 ? 'check' : 'checks'} outstanding
          </AlertTitle>
          {release.readiness
            .filter((c) => !c.done)
            .map((c) => `${c.label} (${userById(c.ownerId)?.name ?? 'unassigned'})`)
            .join(' · ')}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          '& > *': { minWidth: 0 },
          gap: 2,
          mb: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        }}
      >
        <MetricCard label="Scope complete" value={`${percent(scopeTasks.filter(isDone).length, scopeTasks.length)}%`} caption={`${scopeTasks.length} items in scope`} progress={percent(scopeTasks.filter(isDone).length, scopeTasks.length)} />
        <MetricCard label="Readiness" value={`${readiness}%`} caption={`${release.readiness.filter((c) => c.done).length} of ${release.readiness.length} checks`} progress={readiness} tone={readiness >= 70 ? 'success' : 'warning'} />
        <MetricCard label="Open bugs" value={bugs.filter((b) => !isDone(b)).length} caption={`${bugs.length} total in scope`} tone={bugs.filter((b) => !isDone(b)).length > 0 ? 'warning' : 'default'} />
        <MetricCard label="Open risks" value={risks.filter((r) => r.status !== 'resolved').length} caption={`${risks.length} logged`} tone={risks.some((r) => r.severity === 'critical' && r.status !== 'resolved') ? 'error' : 'default'} />
      </Box>

      <Box sx={{ display: 'grid', '& > *': { minWidth: 0 }, gap: 2, mb: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        <Card>
          <CardHeader title="Release readiness checklist" subheader="Tick items as owners sign them off" />
          <CardContent sx={{ pt: 0 }}>
            <ProgressWithLabel value={readiness} color={readiness >= 70 ? 'success' : 'warning'} />
            <Stack sx={{ mt: 1.5 }}>
              {release.readiness.map((check) => (
                <FormControlLabel
                  key={check.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={check.done}
                      onChange={() => dispatch({ type: 'release/toggleReadiness', releaseId: release.id, checkId: check.id })}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        variant="body2"
                        sx={{ textDecoration: check.done ? 'line-through' : 'none', color: check.done ? 'text.disabled' : 'text.primary' }}
                      >
                        {check.label}
                      </Typography>
                      <Chip size="small" variant="outlined" label={userById(check.ownerId)?.initials ?? '—'} />
                    </Stack>
                  }
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Milestones" subheader="Key dates on the path to ship" />
          <CardContent sx={{ pt: 0 }}>
            {milestones.length === 0 ? (
              <EmptyState dense title="No milestones" description="Add milestones to mark decision points." />
            ) : (
              <Timeline disablePadding>
                {milestones.map((milestone) => (
                  <ListItem key={milestone.id} disableGutters alignItems="flex-start">
                    <ListItemIcon sx={{ minWidth: 30, mt: 0.5, color: milestone.completed ? 'success.main' : 'text.disabled' }}>
                      {milestone.completed ? <CircleCheck size={16} /> : <Diamond size={16} />}
                    </ListItemIcon>
                    <ListItemText
                      primary={milestone.name}
                      secondary={`${formatDate(milestone.date)} · ${milestone.description}`}
                      slotProps={{ primary: { variant: 'body2', fontWeight: 600 }, secondary: { variant: 'caption' } }}
                    />
                  </ListItem>
                ))}
              </Timeline>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Risks
            </Typography>
            {risks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No risks logged against this release.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {risks.map((risk) => (
                  <Box key={risk.id} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <RiskChip severity={risk.severity} />
                      <Chip size="small" variant="outlined" label={risk.status.replace('_', ' ')} />
                      <Typography variant="caption" color="text.secondary">
                        {userById(risk.ownerId)?.name}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight={600}>
                      {risk.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {risk.mitigation}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Release notes"
          subheader="Published with the release — edit before you ship"
        />
        <CardContent sx={{ pt: 0 }}>
          <TextField
            fullWidth
            multiline
            minRows={4}
            value={release.notes}
            onChange={(e) => dispatch({ type: 'release/update', releaseId: release.id, patch: { notes: e.target.value } })}
            label="Notes"
          />
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardHeader title={`Included features (${features.length})`} subheader="Stories and improvements in this release" />
        <CardContent sx={{ pt: 0 }}>
          <TaskListTable tasks={features} onOpenTask={openTask} showProject={false} height={features.length ? 420 : 200} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title={`Bugs (${bugs.length})`} subheader="Defects targeted at this release" />
        <CardContent sx={{ pt: 0 }}>
          {bugs.length === 0 ? (
            <EmptyState dense icon={<Circle size={18} />} title="No bugs in scope" />
          ) : (
            <TaskListTable tasks={bugs} onOpenTask={openTask} showProject={false} height={360} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

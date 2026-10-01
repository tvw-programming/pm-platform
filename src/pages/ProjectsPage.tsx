import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { Columns3, List as ListIcon, Plus, Search } from 'lucide-react';
import { PROJECT_STATUSES, type ProjectStatus } from '@/types/domain';
import { projectStatusTokens } from '@/app/tokens';
import { PageHeader } from '@/components/common/PageHeader';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { EmptyState } from '@/components/common/States';
import { HealthChip, PriorityChip, ProjectStatusChip } from '@/components/common/TokenChip';
import { ProgressWithLabel } from '@/components/common/ProgressWithLabel';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { useUi } from '@/state/UiProvider';
import { paths } from '@/app/navigation';
import { formatShortDate } from '@/utils/format';
import { projectStats } from '@/utils/selectors';

export function ProjectsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { state, visibleTasks, userById } = useWorkspace();
  const { openCreateProject } = useUi();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all');
  const [view, setView] = useState<'grid' | 'table'>('grid');

  const projects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return state.projects.filter((project) => {
      if (status !== 'all' && project.status !== status) return false;
      if (!query) return true;
      return `${project.key} ${project.name} ${project.productArea}`.toLowerCase().includes(query);
    });
  }, [state.projects, search, status]);

  return (
    <Box>
      <PageHeader
        title="Projects"
        description="Every delivery workspace in Helios Product Group, with live progress and health."
        actions={
          <Button variant="contained" startIcon={<Plus size={15} />} onClick={openCreateProject}>
            Create project
          </Button>
        }
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects"
          aria-label="Search projects"
          sx={{ width: { xs: '100%', md: 280 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={15} aria-hidden />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus | 'all')}
          sx={{ width: { xs: '100%', md: 180 } }}
        >
          <MenuItem value="all">All statuses</MenuItem>
          {PROJECT_STATUSES.map((value) => (
            <MenuItem key={value} value={value}>
              {projectStatusTokens[value].label}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          onChange={(_, value: 'grid' | 'table' | null) => value && setView(value)}
          aria-label="Project view"
        >
          <ToggleButton value="grid" aria-label="Card view">
            <Columns3 size={16} />
          </ToggleButton>
          <ToggleButton value="table" aria-label="Table view">
            <ListIcon size={16} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {projects.length === 0 ? (
        <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
          <EmptyState
            title="No projects match"
            description="Adjust the search or status filter, or create a new project to get started."
            action={
              <Button variant="contained" startIcon={<Plus size={15} />} onClick={openCreateProject}>
                Create project
              </Button>
            }
          />
        </Paper>
      ) : view === 'grid' ? (
        <Box
          sx={{
            display: 'grid',
            '& > *': { minWidth: 0 },
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' },
          }}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Health</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell sx={{ minWidth: 150 }}>Progress</TableCell>
                <TableCell>Target</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => {
                const stats = projectStats(visibleTasks, project.id);
                return (
                  <TableRow
                    key={project.id}
                    hover
                    onClick={() => navigate(paths.project(project.id))}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {project.key} · {project.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {project.productArea}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <ProjectStatusChip status={project.status} />
                    </TableCell>
                    <TableCell>
                      <HealthChip health={project.health} />
                    </TableCell>
                    <TableCell>
                      <PriorityChip priority={project.priority} />
                    </TableCell>
                    <TableCell>{userById(project.productOwnerId)?.name ?? '—'}</TableCell>
                    <TableCell>
                      <ProgressWithLabel value={stats.progress} size="sm" />
                    </TableCell>
                    <TableCell>{formatShortDate(project.targetReleaseDate)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

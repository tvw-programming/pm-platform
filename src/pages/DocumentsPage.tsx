import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { FileText, Search } from 'lucide-react';
import type { DocumentRecord, ID } from '@/types/domain';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/States';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useWorkspace } from '@/state/WorkspaceProvider';
import { formatRelative, titleCase } from '@/utils/format';

const DOC_KINDS = ['spec', 'prd', 'design', 'runbook', 'retro', 'notes'] as const;

interface DocumentsPageProps {
  projectId?: ID;
  embedded?: boolean;
}

export function DocumentsPage({ projectId, embedded = false }: DocumentsPageProps): React.JSX.Element {
  const { state, userById, projectById } = useWorkspace();
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<ID | 'all'>(projectId ?? 'all');
  const [open, setOpen] = useState<DocumentRecord | null>(null);

  const documents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const scopedProject = projectId ?? (projectFilter === 'all' ? undefined : projectFilter);
    return state.documents
      .filter((doc) => {
        if (scopedProject && doc.projectId !== scopedProject) return false;
        if (kind !== 'all' && doc.kind !== kind) return false;
        if (!query) return true;
        return `${doc.title} ${doc.excerpt} ${doc.tags.join(' ')}`.toLowerCase().includes(query);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [state.documents, search, kind, projectFilter, projectId]);

  return (
    <Box>
      {!embedded ? (
        <PageHeader
          title="Documents"
          description="Specs, PRDs, runbooks and retros attached to the work they describe."
        />
      ) : null}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents"
          aria-label="Search documents"
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
          label="Type"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          sx={{ width: { xs: '100%', md: 170 } }}
        >
          <MenuItem value="all">All types</MenuItem>
          {DOC_KINDS.map((value) => (
            <MenuItem key={value} value={value}>
              {titleCase(value)}
            </MenuItem>
          ))}
        </TextField>
        {!projectId ? (
          <TextField
            select
            label="Project"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value as ID | 'all')}
            sx={{ width: { xs: '100%', md: 220 } }}
          >
            <MenuItem value="all">All projects</MenuItem>
            {state.projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.key} · {project.name}
              </MenuItem>
            ))}
          </TextField>
        ) : null}
      </Stack>

      {documents.length === 0 ? (
        <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
          <EmptyState
            icon={<FileText size={22} />}
            title="No documents found"
            description="Nothing matches the current search and filters."
          />
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            '& > *': { minWidth: 0 },
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          }}
        >
          {documents.map((doc) => (
            <Card key={doc.id} sx={{ height: '100%' }}>
              <CardActionArea onClick={() => setOpen(doc)} sx={{ height: '100%', alignItems: 'stretch' }}>
                <CardContent sx={{ p: 2.25 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                    <Chip size="small" label={titleCase(doc.kind)} />
                    <Chip size="small" variant="outlined" label={projectById(doc.projectId)?.key ?? '—'} />
                  </Stack>
                  <Typography variant="h6" sx={{ mb: 0.75 }}>
                    {doc.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {doc.excerpt}
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                      <UserAvatar user={userById(doc.authorId)} size={22} />
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {userById(doc.authorId)?.name}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.disabled">
                      {formatRelative(doc.updatedAt)}
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={open !== null} onClose={() => setOpen(null)} maxWidth="sm" fullWidth>
        {open ? (
          <>
            <DialogTitle sx={{ fontWeight: 650 }}>{open.title}</DialogTitle>
            <DialogContent dividers>
              <Stack direction="row" spacing={0.75} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={titleCase(open.kind)} />
                <Chip size="small" variant="outlined" label={projectById(open.projectId)?.name ?? '—'} />
                {open.tags.map((tag) => (
                  <Chip key={tag} size="small" variant="outlined" label={`#${tag}`} />
                ))}
              </Stack>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {open.excerpt}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Written by {userById(open.authorId)?.name} · updated {formatRelative(open.updatedAt)}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setOpen(null)} color="inherit">
                Close
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
}

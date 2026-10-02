import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import { Inbox, Lock, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  dense?: boolean;
}

export function EmptyState({ title, description, icon, action, dense = false }: EmptyStateProps): React.JSX.Element {
  return (
    <Stack
      spacing={1.25}
      alignItems="center"
      justifyContent="center"
      sx={{ textAlign: 'center', py: dense ? 3 : 6, px: 3 }}
    >
      <Box
        sx={{
          width: dense ? 36 : 48,
          height: dense ? 36 : 48,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
          color: 'primary.main',
        }}
      >
        {icon ?? <Inbox size={dense ? 18 : 22} aria-hidden />}
      </Box>
      <Typography variant={dense ? 'subtitle2' : 'h6'}>{title}</Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ pt: 0.5 }}>{action}</Box> : null}
    </Stack>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this view. Try again, and if it keeps happening let the platform team know.',
  onRetry,
}: ErrorStateProps): React.JSX.Element {
  return (
    <Alert
      severity="error"
      icon={<TriangleAlert size={18} aria-hidden />}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
      sx={{ m: 2 }}
    >
      <AlertTitle sx={{ fontWeight: 700 }}>{title}</AlertTitle>
      {description}
    </Alert>
  );
}

export function PermissionDeniedState({ resource = 'this view' }: { resource?: string }): React.JSX.Element {
  return (
    <EmptyState
      icon={<Lock size={22} aria-hidden />}
      title="You do not have access"
      description={`Your workspace role does not include permission to open ${resource}. Ask a workspace admin to grant access.`}
    />
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }): React.JSX.Element {
  return (
    <Stack spacing={1.5} alignItems="center" justifyContent="center" sx={{ py: 8 }} role="status" aria-live="polite">
      <CircularProgress size={26} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

/* ------------------------------------------------------------------ */
/*  DisabledWithTooltip                                                */
/* ------------------------------------------------------------------ */

interface DisabledWithTooltipProps {
  disabled: boolean;
  reason: string;
  children: React.ReactElement;
}

export function DisabledWithTooltip({ disabled, reason, children }: DisabledWithTooltipProps): React.ReactElement {
  if (!disabled) return children;
  return (
    <Tooltip title={reason}>
      <span style={{ cursor: 'not-allowed', display: 'inline-block' }}>
        {React.cloneElement(children, {
          disabled: true,
          style: { ...children.props.style, pointerEvents: 'none' as const },
        })}
      </span>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/*  CardSkeletonGrid                                                   */
/* ------------------------------------------------------------------ */

export function CardSkeletonGrid({ count = 4, height = 120 }: { count?: number; height?: number }): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'grid',
        '& > *': { minWidth: 0 },
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={height} />
      ))}
    </Box>
  );
}

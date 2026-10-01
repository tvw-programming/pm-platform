import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

export type ToastSeverity = 'success' | 'info' | 'warning' | 'error';

interface ToastOptions {
  severity?: ToastSeverity;
  /** Renders an inline action button — used for undo on destructive actions. */
  actionLabel?: string;
  onAction?: () => void;
  autoHideMs?: number;
}

interface ToastState extends ToastOptions {
  key: number;
  message: string;
}

interface ToastContextValue {
  notify: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = useCallback((message: string, options?: ToastOptions) => {
    setToast({ key: Date.now(), message, ...options });
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ notify }), [notify]);

  const handleClose = (): void => setToast(null);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.key}
        open={toast !== null}
        autoHideDuration={toast?.autoHideMs ?? (toast?.actionLabel ? 7000 : 4000)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast?.severity ?? 'success'}
          variant="filled"
          onClose={handleClose}
          sx={{ alignItems: 'center' }}
          action={
            toast?.actionLabel ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  toast.onAction?.();
                  handleClose();
                }}
              >
                {toast.actionLabel}
              </Button>
            ) : undefined
          }
        >
          {toast?.message ?? ''}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}

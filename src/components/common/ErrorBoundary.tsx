import { Component, type ErrorInfo, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import { ErrorState } from './States';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Keeps a render failure in one subtree from blanking the whole workspace.
 * Class component because React has no hook equivalent for error capture.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // In a real deployment this is where the telemetry client would report.
    console.error('Unhandled render error', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <Box sx={{ p: 3, maxWidth: 720, mx: 'auto' }}>
          <ErrorState
            title="The workspace hit an unexpected error"
            description={this.state.error.message}
            onRetry={() => this.setState({ error: null })}
          />
        </Box>
      );
    }
    return this.props.children;
  }
}

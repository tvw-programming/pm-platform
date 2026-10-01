import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ColorModeProvider } from '@/state/ColorModeProvider';
import { ToastProvider } from '@/state/ToastProvider';
import { WorkspaceProvider } from '@/state/WorkspaceProvider';
import { UiProvider } from '@/state/UiProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { routes } from './routes';

const router = createBrowserRouter(routes);

export function App(): React.JSX.Element {
  return (
    <ColorModeProvider>
      <ErrorBoundary>
        <WorkspaceProvider>
          <ToastProvider>
            <UiProvider>
              <RouterProvider router={router} />
            </UiProvider>
          </ToastProvider>
        </WorkspaceProvider>
      </ErrorBoundary>
    </ColorModeProvider>
  );
}

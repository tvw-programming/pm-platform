import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { EmptyState } from '@/components/common/States';

interface RequirementsTabProps {
  taskId: string;
}

export default function RequirementsTab({ taskId: _taskId }: RequirementsTabProps): React.JSX.Element {
  return (
    <Box>
      <EmptyState
        dense
        title="Requirements"
        description="Requirements content will appear here. Link acceptance criteria, PRDs, and specifications to this task."
      />
    </Box>
  );
}

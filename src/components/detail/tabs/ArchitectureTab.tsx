import Box from '@mui/material/Box';
import { EmptyState } from '@/components/common/States';

interface ArchitectureTabProps {
  taskId: string;
}

export default function ArchitectureTab({ taskId: _taskId }: ArchitectureTabProps): React.JSX.Element {
  return (
    <Box>
      <EmptyState
        dense
        title="Architecture review"
        description="Architecture decisions, diagrams, and review status for this task will appear here."
      />
    </Box>
  );
}

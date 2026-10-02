import Box from '@mui/material/Box';
import { EmptyState } from '@/components/common/States';

interface QATabProps {
  taskId: string;
}

export default function QATab({ taskId: _taskId }: QATabProps): React.JSX.Element {
  return (
    <Box>
      <EmptyState
        dense
        title="QA status"
        description="Test plans, test results, and quality assurance status for this task will appear here."
      />
    </Box>
  );
}

import Box from '@mui/material/Box';
import { EmptyState } from '@/components/common/States';

interface DesignTabProps {
  taskId: string;
}

export default function DesignTab({ taskId: _taskId }: DesignTabProps): React.JSX.Element {
  return (
    <Box>
      <EmptyState
        dense
        title="Design assets"
        description="Figma files, mockups, and design specifications linked to this task will appear here."
      />
    </Box>
  );
}

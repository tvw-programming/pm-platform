import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/common/States';
import { paths } from '@/app/navigation';

export function NotFoundPage(): React.JSX.Element {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <EmptyState
        icon={<Compass size={22} />}
        title="This page does not exist"
        description="The link may be out of date, or the item was moved. Head back to the dashboard to pick up where you left off."
        action={
          <Button variant="contained" onClick={() => navigate(paths.home)}>
            Go to dashboard
          </Button>
        }
      />
    </Box>
  );
}

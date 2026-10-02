import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/States';
import { Lightbulb } from 'lucide-react';

export function IdeasPage(): React.JSX.Element {
  return (
    <>
      <PageHeader title="Ideas Pipeline" />
      <EmptyState
        title="Ideas pipeline coming soon"
        description="Collect, vote on, and prioritise product ideas from your team and customers."
        icon={<Lightbulb size={22} aria-hidden />}
      />
    </>
  );
}

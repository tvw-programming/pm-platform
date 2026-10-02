import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/States';
import { MessageSquare } from 'lucide-react';

export function FeedbackPage(): React.JSX.Element {
  return (
    <>
      <PageHeader title="Feedback Inbox" />
      <EmptyState
        title="Feedback inbox coming soon"
        description="Aggregate customer feedback from Zendesk, Intercom, Slack, and surveys in one place."
        icon={<MessageSquare size={22} aria-hidden />}
      />
    </>
  );
}

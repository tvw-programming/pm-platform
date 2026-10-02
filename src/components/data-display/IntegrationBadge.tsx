import { memo, useCallback } from 'react';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { Github, ExternalLink } from 'lucide-react';
import type { IntegrationRef } from '@/types/domain';

const providerLabels: Record<IntegrationRef['provider'], string> = {
  github: 'GitHub',
  jira: 'Jira',
  zendesk: 'ZD',
  figma: 'Figma',
  slack: 'Slack',
};

function getTooltip(integration: IntegrationRef): string {
  const label = integration.label ?? providerLabels[integration.provider];
  switch (integration.provider) {
    case 'github':
      return integration.prCount
        ? `${label} — ${integration.prCount} PR${integration.prCount === 1 ? '' : 's'}`
        : label;
    case 'jira':
      return `${label} — linked issue`;
    case 'zendesk':
      return `${label} — source ticket`;
    case 'figma':
      return `${label} — design link`;
    case 'slack':
      return `${label} — thread`;
    default:
      return label;
  }
}

function getChipLabel(integration: IntegrationRef): string {
  switch (integration.provider) {
    case 'github':
      return integration.prCount ? `${integration.prCount} PR${integration.prCount === 1 ? '' : 's'}` : 'GitHub';
    case 'jira':
      return 'Jira';
    case 'zendesk':
      return 'ZD';
    case 'figma':
      return 'Figma';
    case 'slack':
      return 'Slack';
    default:
      return integration.provider;
  }
}

interface IntegrationBadgeProps {
  integration: IntegrationRef;
  size?: 'small' | 'medium';
}

export const IntegrationBadge = memo(function IntegrationBadge({
  integration,
  size = 'small',
}: IntegrationBadgeProps) {
  const handleClick = useCallback(() => {
    if (integration.url) {
      window.open(integration.url, '_blank', 'noopener,noreferrer');
    }
  }, [integration.url]);

  const icon =
    integration.provider === 'github' ? (
      <Github size={size === 'small' ? 14 : 16} />
    ) : (
      <ExternalLink size={size === 'small' ? 12 : 14} />
    );

  return (
    <Tooltip title={getTooltip(integration)}>
      <Chip
        size={size}
        icon={icon}
        label={getChipLabel(integration)}
        variant="outlined"
        onClick={integration.url ? handleClick : undefined}
        clickable={Boolean(integration.url)}
        sx={{ cursor: integration.url ? 'pointer' : 'default' }}
      />
    </Tooltip>
  );
});

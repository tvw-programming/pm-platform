import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import type { User } from '@/types/domain';

interface UserAvatarProps {
  user?: User;
  size?: number;
  showTooltip?: boolean;
}

export function UserAvatar({ user, size = 26, showTooltip = true }: UserAvatarProps): React.JSX.Element {
  const avatar = (
    <Avatar
      aria-label={user ? user.name : 'Unassigned'}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        bgcolor: user ? alpha(user.avatarColor, 0.18) : 'action.hover',
        color: user ? user.avatarColor : 'text.disabled',
        border: '1px solid',
        borderColor: user ? alpha(user.avatarColor, 0.35) : 'divider',
      }}
    >
      {user ? user.initials : '–'}
    </Avatar>
  );

  if (!showTooltip) return avatar;
  return (
    <Tooltip title={user ? `${user.name} · ${user.jobTitle}` : 'Unassigned'}>
      <span style={{ display: 'inline-flex' }}>{avatar}</span>
    </Tooltip>
  );
}

interface UserAvatarStackProps {
  users: User[];
  max?: number;
  size?: number;
}

export function UserAvatarStack({ users, max = 5, size = 26 }: UserAvatarStackProps): React.JSX.Element {
  return (
    <AvatarGroup
      max={max}
      sx={{
        '& .MuiAvatar-root': {
          width: size,
          height: size,
          fontSize: size * 0.38,
          borderColor: 'background.paper',
        },
      }}
    >
      {users.map((user) => (
        <Tooltip key={user.id} title={`${user.name} · ${user.jobTitle}`}>
          <Avatar
            aria-label={user.name}
            sx={{
              bgcolor: alpha(user.avatarColor, 0.2),
              color: user.avatarColor,
            }}
          >
            {user.initials}
          </Avatar>
        </Tooltip>
      ))}
    </AvatarGroup>
  );
}

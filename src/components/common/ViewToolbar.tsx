import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  Group,
  Kanban,
  LayoutList,
  Search,
  Calendar,
  GanttChart,
  X,
} from 'lucide-react';

export type ViewMode = 'board' | 'table' | 'timeline' | 'calendar';

export interface GroupByOption {
  id: string;
  label: string;
}

export interface SortOption {
  id: string;
  label: string;
}

export interface FilterOption {
  id: string;
  label: string;
  values: { id: string; label: string }[];
}

interface ViewToolbarProps {
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  availableViews?: ViewMode[];
  search?: string;
  onSearchChange?: (value: string) => void;
  groupBy?: string | null;
  onGroupByChange?: (value: string | null) => void;
  groupByOptions?: GroupByOption[];
  sortBy?: string | null;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (by: string | null, dir: 'asc' | 'desc') => void;
  sortOptions?: SortOption[];
  filterOptions?: FilterOption[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (filters: Record<string, string>) => void;
  actions?: ReactNode;
}

const VIEW_ICONS: Record<ViewMode, typeof Kanban> = {
  board: Kanban,
  table: LayoutList,
  timeline: GanttChart,
  calendar: Calendar,
};

const VIEW_LABELS: Record<ViewMode, string> = {
  board: 'Board',
  table: 'Table',
  timeline: 'Timeline',
  calendar: 'Calendar',
};

export function ViewToolbar({
  viewMode,
  onViewModeChange,
  availableViews = ['board', 'table', 'timeline', 'calendar'],
  search,
  onSearchChange,
  groupBy,
  onGroupByChange,
  groupByOptions,
  sortBy,
  sortDir = 'asc',
  onSortChange,
  sortOptions,
  filterOptions,
  activeFilters,
  onFilterChange,
  actions,
}: ViewToolbarProps): React.JSX.Element {
  const [groupAnchor, setGroupAnchor] = useState<HTMLElement | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);

  const activeFilterCount = activeFilters ? Object.values(activeFilters).filter(Boolean).length : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1.5,
        flexWrap: 'wrap',
      }}
    >
      {viewMode && onViewModeChange && (
        <>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v: ViewMode | null) => { if (v) onViewModeChange(v); }}
            size="small"
            sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.5 } }}
          >
            {availableViews.map((mode) => {
              const Icon = VIEW_ICONS[mode];
              return (
                <ToggleButton key={mode} value={mode} aria-label={VIEW_LABELS[mode]}>
                  <Icon size={16} />
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        </>
      )}

      {onSearchChange && (
        <TextField
          size="small"
          placeholder="Search..."
          value={search ?? ''}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ width: { xs: '100%', sm: 220 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => onSearchChange('')} edge="end">
                    <X size={14} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
      )}

      <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
        {groupByOptions && onGroupByChange && (
          <>
            <Tooltip title="Group by">
              <IconButton
                size="small"
                onClick={(e) => setGroupAnchor(e.currentTarget)}
                color={groupBy ? 'primary' : 'default'}
              >
                <Group size={18} />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={groupAnchor} open={Boolean(groupAnchor)} onClose={() => setGroupAnchor(null)}>
              <MenuItem
                selected={!groupBy}
                onClick={() => { onGroupByChange(null); setGroupAnchor(null); }}
              >
                <ListItemText>None</ListItemText>
              </MenuItem>
              {groupByOptions.map((opt) => (
                <MenuItem
                  key={opt.id}
                  selected={groupBy === opt.id}
                  onClick={() => { onGroupByChange(opt.id); setGroupAnchor(null); }}
                >
                  <ListItemText>{opt.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {sortOptions && onSortChange && (
          <>
            <Tooltip title="Sort">
              <IconButton
                size="small"
                onClick={(e) => setSortAnchor(e.currentTarget)}
                color={sortBy ? 'primary' : 'default'}
              >
                {sortDir === 'asc' ? <ArrowDownAZ size={18} /> : <ArrowUpAZ size={18} />}
              </IconButton>
            </Tooltip>
            <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
              {sortOptions.map((opt) => (
                <MenuItem
                  key={opt.id}
                  selected={sortBy === opt.id}
                  onClick={() => {
                    if (sortBy === opt.id) {
                      onSortChange(opt.id, sortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                      onSortChange(opt.id, 'asc');
                    }
                    setSortAnchor(null);
                  }}
                >
                  <ListItemIcon>
                    {sortBy === opt.id
                      ? sortDir === 'asc'
                        ? <ArrowDownAZ size={16} />
                        : <ArrowUpAZ size={16} />
                      : <Box sx={{ width: 16 }} />}
                  </ListItemIcon>
                  <ListItemText>{opt.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {filterOptions && onFilterChange && (
          <>
            <Tooltip title={activeFilterCount ? `${activeFilterCount} active filter(s)` : 'Filter'}>
              <IconButton
                size="small"
                onClick={(e) => setFilterAnchor(e.currentTarget)}
                color={activeFilterCount > 0 ? 'primary' : 'default'}
              >
                <Filter size={18} />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={() => setFilterAnchor(null)}>
              {filterOptions.map((filter) => (
                <Box key={filter.id}>
                  <MenuItem disabled sx={{ opacity: 1, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {filter.label}
                  </MenuItem>
                  {filter.values.map((val) => (
                    <MenuItem
                      key={val.id}
                      selected={activeFilters?.[filter.id] === val.id}
                      onClick={() => {
                        const next = { ...activeFilters };
                        if (next[filter.id] === val.id) {
                          delete next[filter.id];
                        } else {
                          next[filter.id] = val.id;
                        }
                        onFilterChange(next);
                      }}
                      sx={{ pl: 4 }}
                    >
                      <ListItemText>{val.label}</ListItemText>
                    </MenuItem>
                  ))}
                </Box>
              ))}
              {activeFilterCount > 0 && (
                <>
                  <Divider />
                  <MenuItem onClick={() => { onFilterChange({}); setFilterAnchor(null); }}>
                    <ListItemText sx={{ color: 'error.main' }}>Clear all filters</ListItemText>
                  </MenuItem>
                </>
              )}
            </Menu>
          </>
        )}
      </Box>

      {actions}
    </Box>
  );
}

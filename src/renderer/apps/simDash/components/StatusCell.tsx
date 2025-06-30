import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Typography, Chip } from '@mui/material';
import { ScheduleItem } from '@/types/sqlite';
import { selectMatchLiveStatus } from '@/simDash/store/slices/scheduleSlice';
import type { RootState } from '@/store/store';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

interface StatusCellProps {
  item: ScheduleItem;
  league: string;
}

// Determine chip color based on status
const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  const statusLower = status.toLowerCase();
  
  // Green for live/in-progress games
  if (statusLower.includes('live') || statusLower.includes('progress') || statusLower === 'in progress') {
    return 'success';
  }
  // Red for final games
  if (statusLower.includes('final')) {
    return 'error';
  }
  // Yellow/warning for delays
  if (statusLower.includes('postponed') || statusLower.includes('delayed') || statusLower.includes('suspended')) {
    return 'warning';
  }
  // Red for cancelled games
  if (statusLower.includes('cancelled')) {
    return 'error';
  }
  // Blue for scheduled/warmup games
  if (statusLower.includes('scheduled') || statusLower.includes('warmup')) {
    return 'primary';
  }
  
  return 'default';
};

const StatusCell: React.FC<StatusCellProps> = React.memo(({ item, league }) => {
  // Check if this game is today in Pacific timezone - memoize this check
  const isToday = useMemo(() => {
    if (league !== 'MLB') return false;
    const today = dayjs().tz('America/Los_Angeles').format('YYYY-MM-DD');
    const gameDate = dayjs(item.PostDtmUTC).format('YYYY-MM-DD');
    return gameDate === today;
  }, [item.PostDtmUTC, league]);

  // Only call selector for today's MLB games to minimize re-renders
  const liveStatus = useSelector((state: RootState) => 
    isToday ? selectMatchLiveStatus(state, league, item.Match) : null
  );

  // Calculate display status with memoization
  const displayStatus = useMemo(() => {
    if (isToday && liveStatus) {
      // For live games, prioritize detailedState over abstractGameState
      // Only show reason (event type) if it's something meaningful for status display
      if (liveStatus.detailedState === 'In Progress' && liveStatus.reason) {
        // For in-progress games, you might want to show the last play, but let's use detailedState
        return liveStatus.detailedState;
      }
      return liveStatus.detailedState || liveStatus.abstractGameState;
    }
    // Normalize status from database/API - handle common variations
    const dbStatus = item.Status ?? 'N/A';
    // Convert common status variations to consistent format
    if (dbStatus.toLowerCase() === 'in progress' || dbStatus.toLowerCase() === 'live') {
      return 'In Progress';
    }
    return dbStatus;
  }, [isToday, liveStatus, item.Status]);

  // Calculate status color
  const statusColor = getStatusColor(displayStatus);

  // For today's games, show as chip; for other days show as text
  if (isToday) {
    return (
      <Chip 
        label={displayStatus}
        color={statusColor}
        size="small"
        variant="filled"
      />
    );
  }

  return (
    <Typography variant="body2" color="text.secondary">
      {displayStatus}
    </Typography>
  );
}, (prevProps, nextProps) => {
  // Custom equality check for props
  return (
    prevProps.item.Match === nextProps.item.Match &&
    prevProps.item.Status === nextProps.item.Status &&
    prevProps.item.PostDtmUTC === nextProps.item.PostDtmUTC &&
    prevProps.league === nextProps.league
  );
});

StatusCell.displayName = 'StatusCell';

export default StatusCell; 
import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Badge,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  AccountBox as AccountBoxIcon,
  Description as DescriptionIcon,
  Handshake as HandshakeIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { LedgerSubtypeCardProps } from '../types';

// Icon mapping function
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ReactElement> = {
    'AccountBalance': <AccountBalanceIcon />,
    'AccountBox': <AccountBoxIcon />,
    'Description': <DescriptionIcon />,
    'Handshake': <HandshakeIcon />,
    'TrendingUp': <TrendingUpIcon />,
  };
  
  return iconMap[iconName] || <DescriptionIcon />;
};

export const LedgerSubtypeCard: React.FC<LedgerSubtypeCardProps> = ({
  type,
  subtype,
  config,
  itemCount = 0,
  onSubtypeClick,
}) => {
  const handleClick = () => {
    onSubtypeClick(type, subtype);
  };

  const getSubtypeIcon = () => {
    return getIconComponent(config.ui.icon || 'Description');
  };

  const getSubtypeColor = () => {
    return config.ui.color || '#1976d2';
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
      }}
    >
      <CardActionArea 
        onClick={handleClick}
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
          {/* Header with icon and title */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: getSubtypeColor(),
                color: 'white',
                mr: 2,
                flexShrink: 0,
                '& svg': {
                  fontSize: 20,
                },
              }}
            >
              {getSubtypeIcon()}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" component="h3" gutterBottom noWrap>
                {config.displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {type} • {subtype}
              </Typography>
            </Box>
            {/* Item count badge */}
            {itemCount > 0 && (
              <Badge
                badgeContent={itemCount}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    height: '20px',
                    minWidth: '20px',
                  },
                }}
              >
                <Box sx={{ width: 16, height: 16 }} />
              </Badge>
            )}
          </Box>

          {/* Description */}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {config.ui.cardDescription}
          </Typography>

          {/* Additional info */}
          <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip 
              label={itemCount === 0 ? 'No items' : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
              size="small"
              color={itemCount > 0 ? 'primary' : 'default'}
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              Click to manage
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default LedgerSubtypeCard; 
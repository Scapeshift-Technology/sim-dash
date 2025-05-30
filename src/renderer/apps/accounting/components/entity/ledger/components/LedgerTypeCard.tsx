import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Handshake as HandshakeIcon,
} from '@mui/icons-material';
import { LedgerTypeCardProps } from '../types';
import { getImplementedSubtypes } from '../config';

export const LedgerTypeCard: React.FC<LedgerTypeCardProps> = ({
  type,
  subtypes,
  onTypeClick,
}) => {
  const implementedSubtypes = getImplementedSubtypes(type);
  const totalSubtypes = subtypes.length;
  const implementedCount = implementedSubtypes.length;

  const handleClick = () => {
    onTypeClick(type);
  };

  const getTypeIcon = () => {
    return type === 'Asset' ? <TrendingUpIcon /> : <HandshakeIcon />;
  };

  const getTypeColor = () => {
    return type === 'Asset' ? '#4caf50' : '#ff9800';
  };

  const getTypeDescription = () => {
    return type === 'Asset' 
      ? 'Manage asset ledgers including bankrolls, counterparty accounts, and maker accounts'
      : 'Manage equity ledgers including partnerships and loan agreements';
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
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
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          {/* Header with icon and title */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: getTypeColor(),
                color: 'white',
                mr: 2,
                flexShrink: 0,
              }}
            >
              {getTypeIcon()}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" component="h2" gutterBottom noWrap>
                {type} Ledgers
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                {implementedCount} of {totalSubtypes} types available
              </Typography>
            </Box>
          </Box>

          {/* Description */}
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              mb: 3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {getTypeDescription()}
          </Typography>

          {/* Subtype chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {subtypes.map((subtype) => {
              const isImplemented = implementedSubtypes.includes(subtype);
              return (
                <Chip
                  key={subtype}
                  label={subtype}
                  size="small"
                  color={isImplemented ? 'primary' : 'default'}
                  variant={isImplemented ? 'filled' : 'outlined'}
                />
              );
            })}
          </Box>

        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default LedgerTypeCard; 
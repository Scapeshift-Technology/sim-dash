import React from 'react';
import { Box, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';

// ---------- Sub-component ----------

const BaseSquare: React.FC<{ 
    isOccupied: boolean; 
    isEditable?: boolean; 
    onClick?: () => void;
}> = ({ isOccupied, isEditable = false, onClick }) => (
    <Box 
        sx={{
            width: '14px',
            height: '14px',
            transform: 'rotate(45deg)',
            backgroundColor: isOccupied ? 'white' : 'transparent',
            border: '2px solid white',
            cursor: isEditable ? 'pointer' : 'default',
            '&:hover': isEditable ? {
                backgroundColor: isOccupied ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)',
            } : {}
        }} 
        onClick={isEditable ? onClick : undefined}
    />
);

const BasesGraphic: React.FC<{
    firstBase: string | undefined,
    secondBase: string | undefined,
    thirdBase: string | undefined,
    isEditable?: boolean,
    onBaseChange?: (base: 'first' | 'second' | 'third', occupied: boolean) => void
}> = ({ firstBase, secondBase, thirdBase, isEditable = false, onBaseChange }) => {
    
    const handleBaseClick = (base: 'first' | 'second' | 'third', currentlyOccupied: boolean) => {
        if (isEditable && onBaseChange) {
            onBaseChange(base, !currentlyOccupied);
        }
    };

    return (
        <Box sx={{ 
            position: 'relative',
            width: '72px',
            height: '72px',
            // backgroundColor: 'grey.900',
            borderRadius: 1,
            // padding: '8px'
        }}>
            {/* Second Base (Top) */}
            <Box sx={{ 
                position: 'absolute',
                top: '8px',
                left: '50%',
                transform: 'translateX(-50%)'
            }}>
                <BaseSquare 
                    isOccupied={!!secondBase} 
                    isEditable={isEditable}
                    onClick={() => handleBaseClick('second', !!secondBase)}
                />
            </Box>
            
            {/* Third Base (Left) */}
            <Box sx={{ 
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)'
            }}>
                <BaseSquare 
                    isOccupied={!!thirdBase} 
                    isEditable={isEditable}
                    onClick={() => handleBaseClick('third', !!thirdBase)}
                />
            </Box>
            
            {/* First Base (Right) */}
            <Box sx={{ 
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)'
            }}>
                <BaseSquare 
                    isOccupied={!!firstBase} 
                    isEditable={isEditable}
                    onClick={() => handleBaseClick('first', !!firstBase)}
                />
            </Box>
        </Box>
    );
};

// ---------- Main component ----------

interface BasesAndCountDisplayProps {
    balls: number;
    strikes: number;
    outs: number;
    firstBase: string | undefined;
    secondBase: string | undefined;
    thirdBase: string | undefined;
    isEditable?: boolean;
    onOutsChange?: (outs: number) => void;
    onBaseChange?: (base: 'first' | 'second' | 'third', occupied: boolean) => void;
}

const BasesAndCountDisplay: React.FC<BasesAndCountDisplayProps> = ({
    balls,
    strikes,
    outs,
    firstBase,
    secondBase,
    thirdBase,
    isEditable = false,
    onOutsChange,
    onBaseChange
}) => {
    const handleOutClick = (outNumber: number) => {
        if (!isEditable || !onOutsChange) return;
        
        if (outs === outNumber) { // Reset to 0
            onOutsChange(0);
        } else {
            onOutsChange(outNumber);
        }
    };

    // Generate out indicators - make them clickable when editable
    const outIndicators = Array(3).fill(0).map((_, index) => {
        const outNumber = index + 1;
        const isCurrentOut = index < outs;
        const IconComponent = isCurrentOut ? CircleIcon : CircleOutlinedIcon;
        
        return (
            <IconComponent 
                key={index} 
                sx={{ 
                    fontSize: 12,
                    cursor: isEditable ? 'pointer' : 'default',
                    '&:hover': isEditable ? {
                        opacity: 0.7
                    } : {}
                }}
                onClick={() => handleOutClick(outNumber)}
            />
        );
    });

    return (
        <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1
        }}>
            <BasesGraphic 
                firstBase={firstBase}
                secondBase={secondBase}
                thirdBase={thirdBase}
                isEditable={isEditable}
                onBaseChange={onBaseChange}
            />
            <Box sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center'
            }}>
                <Typography variant="body2">
                    {balls}-{strikes}
                </Typography>
                <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5,
                    alignItems: 'center'
                }}>
                    {outIndicators}
                </Box>
            </Box>
        </Box>
    );
};

export default BasesAndCountDisplay;

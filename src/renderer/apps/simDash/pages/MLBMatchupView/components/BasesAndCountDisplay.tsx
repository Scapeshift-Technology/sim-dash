import React from 'react';
import { Box, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';

// ---------- Sub-component ----------

const BaseSquare: React.FC<{ isOccupied: boolean }> = ({ isOccupied }) => (
    <Box sx={{
        width: '14px',
        height: '14px',
        transform: 'rotate(45deg)',
        backgroundColor: isOccupied ? 'white' : 'transparent',
        border: '2px solid white',
    }} />
);

const BasesGraphic: React.FC<{
    firstBase: string | undefined,
    secondBase: string | undefined,
    thirdBase: string | undefined
}> = ({ firstBase, secondBase, thirdBase }) => {
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
                <BaseSquare isOccupied={!!secondBase} />
            </Box>
            
            {/* Third Base (Left) */}
            <Box sx={{ 
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)'
            }}>
                <BaseSquare isOccupied={!!thirdBase} />
            </Box>
            
            {/* First Base (Right) */}
            <Box sx={{ 
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)'
            }}>
                <BaseSquare isOccupied={!!firstBase} />
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
}

const BasesAndCountDisplay: React.FC<BasesAndCountDisplayProps> = ({
    balls,
    strikes,
    outs,
    firstBase,
    secondBase,
    thirdBase
}) => {
    // Generate out indicators
    const outIndicators = Array(3).fill(0).map((_, index) => (
        index < outs ? (
            <CircleIcon key={index} sx={{ fontSize: 12 }} />
        ) : (
            <CircleOutlinedIcon key={index} sx={{ fontSize: 12 }} />
        )
    ));

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

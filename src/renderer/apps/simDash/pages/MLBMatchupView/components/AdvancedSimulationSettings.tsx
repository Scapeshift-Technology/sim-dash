import React, { useState } from 'react';
import {
    Box,
    Typography,
    Collapse,
    IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface AdvancedSimulationSettingsProps {
    children: React.ReactNode | React.ReactNode[];
    caption: string;
}

const AdvancedSimulationSettings: React.FC<AdvancedSimulationSettingsProps> = ({
    children,
    caption
}) => {
    const [expanded, setExpanded] = useState(false);

    const handleToggle = () => {
        setExpanded(!expanded);
    };

    // ---------- Render ----------

    // Ensure children is always an array for consistent mapping
    const childrenArray = Array.isArray(children) ? children : [children];

    return (
        <Box sx={{ mt: 1 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 1,
                    '&:hover': {
                        backgroundColor: 'action.hover'
                    }
                }}
                onClick={handleToggle}
            >
                <IconButton size="small" sx={{ p: 0, mr: 1 }}>
                    {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
                <Typography 
                    variant="caption" 
                    sx={{ 
                        fontWeight: 500,
                        color: 'text.secondary',
                        userSelect: 'none'
                    }}
                >
                    {caption}
                </Typography>
            </Box>
            
            <Collapse in={expanded}>
                <Box sx={{ 
                    mt: 0, 
                    p: 2
                }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {childrenArray.map((child, index) => (
                            <React.Fragment key={index}>
                                {child}
                            </React.Fragment>
                        ))}
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
};

export default AdvancedSimulationSettings; 
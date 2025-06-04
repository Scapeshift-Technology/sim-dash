import React from 'react';
import {
    Box,
    Tabs,
    Tab
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { selectActiveTab, setActiveTab } from '@/apps/simDash/store/slices/statCaptureSettingsSlice';

// ---------- Types ----------

export interface FolderTab {
    id: string;
    label: string;
    content: React.ReactNode;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

interface FolderTabsProps {
    tabs: FolderTab[];
    leagueName: string;
    ariaLabel?: string;
}

// ---------- Helper components ----------

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`folder-tabpanel-${index}`}
            aria-labelledby={`folder-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

// ---------- Main component ----------

const FolderTabs: React.FC<FolderTabsProps> = ({ 
    tabs, 
    leagueName,
    ariaLabel = "folder tabs" 
}) => {
    // ---------- Redux ----------

    const dispatch = useDispatch();
    const selectedTab = useSelector((state: any) => selectActiveTab(state, leagueName));

    // ---------- Event handlers ----------

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        dispatch(setActiveTab({ leagueName, tabIndex: newValue }));
    };

    // ---------- Render ----------

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Folder-style tabs */}
            <Box sx={{ mb: 0, zIndex: 1 }}>
                <Tabs 
                    value={selectedTab} 
                    onChange={handleTabChange} 
                    aria-label={ariaLabel}
                    sx={{
                        minHeight: 'unset',
                        '& .MuiTabs-indicator': {
                            display: 'none', // Hide the default indicator
                        },
                        '& .MuiTab-root': {
                            minHeight: '40px',
                            backgroundColor: '#f5f5f5',
                            border: '1px solid #d0d0d0',
                            borderBottom: 'none',
                            borderRadius: '8px 8px 0 0',
                            color: '#666',
                            textTransform: 'none',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            '&:not(:first-of-type)': {
                                marginLeft: '-1px', // Overlap borders so they connect
                            },
                            '&:hover': {
                                backgroundColor: '#ebebeb',
                                zIndex: 1,
                            },
                            '&.Mui-selected': {
                                backgroundColor: 'background.paper',
                                color: 'text.primary',
                                borderColor: '#d0d0d0',
                                zIndex: 2,
                                position: 'relative',
                            }
                        }
                    }}
                >
                    {tabs.map((tab, index) => (
                        <Tab 
                            key={tab.id}
                            label={tab.label} 
                            id={`folder-tab-${index}`}
                            aria-controls={`folder-tabpanel-${index}`}
                        />
                    ))}
                </Tabs>
            </Box>

            {/* Content area that looks connected to the active tab */}
            <Box sx={{ 
                flexGrow: 1, 
                backgroundColor: 'background.paper',
                border: '1px solid #d0d0d0',
                borderRadius: '0 8px 8px 8px',
                overflow: 'auto'
            }}>
                {tabs.map((tab, index) => (
                    <TabPanel key={tab.id} value={selectedTab} index={index}>
                        {tab.content}
                    </TabPanel>
                ))}
            </Box>
        </Box>
    );
};

export default FolderTabs; 
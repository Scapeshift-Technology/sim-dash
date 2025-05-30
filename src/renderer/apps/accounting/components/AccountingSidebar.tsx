import React from 'react';
import { List, ListItemButton, ListItemText } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import GenericSidebar from '@/layouts/components/GenericSidebar';

interface AccountingSidebarProps {
    currentWidth: number;
    onResize: (newWidth: number) => void;
}

const AccountingSidebar: React.FC<AccountingSidebarProps> = ({ currentWidth, onResize }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // ---------- Handlers ----------

    const handleCategoryClick = (category: string, path: string, isEnabled: boolean) => {
        if (!isEnabled) return;
        console.log(`Category clicked: ${category}`);
        navigate(path);
    };

    // ---------- Menu Configuration ----------

    const menuItems = [
        { 
            label: 'Accounts', 
            path: '/accounts/coming-soon',
            key: 'accounts',
            enabled: false,
            isComingSoon: true
        },
        { 
            label: 'Counterparties', 
            path: '/counterparties-main',
            key: 'counterparties',
            enabled: true,
            isComingSoon: false
        },
        { 
            label: 'Ledgers', 
            path: '/ledgers',
            key: 'ledgers',
            enabled: true,
            isComingSoon: false
        },
        { 
            label: 'Quick grader', 
            path: '/quick-grader/coming-soon',
            key: 'quick-grader',
            enabled: false,
            isComingSoon: true
        },
    ];

    // ---------- Render content ----------

    const content = (
        <List>
            {menuItems.map((item) => {
                const isActive = item.enabled && (
                    location.pathname.startsWith(item.path) ||
                    (item.key === 'counterparties' && location.pathname.startsWith('/counterparties'))
                );
                
                return (
                    <ListItemButton
                        key={item.key}
                        selected={isActive}
                        onClick={() => handleCategoryClick(item.label, item.path, item.enabled)}
                        disabled={!item.enabled}
                        sx={{
                            color: item.enabled ? 'inherit' : 'text.disabled',
                            cursor: item.enabled ? 'pointer' : 'not-allowed',
                            '&.Mui-disabled': {
                                opacity: 0.4,
                                backgroundColor: 'transparent',
                            },
                            '&.Mui-disabled:hover': {
                                backgroundColor: 'transparent',
                            },
                        }}
                    >
                        <ListItemText primary={item.label} />
                    </ListItemButton>
                );
            })}
        </List>
    );

    return (
        <GenericSidebar currentWidth={currentWidth} onResize={onResize}>
            {content}
        </GenericSidebar>
    );
};

export default AccountingSidebar;

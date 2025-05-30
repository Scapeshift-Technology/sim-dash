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

    const handleCategoryClick = (category: string, path: string) => {
        console.log(`Category clicked: ${category}`);
        navigate(path);
    };

    // ---------- Menu Configuration ----------

    const menuItems = [
        { 
            label: 'Quick grader', 
            path: '/quick-grader',
            key: 'quick-grader' 
        },
        { 
            label: 'Accounts', 
            path: '/accounts',
            key: 'accounts' 
        },
        { 
            label: 'Counterparties', 
            path: '/counterparties',
            key: 'counterparties' 
        },
        { 
            label: 'Ledgers', 
            path: '/ledgers',
            key: 'ledgers' 
        },
    ];

    // ---------- Render content ----------

    const content = (
        <List>
            {menuItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                
                return (
                    <ListItemButton
                        key={item.key}
                        selected={isActive}
                        onClick={() => handleCategoryClick(item.label, item.path)}
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

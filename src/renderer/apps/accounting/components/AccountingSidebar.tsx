import React from 'react';
import { List, ListItemButton, ListItemText } from '@mui/material';
import GenericSidebar from '@/components/GenericSidebar';

interface AccountingSidebarProps {
    currentWidth: number;
    onResize: (newWidth: number) => void;
}

const AccountingSidebar: React.FC<AccountingSidebarProps> = ({ currentWidth, onResize }) => {
    // ---------- Handlers ----------

    const handleCategoryClick = (category: string) => {
        console.log(`Category clicked: ${category}`);
    };

    // ---------- Render content ----------

    const categories = ['Quick grader', 'Accounts'];

    const content = (
        <List>
            {categories.map((category) => (
                <ListItemButton
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                >
                    <ListItemText primary={category} />
                </ListItemButton>
            ))}
        </List>
    );

    return (
        <GenericSidebar currentWidth={currentWidth} onResize={onResize}>
            {content}
        </GenericSidebar>
    );
};

export default AccountingSidebar;

import React from 'react';

import MLBSettingsView from '@/simDash/pages/MLBSettingsView/MLBSettingsView';

// ---------- Main component ----------

interface SettingsViewProps {
    league: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ league }) => {
    switch (league) {
        case 'MLB':
            return <MLBSettingsView/>;
        default:
            return <div>{league} Settings view coming soon!</div>;
    }
};

export default SettingsView;
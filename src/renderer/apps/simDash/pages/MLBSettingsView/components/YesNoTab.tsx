import { Typography } from "@mui/material";

// ---------- Main component ----------

const YesNoTab: React.FC = () => {
    return (
        <>
            <Typography variant="h6" gutterBottom>
                Yes/No Props Capture Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Configure which yes/no proposition bets to save (Game props, Custom props, etc.)
            </Typography>
        </>
    )
};

export default YesNoTab;
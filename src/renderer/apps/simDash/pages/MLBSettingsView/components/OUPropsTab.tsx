import { Typography } from "@mui/material";

// ---------- Main component ----------

const OUPropsTab: React.FC = () => {
    return (
        <>
            <Typography variant="h6" gutterBottom>
                Over/Under Props Capture Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Configure which over/under prop bets to save (Player props, Team props, etc.)
            </Typography>
        </>
    )
};

export default OUPropsTab;
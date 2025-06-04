import { Typography } from "@mui/material";

// ---------- Main component ----------

const MainMarketsTab: React.FC = () => {
    return (
        <>
            <Typography variant="h6" gutterBottom>
                Main Markets Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Configure which main betting markets to save when running simulations (Moneyline, Spread, Total, etc.)
            </Typography>
        </>
    )
};

export default MainMarketsTab;
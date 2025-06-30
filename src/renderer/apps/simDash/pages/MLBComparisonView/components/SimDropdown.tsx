import { Box, MenuItem, Select, FormControl, InputLabel, Typography } from "@mui/material";
import { SimHistoryEntry } from "@@/types/simHistory";
import { calculateResultsSummaryDisplayMLB, formatBettingBoundsDisplay, isBettingBoundsComplete } from "@/apps/simDash/utils/oddsUtilsMLB";

// ---------- Sub-component ----------

interface SimDropdownProps {
  simHistory: SimHistoryEntry[];
  selectedSim: SimHistoryEntry | null;
  onSelectionChange: (sim: SimHistoryEntry | null) => void;
  label: string;
  awayTeamName: string;
  homeTeamName: string;
}

const SimDropdown: React.FC<SimDropdownProps> = ({ simHistory, selectedSim, onSelectionChange, label, awayTeamName, homeTeamName }) => {

  // ---------- Helper function to get display info for any simulation ----------
  const getDisplayInfo = (simEntry: SimHistoryEntry) => {
    // Always start with simulation results as the base
    const simDisplayInfo = calculateResultsSummaryDisplayMLB(simEntry.simResults, awayTeamName, homeTeamName);
    
    // Try to enhance with betting bounds from the sim entry's input data
    const simBettingBounds = simEntry.inputData?.gameInfo?.bettingBounds;
    
    if (simBettingBounds) {
      const boundsData = {
        awayML: simBettingBounds.awayML.toString(),
        homeML: simBettingBounds.homeML.toString(),
        totalLine: simBettingBounds.over.line.toString(),
        overOdds: simBettingBounds.over.odds.toString(),
        underOdds: simBettingBounds.under.odds.toString()
      };
      
      if (isBettingBoundsComplete(boundsData)) {
        return formatBettingBoundsDisplay(boundsData, awayTeamName, homeTeamName);
      }
    }
    
    // Fall back to simulation results
    return simDisplayInfo;
  };

  const handleSelectionChange = (event: any) => {
    const selectedTimestamp = event.target.value;
    const selected = simHistory.find(sim => sim.timestamp === selectedTimestamp) || null;
    onSelectionChange(selected);
  };

  return (
    <FormControl fullWidth variant="outlined" sx={{ minWidth: 200 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={selectedSim?.timestamp || ''}
        onChange={handleSelectionChange}
        label={label}
        displayEmpty
      >
        <MenuItem value="">
          <em>Select a simulation</em>
        </MenuItem>
        {simHistory.map((sim) => {
          const summary = getDisplayInfo(sim);
          const date = new Date(sim.timestamp).toLocaleString();
          return (
            <MenuItem key={sim.timestamp} value={sim.timestamp}>
              <Box sx={{ py: 0.25 }}>
                <Typography variant="body2" component="div" sx={{ fontSize: '0.875rem', lineHeight: 1.3, mb: 0.5 }}>
                  {date}
                </Typography>
                <Typography 
                  variant="caption" 
                  component="div" 
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
                >
                  {summary.topLine}
                </Typography>
                <Typography 
                  variant="caption" 
                  component="div" 
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
                >
                  {summary.bottomLine}
                </Typography>
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default SimDropdown;

import { Box, MenuItem, Select, FormControl, InputLabel, Typography } from "@mui/material";
import { SimHistoryEntry } from "@@/types/simHistory";
import { calculateResultsSummaryDisplayMLB } from "@/apps/simDash/utils/oddsUtilsMLB";

// ---------- Sub-component ----------

interface SimDropdownProps {
  simHistory: SimHistoryEntry[];
  selectedSim: SimHistoryEntry | null;
  onSelectionChange: (sim: SimHistoryEntry | null) => void;
  label: string;
  awayTeamName: string;
  homeTeamName: string;
};

const SimDropdown: React.FC<SimDropdownProps> = ({ 
  simHistory, 
  selectedSim, 
  onSelectionChange, 
  label, 
  awayTeamName, 
  homeTeamName 
}) => {
  return (
    <FormControl 
      fullWidth 
      variant="outlined" 
      sx={{ 
        minWidth: 210,
        '& .MuiInputBase-root': {
          height: '60px',
        },
        '& .MuiSelect-select': {
          paddingTop: '12px',
          paddingBottom: '12px',
        }
      }}
    >
      <InputLabel sx={{ fontSize: '1rem' }}>{label}</InputLabel>
      <Select
        value={selectedSim?.timestamp || ''}
        label={label}
        onChange={(e) => {
          const timestamp = e.target.value;
          const sim = simHistory.find(s => s.timestamp === timestamp) || null;
          onSelectionChange(sim);
        }}
        sx={{ fontSize: '0.95rem' }}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 300,
              '& .MuiMenuItem-root': {
                padding: '4px 16px',
                minHeight: 'auto',
              }
            }
          }
        }}
      >
        <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          Select a simulation
        </MenuItem>
        {simHistory.map((sim) => {
          const summary = calculateResultsSummaryDisplayMLB(sim.simResults, awayTeamName, homeTeamName);
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

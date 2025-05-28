import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { MlbLiveDataApiLinescoreInning } from "@@/types/mlb/mlb-api";

// ---------- Helper functions ----------

const getInningRuns = (innings: MlbLiveDataApiLinescoreInning[], inningNum: number, isHome: boolean): string => {
  const inning = innings.find(i => i.num === inningNum);
  if (!inning) return '';

  const runs = isHome ? inning.home.runs : inning.away.runs;
  if (runs === undefined) return '';

  return runs.toString();
};

// ---------- Main component ----------

type LinescoreProps = {
  innings: MlbLiveDataApiLinescoreInning[];
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  awayHits?: number;
  homeHits?: number;
  awayErrors?: number;
  homeErrors?: number;
}

const Linescore = ({ 
  innings, 
  awayTeam, 
  homeTeam, 
  awayScore, 
  homeScore,
  awayHits = 0,
  homeHits = 0,
  awayErrors = 0,
  homeErrors = 0
}: LinescoreProps) => {

  // ---------- Variables ----------
  
  const maxInning = Math.max(9, innings.length > 0 ? Math.max(...innings.map(i => i.num)) : 9);
  const inningNumbers = Array.from({ length: maxInning }, (_, i) => i + 1);

  const teams = [
    {
      name: awayTeam,
      isHome: false,
      score: awayScore,
      hits: awayHits,
      errors: awayErrors
    },
    {
      name: homeTeam,
      isHome: true,
      score: homeScore,
      hits: homeHits,
      errors: homeErrors
    }
  ];

  // ---------- Render ----------

  const renderTeamRow = (team: typeof teams[0]) => (
    <TableRow key={team.name}>
      <TableCell sx={{ fontWeight: 'bold', textAlign: 'left' }}>
        {team.name}
      </TableCell>
      {inningNumbers.map(inning => (
        <TableCell key={`${team.name}-${inning}`}>
          {getInningRuns(innings, inning, team.isHome)}
        </TableCell>
      ))}
      <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>
        {team.score}
      </TableCell>
      <TableCell sx={{ backgroundColor: 'action.hover' }}>
        {team.hits}
      </TableCell>
      <TableCell sx={{ backgroundColor: 'action.hover' }}>
        {team.errors}
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Box sx={{ 
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.5)',
          },
        },
      }}>
        <Table size="small" sx={{ 
          border: '1px solid',
          borderColor: 'divider',
          minWidth: 'max-content',
          '& .MuiTableCell-root': {
            border: '1px solid',
            borderColor: 'divider',
            padding: '4px 8px',
            textAlign: 'center',
            minWidth: '32px'
          }
        }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: '60px' }}>Team</TableCell>
              {inningNumbers.map(inning => (
                <TableCell key={inning} sx={{ fontWeight: 'bold' }}>
                  {inning}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>R</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>H</TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'action.hover' }}>E</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map(renderTeamRow)}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

export default Linescore;

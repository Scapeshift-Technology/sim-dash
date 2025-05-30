import React from 'react';
import { Container, Typography, Box, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  People as PeopleIcon, 
  Add as AddIcon,
  Business as BusinessIcon 
} from '@mui/icons-material';

const CounterpartiesMainPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Counterparties
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your business relationships and trading partners
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: 1 }}>
          <Paper elevation={1} sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Typography variant="h6" component="h2">
                View All Counterparties
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
              Browse and manage your existing counterparties, view their details, and track your relationships.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/counterparties')}
              fullWidth
            >
              View Counterparties
            </Button>
          </Paper>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Paper elevation={1} sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AddIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
              <Typography variant="h6" component="h2">
                Add New Counterparty
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
              Register a new counterparty to start tracking your business relationship and transactions.
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/counterparties/new')}
              fullWidth
            >
              Add Counterparty
            </Button>
          </Paper>
        </Box>
      </Box>

      <Box sx={{ mt: 6, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          About Counterparties
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Counterparties are the people and organizations you do business with. This could include 
          trading partners, service providers, clients, or any entity you have financial relationships with.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Keep track of contact information, trading preferences, and transaction history for better 
          relationship management and financial tracking.
        </Typography>
      </Box>
    </Container>
  );
};

export default CounterpartiesMainPage; 
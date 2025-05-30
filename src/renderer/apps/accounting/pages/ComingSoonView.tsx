import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

interface ComingSoonViewProps {
  featureName?: string;
}

const ComingSoonView: React.FC<ComingSoonViewProps> = ({ featureName = 'This feature' }) => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={1} sx={{ p: 6, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <ConstructionIcon sx={{ fontSize: 64, color: 'primary.main' }} />
        </Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {featureName} is currently under development
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          We're working hard to bring you this feature. Stay tuned for updates!
        </Typography>
      </Paper>
    </Container>
  );
};

export default ComingSoonView;
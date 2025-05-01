import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Typography,
  Paper,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FormSubmitButton from '../../components/FormSubmitButton';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';

interface LoginFormData {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    host: 'localhost',
    port: '1433',
    database: '',
    username: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dispatch credentials to Redux store
    dispatch(setCredentials(formData));
    // Navigate to dashboard
    navigate('/home');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            width: '100%'
          }}
        >
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Connect to SQL Server
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                required
                fullWidth
                label="Host"
                name="host"
                value={formData.host}
                onChange={handleChange}
              />

              <TextField
                required
                fullWidth
                label="Port"
                name="port"
                type="number"
                value={formData.port}
                onChange={handleChange}
              />

              <TextField
                required
                fullWidth
                label="Database"
                name="database"
                value={formData.database}
                onChange={handleChange}
              />

              <TextField
                required
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />

              <TextField
                required
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
              />

              <FormSubmitButton text="Connect" />
            </Stack>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage; 
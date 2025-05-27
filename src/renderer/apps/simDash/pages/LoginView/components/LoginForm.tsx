import React from 'react';
import {
    Box,
    TextField,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';

interface LoginFormProps {
    host: string;
    port: string;
    database: string;
    user: string;
    password: string;
    onHostChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPortChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDatabaseChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUserChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onTestConnection: () => void;
    isLoading: boolean;
    testConnectionStatus: string | null;
    error: string | null;
}

const compactFormStyle = {
    mb: 1,
    height: '30px'
};

const LoginForm: React.FC<LoginFormProps> = ({
    host,
    port,
    database,
    user,
    password,
    onHostChange,
    onPortChange,
    onDatabaseChange,
    onUserChange,
    onPasswordChange,
    onSubmit,
    onTestConnection,
    testConnectionStatus,
    isLoading,
    error
}) => {
    const renderTextField = (
        label: string, 
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
        value: string, 
        options?: {
            helperText?: string;
            required?: boolean;
            type?: string;
        }
    ) => {
        return (
            <TextField
                margin="normal"
                size="small"
                required={options?.required ?? true}
                fullWidth
                id={label.toLowerCase().replace(/\s+/g, '-')}
                label={label}
                name={label.toLowerCase()}
                value={value}
                onChange={onChange}
                disabled={isLoading}
                variant="outlined"
                type={options?.type}
                helperText={options?.helperText}
                sx={compactFormStyle}
            />
        );
    };

    return (
        <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1 }}>
            {renderTextField('Host', onHostChange, host)}
            {renderTextField('Port', onPortChange, port, { type: 'number' })}
            {renderTextField('Database', onDatabaseChange, database)}
            {renderTextField('User', onUserChange, user)}
            {renderTextField('Password', onPasswordChange, password, { type: 'password', required: false })}

            <Box sx={{ mt: 2, position: 'relative' }}>
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    id="login-button"
                    disabled={isLoading}
                    sx={{ py: 1.5 }}
                >
                    Connect
                </Button>
                {isLoading && (
                    <CircularProgress
                        size={24}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            marginTop: '-12px',
                            marginLeft: '-12px',
                        }}
                    />
                )}
            </Box>

            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <Button
                    fullWidth
                    variant="outlined"
                    id="test-connection-button"
                    onClick={onTestConnection}
                    disabled={isLoading || testConnectionStatus === 'pending'}
                    sx={{ py: 0.5, fontSize: '0.8rem', width: '50%', height: '30px' }} // Fixed height
                >
                    {testConnectionStatus === 'pending' ? (
                        <CircularProgress size={16} sx={{ color: 'inherit' }} />
                    ) : (
                        'Test Connection'
                    )}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            )}
        </Box>
    );
};

export default LoginForm; 
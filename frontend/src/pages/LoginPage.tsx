import { useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function LoginPage({ onLogin, loading = false, error = null }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onLogin({ email: email.trim(), password });
  };

  return (
    <Box
      component="main"
      sx={{
        alignItems: 'center',
        background: 'linear-gradient(145deg, #eef2ff 0%, #f8fafc 48%, #ecfeff 100%)',
        display: 'flex',
        minHeight: '100vh',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={8} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', px: { xs: 3, sm: 5 }, py: 4 }}>
            <Typography component="p" sx={{ fontWeight: 700, letterSpacing: 1 }} variant="overline">
              Employee Management System
            </Typography>
            <Typography component="h1" sx={{ mt: 0.5 }} variant="h4">
              Welcome back
            </Typography>
            <Typography sx={{ mt: 1, opacity: 0.85 }} variant="body2">
              Sign in to manage your organization.
            </Typography>
          </Box>

          <Stack component="form" onSubmit={handleSubmit} spacing={2.5} sx={{ p: { xs: 3, sm: 5 } }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              autoComplete="email"
              autoFocus
              disabled={loading}
              fullWidth
              label="Email address"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
            <TextField
              autoComplete="current-password"
              disabled={loading}
              fullWidth
              label="Password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            <Button
              disabled={loading}
              size="large"
              startIcon={loading ? <CircularProgress color="inherit" size={18} /> : undefined}
              sx={{ minHeight: 48 }}
              type="submit"
              variant="contained"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;

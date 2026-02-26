import { Box, Button, CircularProgress, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [signing, setSigning] = useState(false);

  const handleSignIn = async () => {
    setSigning(true);
    try {
      await signIn();
    } finally {
      setSigning(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        px: 3,
        background: 'linear-gradient(135deg, #0D1B2A 0%, #1565C0 100%)',
      }}
    >
      {/* Logo / branding */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <AccessTimeIcon sx={{ fontSize: 64, color: '#90CAF9' }} />
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            letterSpacing: 4,
            color: '#fff',
            textTransform: 'uppercase',
          }}
        >
          Pointeuse
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          Suivi du temps conforme à la réglementation CSSF
        </Typography>
      </Box>

      {/* Sign-in button */}
      <Button
        variant="contained"
        size="large"
        startIcon={signing ? <CircularProgress size={18} color="inherit" /> : <GoogleIcon />}
        onClick={handleSignIn}
        disabled={signing}
        sx={{
          bgcolor: '#fff',
          color: '#1a1a1a',
          fontWeight: 700,
          px: 4,
          py: 1.5,
          borderRadius: 3,
          textTransform: 'none',
          fontSize: '1rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          '&:hover': { bgcolor: '#f0f0f0' },
          '&:disabled': { bgcolor: 'rgba(255,255,255,0.5)' },
        }}
      >
        {signing ? 'Connexion…' : 'Se connecter avec Google'}
      </Button>
    </Box>
  );
}

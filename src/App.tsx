import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import theme from './theme';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <Dashboard uid={user.uid} displayName={user.displayName} photoURL={user.photoURL} />;
}

export default function App() {
  return (
    <CssVarsProvider theme={theme} defaultMode="dark">
      <CssBaseline />
      <AppContent />
    </CssVarsProvider>
  );
}

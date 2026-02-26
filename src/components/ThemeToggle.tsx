import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useColorScheme } from '@mui/material/styles';

export default function ThemeToggle() {
  const { mode, setMode } = useColorScheme();

  const toggle = () => setMode(mode === 'dark' ? 'light' : 'dark');

  return (
    <Tooltip title={mode === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}>
      <IconButton size="small" onClick={toggle} aria-label="toggle theme">
        {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}

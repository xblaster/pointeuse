import { useCallback, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  Alert,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import LogoutIcon from '@mui/icons-material/Logout';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ThemeToggle from './ThemeToggle';
import EditSessionModal from './EditSessionModal';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useTimeTracker } from '../hooks/useTimeTracker';
import { useAuth } from '../hooks/useAuth';
import { formatDuration, formatDate, formatTime } from '../utils/timeUtils';
import { SessionEntry } from '../types';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

// ─── Variants Framer Motion ───────────────────────────────────────────────────

const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getComplianceColor(status: string): 'success' | 'warning' | 'error' {
  if (status === 'violation') return 'error';
  if (status === 'warning') return 'warning';
  return 'success';
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DashboardProps {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

type ModalState =
  | { open: false }
  | { open: true; mode: 'create'; defaultDate: string }
  | { open: true; mode: 'edit'; entry: SessionEntry & { index: number } };

export default function Dashboard({ uid, displayName, photoURL }: DashboardProps) {
  const {
    loading,
    status,
    totalMilliseconds,
    weeklyMilliseconds,
    complianceStatus,
    complianceMessages,
    currentSessionStart,
    history,
    nextResetDate,
    clockIn,
    clockOut,
    updateEntry,
    addEntry,
    deleteEntry,
  } = useTimeTracker(uid);

  const { signOut } = useAuth();

  const [modalState, setModalState] = useState<ModalState>({ open: false });

  const isIN = status === 'IN';
  const today = new Date().toISOString().split('T')[0];
  const sessionStart = currentSessionStart ? new Date(currentSessionStart) : null;

  // Grouper l'historique par date, ordre décroissant
  const groupedHistory = history
    .reduce<Record<string, { entries: Array<SessionEntry & { index: number }>; total: number }>>(
      (acc, entry, index) => {
        if (!acc[entry.date]) acc[entry.date] = { entries: [], total: 0 };
        acc[entry.date].entries.push({ ...entry, index });
        acc[entry.date].total += entry.duration;
        return acc;
      },
      {}
    );
  const sortedDates = Object.keys(groupedHistory).sort((a, b) => b.localeCompare(a));

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  // Couleur dynamique du timer selon compliance
  const timerColorMap: Record<string, string> = {
    violation: 'error.main',
    warning: 'warning.main',
    normal: 'primary.main',
  };
  const timerColor = timerColorMap[complianceStatus] ?? 'primary.main';

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 480,
          px: { xs: 2, sm: 3 },
          py: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <LayoutGroup>
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <MotionBox
            layout
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AccessTimeIcon sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase' }}
              >
                Pointeuse
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={isIN ? 'EN SERVICE' : 'HORS SERVICE'}
                size="small"
                color={isIN ? 'success' : 'default'}
                variant={isIN ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, letterSpacing: 1, fontSize: 10 }}
              />
              <ThemeToggle />
              <Tooltip title={`Déconnexion de ${displayName ?? 'compte'}`}>
                <IconButton size="small" onClick={handleSignOut} sx={{ ml: 0.5 }}>
                  {photoURL ? (
                    <Avatar src={photoURL} sx={{ width: 28, height: 28 }} />
                  ) : (
                    <LogoutIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </MotionBox>

          {/* ── Compliance alerts ──────────────────────────────────────────── */}
          <AnimatePresence>
            {complianceMessages.length > 0 && (
              <MotionBox key="compliance-alert" {...slideDown}>
                <Alert
                  severity={getComplianceColor(complianceStatus)}
                  variant="filled"
                  sx={{ borderRadius: 2 }}
                >
                  {complianceMessages.join(' ')}
                </Alert>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* ── Timer principal ────────────────────────────────────────────── */}
          <MotionCard layout elevation={4} sx={{ borderRadius: 4, textAlign: 'center' }}>
            <CardContent sx={{ py: 4 }}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
                CUMUL MENSUEL
              </Typography>
              {/* layoutId partagé pour la hero animation */}
              <motion.div layoutId="timer-display">
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: 2,
                    color: timerColor,
                    my: 1,
                    fontSize: { xs: '2.8rem', sm: '3.5rem' },
                  }}
                >
                  {loading ? '--:--:--' : formatDuration(totalMilliseconds)}
                </Typography>
              </motion.div>
              <Typography variant="body2" color="text.secondary">
                heures travaillées ce mois
              </Typography>
            </CardContent>
          </MotionCard>

          {/* ── Cumul hebdo ────────────────────────────────────────────────── */}
          <MotionCard layout variant="outlined">
            <CardContent
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '12px !important' }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
                  CUMUL HEBDO (CSSF 48H)
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatDuration(weeklyMilliseconds)}
                  <Typography component="span" variant="body2" color="text.secondary">
                    {' '}/ 48:00:00
                  </Typography>
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
                  RESET
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {nextResetDate ? formatDate(new Date(nextResetDate)) : '-'}
                </Typography>
              </Box>
            </CardContent>
          </MotionCard>

          {/* ── Session en cours ───────────────────────────────────────────── */}
          <AnimatePresence>
            {isIN && sessionStart && (
              <MotionBox key="session-card" {...slideDown}>
                <Card
                  variant="outlined"
                  sx={{
                    borderColor: 'success.main',
                    bgcolor: 'success.50',
                  }}
                >
                  <CardContent
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '12px !important' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Session démarrée à
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="success.main">
                      {formatTime(sessionStart)}
                    </Typography>
                  </CardContent>
                </Card>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* ── Boutons ENTRÉE / SORTIE ────────────────────────────────────── */}
          <MotionBox
            layout
            sx={{ display: 'flex', gap: 2 }}
          >
            <Button
              fullWidth
              variant={isIN ? 'outlined' : 'contained'}
              color="success"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={clockIn}
              disabled={isIN || loading}
              sx={{ py: 2, fontSize: '1rem' }}
            >
              ENTRÉE
            </Button>
            <Button
              fullWidth
              variant={!isIN ? 'outlined' : 'contained'}
              color="error"
              size="large"
              startIcon={<StopIcon />}
              onClick={clockOut}
              disabled={!isIN || loading}
              sx={{ py: 2, fontSize: '1rem' }}
            >
              SORTIE
            </Button>
          </MotionBox>

          {/* ── Historique du mois ─────────────────────────────────────────── */}
          <AnimatePresence>
            {sortedDates.length > 0 && (
              <MotionBox key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ letterSpacing: 2, display: 'block', mb: 1 }}
                >
                  HISTORIQUE DU MOIS
                </Typography>

                {sortedDates.map((date) => {
                  const { entries, total } = groupedHistory[date];
                  const label = date === today ? "Aujourd'hui" : formatDate(new Date(date));
                  return (
                    <Box key={date} sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, display: 'block', mb: 0.5 }}>
                        {label.toUpperCase()}
                      </Typography>
                      <Card variant="outlined">
                        <CardContent sx={{ p: '0 !important' }}>
                          <motion.div variants={staggerContainer} initial="initial" animate="animate">
                            {entries.map((entry, i) => (
                              <motion.div key={entry.index} variants={staggerItem}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    px: 2,
                                    py: 1.5,
                                  }}
                                >
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                      {formatTime(new Date(entry.start))} → {formatTime(new Date(entry.end))}
                                    </Typography>
                                    {entry.lunchDeducted && (
                                      <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                                        Pause réglementaire déduite ({Math.round((entry.rawDuration - entry.duration) / 60000)} min)
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body1" fontWeight={700} color="primary.main">
                                      {formatDuration(entry.duration)}
                                    </Typography>
                                    <Tooltip title="Modifier">
                                      <IconButton
                                        size="small"
                                        onClick={() => setModalState({ open: true, mode: 'edit', entry })}
                                      >
                                        <EditIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Supprimer">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => {
                                          if (window.confirm('Supprimer cette session ?')) {
                                            void deleteEntry(entry.index);
                                          }
                                        }}
                                      >
                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                                {i < entries.length - 1 && <Divider />}
                              </motion.div>
                            ))}
                          </motion.div>
                        </CardContent>
                      </Card>
                      {entries.length > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75, px: 0.5 }}>
                          <Typography variant="body2" fontWeight={600} color="text.secondary">
                            Total
                          </Typography>
                          <Typography variant="body1" fontWeight={800}>
                            {formatDuration(total)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  fullWidth
                  onClick={() => setModalState({ open: true, mode: 'create', defaultDate: today })}
                  sx={{ mt: 1 }}
                >
                  Ajouter une session
                </Button>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Bouton ajout si historique vide */}
          {sortedDates.length === 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              fullWidth
              onClick={() => setModalState({ open: true, mode: 'create', defaultDate: today })}
            >
              Ajouter une session
            </Button>
          )}

          {/* Spacer bas */}
          <Box sx={{ height: 32 } } />

          {/* ── Modal édition / création ──────────────────────────────────── */}
          <EditSessionModal
            open={modalState.open}
            mode={modalState.open ? modalState.mode : 'create'}
            entry={modalState.open && modalState.mode === 'edit' ? modalState.entry : undefined}
            defaultDate={modalState.open && modalState.mode === 'create' ? modalState.defaultDate : undefined}
            onClose={() => setModalState({ open: false })}
            onSubmit={({ date, start, end }) => {
              if (modalState.open && modalState.mode === 'edit') {
                void updateEntry(modalState.entry.index, start, end);
              } else {
                void addEntry(date, start, end);
              }
            }}
          />
        </LayoutGroup>
      </Box>
    </Box>
  );
}

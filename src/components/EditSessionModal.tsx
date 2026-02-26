import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
} from '@mui/material';
import { SessionEntry } from '../types';

interface SubmitPayload {
  date: string;
  start: string;
  end: string;
}

interface EditSessionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: SubmitPayload) => void;
  mode: 'edit' | 'create';
  entry?: SessionEntry & { index: number };
  defaultDate?: string;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function toTimeInput(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function EditSessionModal({
  open,
  onClose,
  onSubmit,
  mode,
  entry,
  defaultDate,
}: EditSessionModalProps) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && entry) {
      setDate(entry.date);
      setStartTime(toTimeInput(entry.start));
      setEndTime(toTimeInput(entry.end));
    } else {
      setDate(defaultDate ?? todayStr());
      setStartTime('');
      setEndTime('');
    }
  }, [open, mode, entry, defaultDate]);

  const today = todayStr();
  const dateError = date > today ? 'La date ne peut pas être dans le futur.' : '';
  const timeError =
    startTime && endTime && endTime <= startTime
      ? "L'heure de fin doit être après l'heure de début."
      : '';
  const isValid = date && startTime && endTime && !dateError && !timeError;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      date,
      start: `${date}T${startTime}:00`,
      end: `${date}T${endTime}:00`,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {mode === 'edit' ? 'Modifier la session' : 'Ajouter une session'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            inputProps={{ max: today }}
            error={!!dateError}
            helperText={dateError}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Heure de début"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Heure de fin"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            error={!!timeError}
            helperText={timeError}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          {isValid && (
            <Typography variant="caption" color="text.secondary">
              Durée brute :{' '}
              {(() => {
                const diffMin =
                  (new Date(`${date}T${endTime}:00`).getTime() -
                    new Date(`${date}T${startTime}:00`).getTime()) /
                  60000;
                const h = Math.floor(diffMin / 60);
                const m = Math.round(diffMin % 60);
                return `${h}h${String(m).padStart(2, '0')}`;
              })()}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Annuler
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isValid}>
          {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

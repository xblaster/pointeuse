import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrackerState, SessionEntry } from '../types';
import { getNextMonthlyResetDate } from '../utils/timeUtils';
import { getLunchDeductionMs } from '../utils/lunchDeduction';

const STORAGE_KEY = '@pointeuse_state';

// ---------------------------------------------------------------------------
// État initial (premier lancement, aucune donnée persistée)
// ---------------------------------------------------------------------------
function buildInitialState(): TrackerState {
  return {
    status: 'OUT',
    currentSessionStart: null,
    accumulatedMilliseconds: 0,
    nextResetDate: getNextMonthlyResetDate().toISOString(),
    history: [],
  };
}

// ---------------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------------
export function useTimeTracker() {
  const [state, setState] = useState<TrackerState | null>(null);
  const [loading, setLoading] = useState(true);
  /**
   * elapsed : millisecondes écoulées depuis le début de la session en cours.
   * Mis à jour toutes les secondes via un interval.
   * Basé sur des timestamps (Date.now() - currentSessionStart) pour rester
   * exact même si l'app passe en arrière-plan ou est redémarrée.
   */
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -------------------------------------------------------------------------
  // Chargement initial depuis AsyncStorage
  // -------------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        let loaded: TrackerState = raw
          ? (JSON.parse(raw) as TrackerState)
          : buildInitialState();

        /**
         * VÉRIFICATION DU RESET MENSUEL
         *
         * À chaque démarrage de l'app, on compare Date.now() à nextResetDate.
         * Si la date de reset est dépassée :
         *   - Le cumul (accumulatedMilliseconds) est remis à zéro.
         *   - L'historique du mois est effacé.
         *   - La prochaine date de reset est recalculée (1er du mois suivant).
         *
         * Ce mécanisme garantit le reset même si l'app n'était pas ouverte
         * exactement au moment du basculement de mois.
         */
        if (Date.now() >= new Date(loaded.nextResetDate).getTime()) {
          loaded = {
            ...loaded,
            accumulatedMilliseconds: 0,
            history: [],
            // Si on a raté plusieurs mois, on recalcule à partir d'aujourd'hui
            nextResetDate: getNextMonthlyResetDate().toISOString(),
          };
          // Persiste immédiatement le reset
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
        }

        setState(loaded);
      } catch (err) {
        console.error('[Pointeuse] Erreur chargement AsyncStorage :', err);
        setState(buildInitialState());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // -------------------------------------------------------------------------
  // Minuterie temps réel (ticker basé sur timestamps, pas sur un compteur)
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Nettoyage de l'interval précédent dans tous les cas
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (state?.status !== 'IN' || !state.currentSessionStart) {
      setElapsed(0);
      return;
    }

    // On capture le timestamp de début une seule fois pour ce cycle
    const startMs = new Date(state.currentSessionStart).getTime();

    const tick = () => setElapsed(Date.now() - startMs);
    tick(); // Premier tick immédiat (pas d'affichage à 0 pendant 1 seconde)

    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state?.status, state?.currentSessionStart]);

  // -------------------------------------------------------------------------
  // Persistance AsyncStorage
  // -------------------------------------------------------------------------
  const persist = useCallback(async (newState: TrackerState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (err) {
      console.error('[Pointeuse] Erreur persistance AsyncStorage :', err);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Action : ENTRÉE (clock IN)
  // -------------------------------------------------------------------------
  const clockIn = useCallback(async () => {
    if (!state || state.status === 'IN') return;

    const newState: TrackerState = {
      ...state,
      status: 'IN',
      currentSessionStart: new Date().toISOString(),
    };

    setState(newState);
    await persist(newState);
  }, [state, persist]);

  // -------------------------------------------------------------------------
  // Action : SORTIE (clock OUT)
  // -------------------------------------------------------------------------
  const clockOut = useCallback(async () => {
    if (!state || state.status === 'OUT' || !state.currentSessionStart) return;

    const now = new Date();
    const sessionStart = new Date(state.currentSessionStart);
    const rawDurationMs = now.getTime() - sessionStart.getTime();

    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const todayHistory = state.history.filter((h) => h.date === today);

    /**
     * APPLICATION DE LA DÉDUCTION PAUSE MIDI
     *
     * La déduction est appliquée si et seulement si :
     *   1. Elle n'a pas déjà été appliquée aujourd'hui (pour éviter un double
     *      prélèvement sur une journée avec plusieurs sessions).
     *   2. L'heure actuelle est >= 12h30 (la fenêtre de midi est supposément
     *      passée ; on ne déduit pas si l'employé part avant midi).
     *
     * Le montant déduit est variable : si la pause P est < 30 min, on retire
     * exactement (30 - P) minutes, de façon à "compléter" la pause à 30 min.
     * Exemples :
     *   P = 0 min  → déduction = 30 min
     *   P = 20 min → déduction = 10 min
     *   P = 30 min → déduction = 0 min (aucun prélèvement)
     */
    const alreadyDeductedToday = todayHistory.some((h) => h.lunchDeducted);
    const isAfterNoonWindow =
      now.getHours() > 12 ||
      (now.getHours() === 12 && now.getMinutes() >= 30);

    let effectiveDurationMs = rawDurationMs;
    let lunchDeducted = false;

    if (!alreadyDeductedToday && isAfterNoonWindow) {
      const deductionMs = getLunchDeductionMs(todayHistory, sessionStart, now);
      if (deductionMs > 0) {
        // minimum 0 ms pour éviter un temps effectif négatif
        effectiveDurationMs = Math.max(0, rawDurationMs - deductionMs);
        lunchDeducted = true;
      }
    }

    const newEntry: SessionEntry = {
      start: sessionStart.toISOString(),
      end: now.toISOString(),
      rawDuration: rawDurationMs,
      duration: effectiveDurationMs,
      date: today,
      lunchDeducted,
    };

    const newState: TrackerState = {
      ...state,
      status: 'OUT',
      currentSessionStart: null,
      accumulatedMilliseconds: state.accumulatedMilliseconds + effectiveDurationMs,
      history: [...state.history, newEntry],
    };

    setState(newState);
    await persist(newState);
  }, [state, persist]);

  // -------------------------------------------------------------------------
  // Valeurs exposées
  // -------------------------------------------------------------------------

  /**
   * Temps total à afficher = cumul enregistré + temps de la session en cours.
   * Quand status === 'OUT', elapsed vaut 0, donc le cumul s'affiche seul.
   */
  const totalMilliseconds = (state?.accumulatedMilliseconds ?? 0) + elapsed;

  return {
    loading,
    status: state?.status ?? 'OUT',
    totalMilliseconds,
    currentSessionStart: state?.currentSessionStart ?? null,
    history: state?.history ?? [],
    nextResetDate: state?.nextResetDate ?? null,
    clockIn,
    clockOut,
  };
}

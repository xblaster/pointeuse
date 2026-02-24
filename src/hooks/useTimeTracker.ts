import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrackerState, SessionEntry } from '../types';
import { getNextMonthlyResetDate } from '../utils/timeUtils';

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
/**
 * LOGIQUE DE DÉDUCTION DE LA PAUSE MIDI
 *
 * Règle métier : si l'employé n'a pas pris au moins 30 minutes de pause
 * dans la fenêtre de midi (11h30 – 13h30), on déduit automatiquement
 * 30 minutes du temps de travail effectif lors du pointage de sortie.
 *
 * Algorithme :
 *  1. On reconstitue la liste ordonnée de toutes les sessions du jour
 *     (historique déjà enregistré + session en cours qui se termine).
 *  2. On calcule les intervalles (pauses) entre deux sessions consécutives.
 *  3. Une pause est "adéquate" si elle intersecte la fenêtre de midi
 *     ET dure au moins 30 minutes.
 *  4. Si aucune pause adéquate n'est trouvée → renvoie false → déduction.
 *
 * @param todayHistory  Sessions déjà terminées aujourd'hui.
 * @param currentStart  Début de la session en cours d'arrêt.
 * @param currentEnd    Moment du clic sur "SORTIE".
 * @returns true si une pause midi suffisante a été prise, false sinon.
 */
function hasAdequateLunchBreak(
  todayHistory: SessionEntry[],
  currentStart: Date,
  currentEnd: Date,
): boolean {
  // Toutes les sessions du jour, triées par heure de début
  const allSessions = [
    ...todayHistory.map((h) => ({
      start: new Date(h.start),
      end: new Date(h.end),
    })),
    { start: currentStart, end: currentEnd },
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  // Fenêtre de midi : 11h30 → 13h30 (même journée que currentEnd)
  const y = currentEnd.getFullYear();
  const m = currentEnd.getMonth();
  const d = currentEnd.getDate();
  const noonWindowStart = new Date(y, m, d, 11, 30, 0, 0);
  const noonWindowEnd = new Date(y, m, d, 13, 30, 0, 0);

  // Analyse des pauses entre sessions consécutives
  for (let i = 0; i < allSessions.length - 1; i++) {
    const pauseStart = allSessions[i].end;
    const pauseEnd = allSessions[i + 1].start;
    const pauseMs = pauseEnd.getTime() - pauseStart.getTime();

    // La pause chevauche-t-elle la fenêtre de midi ?
    const overlapsNoon =
      pauseStart < noonWindowEnd && pauseEnd > noonWindowStart;

    if (overlapsNoon && pauseMs >= 30 * 60 * 1000) {
      return true; // Pause midi suffisante trouvée
    }
  }

  return false; // Aucune pause midi adéquate
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
     * La déduction de 30 minutes est appliquée si et seulement si :
     *   1. Elle n'a pas déjà été appliquée aujourd'hui (pour éviter un double
     *      prélèvement sur une journée avec plusieurs sessions).
     *   2. L'heure actuelle est >= 12h30 (la fenêtre de midi est supposément
     *      passée ; on ne déduit pas si l'employé part avant midi).
     *   3. Aucune pause d'au moins 30 min n'a été détectée dans la fenêtre
     *      11h30–13h30 (cf. fonction hasAdequateLunchBreak).
     *
     * La déduction s'applique sur la session courante (la dernière de la
     * journée, celle qui déclenche ce clockOut).
     */
    const alreadyDeductedToday = todayHistory.some((h) => h.lunchDeducted);
    const isAfterNoonWindow =
      now.getHours() > 12 ||
      (now.getHours() === 12 && now.getMinutes() >= 30);
    const lunchAdequate = hasAdequateLunchBreak(todayHistory, sessionStart, now);

    let effectiveDurationMs = rawDurationMs;
    let lunchDeducted = false;

    if (!alreadyDeductedToday && isAfterNoonWindow && !lunchAdequate) {
      // Déduction de 30 minutes (minimum 0 ms pour éviter un temps négatif)
      effectiveDurationMs = Math.max(0, rawDurationMs - 30 * 60 * 1000);
      lunchDeducted = true;
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

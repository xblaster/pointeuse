import { SessionEntry } from '../types';

const THIRTY_MIN_MS = 30 * 60 * 1000;

/**
 * LOGIQUE DE DÉDUCTION DE LA PAUSE MIDI
 *
 * Règle métier précise : si la meilleure pause prise dans la fenêtre de midi
 * (11h30 – 13h30) vaut P minutes, on déduit (30 - P) minutes du temps de
 * travail effectif, de façon à ce que la pause atteigne toujours 30 minutes.
 * Si aucune pause n'est trouvée dans cette fenêtre, P = 0 → déduction = 30 min.
 * Si P >= 30 min → déduction = 0 (aucun prélèvement).
 *
 * Algorithme :
 *  1. On reconstitue la liste ordonnée de toutes les sessions du jour
 *     (historique déjà enregistré + session en cours qui se termine).
 *  2. On calcule les intervalles (pauses) entre deux sessions consécutives.
 *  3. On retient la plus longue pause qui chevauche la fenêtre de midi :
 *     c'est la "meilleure pause" P de l'employé.
 *  4. On retourne max(0, 30min - P) en millisecondes.
 *
 * @param todayHistory  Sessions déjà terminées aujourd'hui.
 * @param currentStart  Début de la session en cours d'arrêt.
 * @param currentEnd    Moment du clic sur "SORTIE".
 * @returns Millisecondes à déduire du temps travaillé (0 si pause suffisante).
 */
export function getLunchDeductionMs(
  todayHistory: Pick<SessionEntry, 'start' | 'end'>[],
  currentStart: Date,
  currentEnd: Date,
): number {
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
  const mo = currentEnd.getMonth();
  const d = currentEnd.getDate();
  const noonWindowStart = new Date(y, mo, d, 11, 30, 0, 0);
  const noonWindowEnd = new Date(y, mo, d, 13, 30, 0, 0);

  // Recherche de la meilleure pause (la plus longue) dans la fenêtre de midi
  let bestPauseMs = 0;
  let foundPauseInNoon = false;

  for (let i = 0; i < allSessions.length - 1; i++) {
    const pauseStart = allSessions[i].end;
    const pauseEnd = allSessions[i + 1].start;
    const pauseMs = pauseEnd.getTime() - pauseStart.getTime();

    // La pause chevauche-t-elle la fenêtre de midi ?
    const overlapsNoon =
      pauseStart < noonWindowEnd && pauseEnd > noonWindowStart;

    if (overlapsNoon) {
      foundPauseInNoon = true;
      if (pauseMs > bestPauseMs) bestPauseMs = pauseMs;
    }
  }

  // Aucune pause dans la fenêtre → P = 0 → déduction = 30 min
  if (!foundPauseInNoon) return THIRTY_MIN_MS;

  // Pause suffisante → aucune déduction
  if (bestPauseMs >= THIRTY_MIN_MS) return 0;

  // Déduction = (30 min - P) pour compléter la pause au minimum légal
  return THIRTY_MIN_MS - bestPauseMs;
}

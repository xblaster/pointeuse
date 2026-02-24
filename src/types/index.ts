/**
 * Représente une session de travail terminée (entre un IN et un OUT).
 */
export interface SessionEntry {
  /** Timestamp ISO de début de session */
  start: string;
  /** Timestamp ISO de fin de session */
  end: string;
  /** Durée brute de la session en millisecondes (avant toute déduction) */
  rawDuration: number;
  /** Durée effective en millisecondes (après déduction éventuelle de la pause) */
  duration: number;
  /** Date de la session au format YYYY-MM-DD */
  date: string;
  /** Indique si la déduction de 30 minutes a été appliquée sur cette session */
  lunchDeducted: boolean;
}

/**
 * État global de la pointeuse, persisté dans AsyncStorage.
 */
export interface TrackerState {
  /** Statut courant : "IN" si l'employé est présent, "OUT" s'il est parti */
  status: 'IN' | 'OUT';
  /**
   * Timestamp ISO du début de la session en cours.
   * Vaut null quand status === 'OUT'.
   */
  currentSessionStart: string | null;
  /** Cumul total de millisecondes travaillées depuis le dernier reset mensuel */
  accumulatedMilliseconds: number;
  /** Date ISO du prochain reset mensuel (1er du mois suivant à 00:00:00) */
  nextResetDate: string;
  /** Historique de toutes les sessions terminées du mois en cours */
  history: SessionEntry[];
}

import { formatDuration, getNextMonthlyResetDate } from '../utils/timeUtils';

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------
describe('formatDuration', () => {
  it('retourne 00:00:00 pour 0 ms', () => {
    expect(formatDuration(0)).toBe('00:00:00');
  });

  it('retourne 00:00:00 pour une valeur négative (clampage)', () => {
    expect(formatDuration(-5000)).toBe('00:00:00');
  });

  it('formate les secondes seules', () => {
    expect(formatDuration(1000)).toBe('00:00:01');
    expect(formatDuration(59_000)).toBe('00:00:59');
  });

  it('formate les minutes seules', () => {
    expect(formatDuration(60_000)).toBe('00:01:00');
    expect(formatDuration(10 * 60_000)).toBe('00:10:00');
  });

  it('formate les heures seules', () => {
    expect(formatDuration(3_600_000)).toBe('01:00:00');
    expect(formatDuration(10 * 3_600_000)).toBe('10:00:00');
  });

  it('formate un cas mixte HH:MM:SS', () => {
    // 1h + 1min + 1s = 3661 s = 3 661 000 ms
    expect(formatDuration(3_661_000)).toBe('01:01:01');
  });

  it('utilise des zéros de remplissage pour chaque segment', () => {
    // 2h 5min 3s
    expect(formatDuration(2 * 3_600_000 + 5 * 60_000 + 3_000)).toBe('02:05:03');
  });

  it('gère correctement les grandes valeurs (> 24h)', () => {
    // 25h = 90 000 s
    expect(formatDuration(25 * 3_600_000)).toBe('25:00:00');
  });

  it('tronque les millisecondes (pas d\'arrondi)', () => {
    // 1 seconde moins 1 ms → toujours 00:00:00
    expect(formatDuration(999)).toBe('00:00:00');
    // 1 seconde exacte
    expect(formatDuration(1000)).toBe('00:00:01');
  });
});

// ---------------------------------------------------------------------------
// getNextMonthlyResetDate
// ---------------------------------------------------------------------------
describe('getNextMonthlyResetDate', () => {
  it('retourne le 1er du mois suivant', () => {
    const result = getNextMonthlyResetDate();
    expect(result.getDate()).toBe(1);
  });

  it('retourne une date à minuit pile (00:00:00.000)', () => {
    const result = getNextMonthlyResetDate();
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('retourne bien le mois suivant (pas le mois courant)', () => {
    const now = new Date();
    const result = getNextMonthlyResetDate();
    const expectedMonth = (now.getMonth() + 1) % 12;
    expect(result.getMonth()).toBe(expectedMonth);
  });

  it('incrémente l\'année si on est en décembre', () => {
    // On ne peut pas facilement mocker Date sans librairie ;
    // on vérifie simplement la cohérence année/mois
    const now = new Date();
    const result = getNextMonthlyResetDate();
    if (now.getMonth() === 11) {
      expect(result.getFullYear()).toBe(now.getFullYear() + 1);
      expect(result.getMonth()).toBe(0); // janvier
    } else {
      expect(result.getFullYear()).toBe(now.getFullYear());
    }
  });
});

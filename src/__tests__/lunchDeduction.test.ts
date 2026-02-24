import { getLunchDeductionMs } from '../utils/lunchDeduction';
import { SessionEntry } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MIN = 60_000; // 1 minute en millisecondes
const YEAR = 2026;
const MONTH = 1; // février (0-indexé)
const DAY = 24;

/** Crée une Date locale pour le jour de test. */
function d(hour: number, min: number, sec = 0): Date {
  return new Date(YEAR, MONTH, DAY, hour, min, sec, 0);
}

/** Crée une SessionEntry minimale (seuls start/end sont utilisés par la fonction). */
function entry(
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number,
): Pick<SessionEntry, 'start' | 'end'> {
  return {
    start: d(startHour, startMin).toISOString(),
    end: d(endHour, endMin).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Cas : session continue sur la journée (aucune pause)
// ---------------------------------------------------------------------------
describe('Aucune pause prise dans la journée', () => {
  it('session continue 08h00 → 17h00 : déduction = 30 min', () => {
    expect(
      getLunchDeductionMs([], d(8, 0), d(17, 0)),
    ).toBe(30 * MIN);
  });

  it('session continue démarrant après 11h30 (11h45 → 13h30) : déduction = 30 min', () => {
    // Aucun gap → foundPauseInNoon = false
    expect(
      getLunchDeductionMs([], d(11, 45), d(13, 30)),
    ).toBe(30 * MIN);
  });
});

// ---------------------------------------------------------------------------
// Cas : pause exactement égale à 30 min
// ---------------------------------------------------------------------------
describe('Pause exactement 30 minutes', () => {
  it('IN 08h00 → OUT 12h00 puis IN 12h30 → OUT 17h00 : déduction = 0', () => {
    const history = [entry(8, 0, 12, 0)];
    expect(
      getLunchDeductionMs(history, d(12, 30), d(17, 0)),
    ).toBe(0);
  });

  it('pause démarrant à 11h30 (fenêtre exacte) : déduction = 0', () => {
    const history = [entry(8, 0, 11, 30)];
    expect(
      getLunchDeductionMs(history, d(12, 0), d(17, 0)),
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Cas : pause supérieure à 30 min
// ---------------------------------------------------------------------------
describe('Pause supérieure à 30 minutes', () => {
  it('pause de 60 min (12h00 → 13h00) : déduction = 0', () => {
    const history = [entry(8, 0, 12, 0)];
    expect(
      getLunchDeductionMs(history, d(13, 0), d(17, 0)),
    ).toBe(0);
  });

  it('pause de 45 min (12h15 → 13h00) : déduction = 0', () => {
    const history = [entry(8, 0, 12, 15)];
    expect(
      getLunchDeductionMs(history, d(13, 0), d(17, 0)),
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Cas : pause insuffisante (P < 30 min) → déduction = 30 - P
// ---------------------------------------------------------------------------
describe('Pause insuffisante — déduction proportionnelle (30 - P)', () => {
  it('pause de 20 min (12h00 → 12h20) : déduction = 10 min', () => {
    const history = [entry(8, 0, 12, 0)];
    expect(
      getLunchDeductionMs(history, d(12, 20), d(17, 0)),
    ).toBe(10 * MIN);
  });

  it('pause de 25 min (12h00 → 12h25) : déduction = 5 min', () => {
    const history = [entry(8, 0, 12, 0)];
    expect(
      getLunchDeductionMs(history, d(12, 25), d(17, 0)),
    ).toBe(5 * MIN);
  });

  it('pause de 5 min (12h00 → 12h05) : déduction = 25 min', () => {
    const history = [entry(8, 0, 12, 0)];
    expect(
      getLunchDeductionMs(history, d(12, 5), d(17, 0)),
    ).toBe(25 * MIN);
  });

  it('pause de 29 min (12h00 → 12h29) : déduction = 1 min', () => {
    const history = [entry(8, 0, 12, 0)];
    expect(
      getLunchDeductionMs(history, d(12, 29), d(17, 0)),
    ).toBe(1 * MIN);
  });

  it('pause de 1 min (12h00 → 12h01) : déduction = 29 min', () => {
    const history = [entry(8, 0, 12, 0)];
    expect(
      getLunchDeductionMs(history, d(12, 1), d(17, 0)),
    ).toBe(29 * MIN);
  });
});

// ---------------------------------------------------------------------------
// Cas : pause hors fenêtre de midi (11h30–13h30)
// ---------------------------------------------------------------------------
describe('Pause hors fenêtre de midi', () => {
  it('pause matinale 09h00 → 09h30 (hors fenêtre) : déduction = 30 min', () => {
    const history = [entry(8, 0, 9, 0)];
    // Pause 09h00→09h30 : ne chevauche pas 11h30→13h30
    expect(
      getLunchDeductionMs(history, d(9, 30), d(17, 0)),
    ).toBe(30 * MIN);
  });

  it('pause à 14h00 → 14h30 (après fenêtre) : déduction = 30 min', () => {
    const history = [entry(8, 0, 14, 0)];
    // Pause 14h00→14h30 : ne chevauche pas 11h30→13h30
    expect(
      getLunchDeductionMs(history, d(14, 30), d(17, 0)),
    ).toBe(30 * MIN);
  });

  it('pause terminant à 11h29 (juste avant la fenêtre) : déduction = 30 min', () => {
    const history = [entry(8, 0, 11, 0)];
    // Pause 11h00→11h29 : pauseEnd (11h29) <= noonWindowStart (11h30)
    expect(
      getLunchDeductionMs(history, d(11, 29), d(17, 0)),
    ).toBe(30 * MIN);
  });
});

// ---------------------------------------------------------------------------
// Cas : pause chevauchant partiellement la fenêtre
// ---------------------------------------------------------------------------
describe('Pause chevauchant partiellement la fenêtre de midi', () => {
  it('pause 11h00 → 11h45 (débute avant 11h30, se termine dans la fenêtre) : déduction = 0', () => {
    // 45 min de pause, dont une partie dans la fenêtre → bestPauseMs = 45 min ≥ 30 min
    const history = [entry(8, 0, 11, 0)];
    expect(
      getLunchDeductionMs(history, d(11, 45), d(17, 0)),
    ).toBe(0);
  });

  it('pause 11h00 → 11h35 : chevauchement 5 min dans la fenêtre, mais pause brute = 35 min → déduction = 0', () => {
    // La fonction mesure la durée totale de la pause, pas seulement le chevauchement
    const history = [entry(8, 0, 11, 0)];
    expect(
      getLunchDeductionMs(history, d(11, 35), d(17, 0)),
    ).toBe(0);
  });

  it('pause 13h20 → 13h40 (se termine après 13h30) : pause brute = 20 min → déduction = 10 min', () => {
    const history = [entry(8, 0, 13, 20)];
    expect(
      getLunchDeductionMs(history, d(13, 40), d(17, 0)),
    ).toBe(10 * MIN);
  });
});

// ---------------------------------------------------------------------------
// Cas : plusieurs sessions dans la journée (meilleure pause retenue)
// ---------------------------------------------------------------------------
describe('Plusieurs sessions — meilleure pause retenue', () => {
  it('deux pauses dans la fenêtre : la plus longue est retenue', () => {
    // Sessions : 08h00→12h00, 12h25→12h30, 12h35→17h00
    // Pauses : 12h00→12h25 (25 min) et 12h30→12h35 (5 min)
    // Meilleure = 25 min → déduction = 5 min
    const history = [entry(8, 0, 12, 0), entry(12, 25, 12, 30)];
    expect(
      getLunchDeductionMs(history, d(12, 35), d(17, 0)),
    ).toBe(5 * MIN);
  });

  it('une pause suffisante et une insuffisante : la suffisante annule la déduction', () => {
    // Sessions : 08h00→11h45, 12h15→12h30, 13h00→17h00
    // Pauses : 11h45→12h15 (30 min, fenêtre: oui), 12h30→13h00 (30 min, fenêtre: oui)
    // Meilleures = 30 min → déduction = 0
    const history = [entry(8, 0, 11, 45), entry(12, 15, 12, 30)];
    expect(
      getLunchDeductionMs(history, d(13, 0), d(17, 0)),
    ).toBe(0);
  });

  it('trois courtes pauses dont la meilleure est 20 min : déduction = 10 min', () => {
    // Sessions : 08h00→12h00, 12h10→12h20, 12h30→12h40, 12h50→17h00
    // Pauses : 12h00→12h10 (10 min), 12h20→12h30 (10 min), 12h40→12h50 (10 min)
    // Hmm toutes sont 10 min → meilleure = 10 min → déduction = 20 min
    const history = [
      entry(8, 0, 12, 0),
      entry(12, 10, 12, 20),
      entry(12, 30, 12, 40),
    ];
    expect(
      getLunchDeductionMs(history, d(12, 50), d(17, 0)),
    ).toBe(20 * MIN);
  });

  it('pause hors fenêtre + pause dans la fenêtre : seule celle dans la fenêtre compte', () => {
    // Sessions : 08h00→09h00 (pause 09h00→09h45 = hors fenêtre), 09h45→12h00 (pause 12h00→12h20 = 20 min dans fenêtre), 12h20→17h00
    const history = [entry(8, 0, 9, 0), entry(9, 45, 12, 0)];
    expect(
      getLunchDeductionMs(history, d(12, 20), d(17, 0)),
    ).toBe(10 * MIN); // 30 - 20 = 10 min
  });
});

// ---------------------------------------------------------------------------
// Cas limites
// ---------------------------------------------------------------------------
describe('Cas limites', () => {
  it('session très courte débutant à 12h00 et finissant à 12h01 (dans la fenêtre) : déduction = 30 min', () => {
    // Aucune pause (session unique) → foundPauseInNoon = false
    expect(
      getLunchDeductionMs([], d(12, 0), d(12, 1)),
    ).toBe(30 * MIN);
  });

  it('aucune session dans l\'historique et session actuelle hors fenêtre (07h00→11h00) : déduction = 30 min', () => {
    // La fenêtre va de 11h30 à 13h30 ; cette session n'est pas dans la fenêtre
    // foundPauseInNoon = false → 30 min
    expect(
      getLunchDeductionMs([], d(7, 0), d(11, 0)),
    ).toBe(30 * MIN);
  });

  it('pause = 0 ms (OUT et IN au même instant) : déduction = 30 min', () => {
    const history = [entry(8, 0, 12, 0)];
    // currentStart = 12h00 aussi → gap = 0
    expect(
      getLunchDeductionMs(history, d(12, 0), d(17, 0)),
    ).toBe(30 * MIN);
  });
});

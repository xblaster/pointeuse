import { computeTimelineSegments, COLOR_GREEN, COLOR_RED } from '../hooks/useTimelineSegments';
import { SessionEntry } from '../types';

const YEAR = 2026;
const MONTH = 1; // February (0-indexed)
const DAY = 25;

function d(hour: number, min: number, sec = 0): Date {
  return new Date(YEAR, MONTH, DAY, hour, min, sec, 0);
}

function entry(startH: number, startM: number, endH: number, endM: number): SessionEntry {
  const start = d(startH, startM);
  const end = d(endH, endM);
  const duration = end.getTime() - start.getTime();
  return { start: start.toISOString(), end: end.toISOString(), rawDuration: duration, duration, date: start.toISOString().split('T')[0], lunchDeducted: false };
}

function entryWithDeduction(startH: number, startM: number, endH: number, endM: number, deductionMin: number): SessionEntry {
  const start = d(startH, startM);
  const end = d(endH, endM);
  const rawDuration = end.getTime() - start.getTime();
  const duration = rawDuration - deductionMin * 60_000;
  return { start: start.toISOString(), end: end.toISOString(), rawDuration, duration, date: start.toISOString().split('T')[0], lunchDeducted: true };
}

describe('computeTimelineSegments', () => {

  // ── RG-01 ────────────────────────────────────────────────────────────

  describe('RG-01: pre-07:00 coloring', () => {
    it('colors a session entirely before 07:00 as red', () => {
      const segs = computeTimelineSegments([entry(6, 30, 6, 50)], null, 'OUT');
      expect(segs).toHaveLength(1);
      expect(segs[0].color).toBe(COLOR_RED);
    });

    it('splits a session straddling 07:00 into red + green', () => {
      const segs = computeTimelineSegments([entry(6, 30, 8, 0)], null, 'OUT');
      expect(segs).toHaveLength(2);
      expect(segs.find(s => s.color === COLOR_RED)).toBeDefined();
      expect(segs.find(s => s.color === COLOR_GREEN)).toBeDefined();
      // Red portion ends at 07:00 (60 min from 06:00)
      expect(segs.find(s => s.color === COLOR_RED)!.endMin).toBe(60);
    });

    it('colors a session fully after 07:00 as green', () => {
      const segs = computeTimelineSegments([entry(8, 0, 12, 0)], null, 'OUT');
      expect(segs).toHaveLength(1);
      expect(segs[0].color).toBe(COLOR_GREEN);
    });
  });

  // ── RG-02 ────────────────────────────────────────────────────────────

  describe('RG-02: deducted portion coloring', () => {
    it('preceding session stays green when break was short', () => {
      // Session 1 is valid — the deduction appears on session 2, not session 1
      const history = [
        entry(8, 0, 11, 0),                        // session 1 — no deduction
        entryWithDeduction(11, 20, 13, 0, 10),     // session 2 — 10 min deducted
      ];
      const segs = computeTimelineSegments(history, null, 'OUT');
      const session1Segs = segs.filter(s => s.id.startsWith('0'));
      expect(session1Segs.every(s => s.color === COLOR_GREEN)).toBe(true);
    });

    it('colors only the deducted minutes at the start of the session with the deduction', () => {
      const deductionMin = 23;
      const history = [
        entry(7, 37, 12, 3),                            // session 1 — no deduction
        entryWithDeduction(12, 10, 16, 0, deductionMin), // session 2 — 23 min deducted
      ];
      const segs = computeTimelineSegments(history, null, 'OUT');

      // Session 2: first 23 min red, rest green
      const s2Red = segs.find(s => s.id === '1-ded');
      const s2Green = segs.find(s => s.id === '1');
      expect(s2Red).toBeDefined();
      expect(s2Red!.color).toBe(COLOR_RED);
      // Width of red portion ≈ deductionMin (within 1 min tolerance for seconds rounding)
      expect(s2Red!.endMin - s2Red!.startMin).toBeCloseTo(deductionMin, 0);
      expect(s2Green).toBeDefined();
      expect(s2Green!.color).toBe(COLOR_GREEN);
    });

    it('session with no deduction is entirely green (after 07:00)', () => {
      const segs = computeTimelineSegments([entry(9, 0, 12, 0)], null, 'OUT');
      expect(segs).toHaveLength(1);
      expect(segs[0].color).toBe(COLOR_GREEN);
    });

    it('entire session is red when deduction covers full duration', () => {
      const history = [entryWithDeduction(9, 0, 9, 15, 15)]; // 15 min session, 15 min deducted
      const segs = computeTimelineSegments(history, null, 'OUT');
      expect(segs.every(s => s.color === COLOR_RED)).toBe(true);
    });
  });

  // ── RG-04: active session ─────────────────────────────────────────────

  describe('RG-04: active session', () => {
    it('produces a green active segment with isActive=true after 07:00', () => {
      const now = d(10, 0);
      const segs = computeTimelineSegments([], d(9, 0).toISOString(), 'IN', now);
      const active = segs.find(s => s.id === 'active');
      expect(active).toBeDefined();
      expect(active!.color).toBe(COLOR_GREEN);
      expect(active!.isActive).toBe(true);
    });

    it('splits active session straddling 07:00 into red + green', () => {
      const now = d(8, 0);
      const segs = computeTimelineSegments([], d(6, 30).toISOString(), 'IN', now);
      expect(segs.find(s => s.id === 'active-pre')?.color).toBe(COLOR_RED);
      expect(segs.find(s => s.id === 'active')?.color).toBe(COLOR_GREEN);
      expect(segs.find(s => s.id === 'active')?.isActive).toBe(true);
    });

    it('active session before 07:00 is entirely red, no isActive', () => {
      const now = d(6, 50);
      const segs = computeTimelineSegments([], d(6, 30).toISOString(), 'IN', now);
      expect(segs).toHaveLength(1);
      expect(segs[0].color).toBe(COLOR_RED);
      expect(segs[0].isActive).toBe(false);
    });

    it('no active segment when status is OUT', () => {
      const segs = computeTimelineSegments([], d(9, 0).toISOString(), 'OUT', d(10, 0));
      expect(segs.find(s => s.id === 'active')).toBeUndefined();
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns empty array for no sessions and status OUT', () => {
      expect(computeTimelineSegments([], null, 'OUT')).toHaveLength(0);
    });

    it('ignores sessions with zero duration', () => {
      const s = d(9, 0);
      const bad: SessionEntry = { start: s.toISOString(), end: s.toISOString(), rawDuration: 0, duration: 0, date: s.toISOString().split('T')[0], lunchDeducted: false };
      expect(computeTimelineSegments([bad], null, 'OUT')).toHaveLength(0);
    });
  });
});

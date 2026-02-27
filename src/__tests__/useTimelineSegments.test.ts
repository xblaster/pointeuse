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
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    rawDuration: duration,
    duration,
    date: start.toISOString().split('T')[0],
    lunchDeducted: false,
  };
}

describe('computeTimelineSegments', () => {
  // ── RG-01 ────────────────────────────────────────────────────────────

  describe('RG-01: pre-07:00 coloring', () => {
    it('colors a session entirely before 07:00 as red', () => {
      const history = [entry(6, 30, 6, 50)];
      const segs = computeTimelineSegments(history, null, 'OUT');
      expect(segs).toHaveLength(1);
      expect(segs[0].color).toBe(COLOR_RED);
    });

    it('splits a session straddling 07:00 into red + green', () => {
      const history = [entry(6, 30, 8, 0)];
      const segs = computeTimelineSegments(history, null, 'OUT');
      expect(segs).toHaveLength(2);
      const red = segs.find((s) => s.color === COLOR_RED);
      const green = segs.find((s) => s.color === COLOR_GREEN);
      expect(red).toBeDefined();
      expect(green).toBeDefined();
      // Red portion ends at 07:00 (60 min from 06:00)
      expect(red!.endMin).toBe(60);
      // Green portion starts at 07:00
      expect(green!.startMin).toBe(60);
    });

    it('colors a session fully after 07:00 as green (RG-03)', () => {
      const history = [entry(8, 0, 12, 0)];
      const segs = computeTimelineSegments(history, null, 'OUT');
      expect(segs).toHaveLength(1);
      expect(segs[0].color).toBe(COLOR_GREEN);
    });
  });

  // ── RG-02 ────────────────────────────────────────────────────────────

  describe('RG-02: insufficient break coloring', () => {
    it('recolors the preceding session red when break < 30 min', () => {
      const history = [
        entry(8, 0, 11, 0),  // ends 11:00
        entry(11, 20, 13, 0), // starts 11:20 — only 20 min gap
      ];
      const segs = computeTimelineSegments(history, null, 'OUT');
      // First session should be recolored to red
      const firstSeg = segs.find((s) => s.id === '0');
      expect(firstSeg?.color).toBe(COLOR_RED);
    });

    it('does NOT recolor when break is exactly 30 min', () => {
      const history = [
        entry(8, 0, 11, 0),  // ends 11:00
        entry(11, 30, 13, 0), // starts 11:30 — exactly 30 min gap
      ];
      const segs = computeTimelineSegments(history, null, 'OUT');
      const firstSeg = segs.find((s) => s.id === '0');
      expect(firstSeg?.color).toBe(COLOR_GREEN);
    });

    it('does NOT recolor when break is > 30 min', () => {
      const history = [
        entry(8, 0, 11, 0),  // ends 11:00
        entry(11, 45, 14, 0), // starts 11:45 — 45 min gap
      ];
      const segs = computeTimelineSegments(history, null, 'OUT');
      const firstSeg = segs.find((s) => s.id === '0');
      expect(firstSeg?.color).toBe(COLOR_GREEN);
    });
  });

  // ── RG-04: active session ─────────────────────────────────────────────

  describe('RG-04: active session', () => {
    it('produces a green active segment with isActive=true after 07:00', () => {
      const now = d(10, 0);
      const segs = computeTimelineSegments([], d(9, 0).toISOString(), 'IN', now);
      const active = segs.find((s) => s.id === 'active');
      expect(active).toBeDefined();
      expect(active!.color).toBe(COLOR_GREEN);
      expect(active!.isActive).toBe(true);
    });

    it('splits active session straddling 07:00 into red + green with isActive on green', () => {
      const now = d(8, 0);
      const segs = computeTimelineSegments([], d(6, 30).toISOString(), 'IN', now);
      const activeRed = segs.find((s) => s.id === 'active-a');
      const activeGreen = segs.find((s) => s.id === 'active');
      expect(activeRed?.color).toBe(COLOR_RED);
      expect(activeRed?.isActive).toBe(false);
      expect(activeGreen?.color).toBe(COLOR_GREEN);
      expect(activeGreen?.isActive).toBe(true);
    });

    it('active session starting before 07:00 and still before 07:00 is entirely red', () => {
      const now = d(6, 50); // still before 07:00
      const segs = computeTimelineSegments([], d(6, 30).toISOString(), 'IN', now);
      expect(segs).toHaveLength(1);
      expect(segs[0].color).toBe(COLOR_RED);
      expect(segs[0].isActive).toBe(false);
    });

    it('no active segment when status is OUT', () => {
      const now = d(10, 0);
      const segs = computeTimelineSegments([], d(9, 0).toISOString(), 'OUT', now);
      expect(segs.find((s) => s.id === 'active')).toBeUndefined();
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns empty array for no sessions and status OUT', () => {
      const segs = computeTimelineSegments([], null, 'OUT');
      expect(segs).toHaveLength(0);
    });

    it('ignores sessions with zero or negative duration', () => {
      const s = d(9, 0);
      const bad: SessionEntry = {
        start: s.toISOString(),
        end: s.toISOString(), // same start/end
        rawDuration: 0,
        duration: 0,
        date: s.toISOString().split('T')[0],
        lunchDeducted: false,
      };
      const segs = computeTimelineSegments([bad], null, 'OUT');
      expect(segs).toHaveLength(0);
    });
  });
});

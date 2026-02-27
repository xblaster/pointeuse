import type { SessionEntry } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────

/** Timeline starts at 06:00 */
const TIMELINE_START_H = 6;
/** Timeline ends at 20:00 */
const TIMELINE_END_H = 20;
/** Total minutes represented on the timeline (06:00–20:00 = 840 min) */
export const TIMELINE_TOTAL_MIN = (TIMELINE_END_H - TIMELINE_START_H) * 60;
/** Minutes from timeline start to 07:00 (RG-01 threshold) */
const SEVEN_AM_MIN = (7 - TIMELINE_START_H) * 60; // 60

export const COLOR_GREEN = '#4ADE80';
export const COLOR_RED = '#F87171';

// ── Types ─────────────────────────────────────────────────────────────────

export interface TimelineSegment {
  /** Unique key for React rendering */
  id: string;
  /** Start position in minutes from 06:00 */
  startMin: number;
  /** End position in minutes from 06:00 */
  endMin: number;
  /** Hex color for this segment */
  color: string;
  /** True only for the currently active (clocked-in) segment that is valid */
  isActive: boolean;
  /** ISO timestamp of the segment's logical start (for label display) */
  startISO: string;
  /** ISO timestamp of the segment's logical end (for label display) */
  endISO: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Convert an ISO timestamp to minutes from TIMELINE_START_H (06:00). */
function isoToMin(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60 - TIMELINE_START_H * 60;
}

/** Convert a Date to minutes from TIMELINE_START_H (06:00). */
function dateToMin(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60 - TIMELINE_START_H * 60;
}

// ── Pure computation (exported for unit tests) ────────────────────────────

/**
 * Compute timeline segments from session history and current session state.
 * Rules applied:
 *  RG-01: portion before 07:00 → red
 *  RG-02: gap between consecutive sessions < 30 min → preceding segment red
 *  RG-03: portion ≥ 07:00 with no RG-02 violation → green
 *  RG-04: active session (no end time, status IN) → green + isActive flag
 *
 * @param history   Completed sessions for the day/period
 * @param currentSessionStart  ISO start of the active session, or null
 * @param status    'IN' if currently clocked in, 'OUT' otherwise
 * @param now       Current time (defaults to new Date() — injectable for tests)
 */
export function computeTimelineSegments(
  history: SessionEntry[],
  currentSessionStart: string | null,
  status: 'IN' | 'OUT',
  now: Date = new Date()
): TimelineSegment[] {
  const segments: TimelineSegment[] = [];

  // Sort completed sessions chronologically
  const sorted = [...history].sort((a, b) => a.start.localeCompare(b.start));

  // ── Build completed-session segments ──────────────────────────────────

  for (let i = 0; i < sorted.length; i++) {
    const session = sorted[i];
    const rawStart = clamp(isoToMin(session.start), 0, TIMELINE_TOTAL_MIN);
    const rawEnd = clamp(isoToMin(session.end), 0, TIMELINE_TOTAL_MIN);

    if (rawEnd <= rawStart) continue;

    if (rawStart < SEVEN_AM_MIN) {
      // RG-01: this session (or part of it) starts before 07:00
      const splitEnd = Math.min(rawEnd, SEVEN_AM_MIN);

      // Red portion (entirely before 07:00)
      segments.push({
        id: `${i}-a`,
        startMin: rawStart,
        endMin: splitEnd,
        color: COLOR_RED,
        isActive: false,
        startISO: session.start,
        endISO: session.end,
      });

      // Green portion (from 07:00 onward) — subject to RG-02 below
      if (rawEnd > SEVEN_AM_MIN) {
        segments.push({
          id: `${i}-b`,
          startMin: SEVEN_AM_MIN,
          endMin: rawEnd,
          color: COLOR_GREEN,
          isActive: false,
          startISO: session.start,
          endISO: session.end,
        });
      }
    } else {
      // RG-03: session fully after 07:00 → green (subject to RG-02)
      segments.push({
        id: `${i}`,
        startMin: rawStart,
        endMin: rawEnd,
        color: COLOR_GREEN,
        isActive: false,
        startISO: session.start,
        endISO: session.end,
      });
    }
  }

  // ── RG-02: recolor preceding segment if break < 30 min ───────────────

  for (let i = 0; i < sorted.length - 1; i++) {
    const gapMs =
      new Date(sorted[i + 1].start).getTime() - new Date(sorted[i].end).getTime();
    if (gapMs > 0 && gapMs < 30 * 60 * 1000) {
      // Recolor all segments that belong to session i
      for (const seg of segments) {
        if (seg.id === `${i}` || seg.id === `${i}-a` || seg.id === `${i}-b`) {
          seg.color = COLOR_RED;
        }
      }
    }
  }

  // ── RG-04: active session ─────────────────────────────────────────────

  if (status === 'IN' && currentSessionStart) {
    const activeStartMin = clamp(isoToMin(currentSessionStart), 0, TIMELINE_TOTAL_MIN);
    const activeEndMin = clamp(dateToMin(now), activeStartMin, TIMELINE_TOTAL_MIN);

    // Check if resumption break from last completed session is < 30 min (RG-02)
    let isRG02Violation = false;
    if (sorted.length > 0) {
      const lastEnd = sorted[sorted.length - 1].end;
      const gapMs =
        new Date(currentSessionStart).getTime() - new Date(lastEnd).getTime();
      if (gapMs > 0 && gapMs < 30 * 60 * 1000) {
        isRG02Violation = true;
        // Also recolor the last completed session
        const li = sorted.length - 1;
        for (const seg of segments) {
          if (seg.id === `${li}` || seg.id === `${li}-a` || seg.id === `${li}-b`) {
            seg.color = COLOR_RED;
          }
        }
      }
    }

    if (activeStartMin < SEVEN_AM_MIN) {
      // RG-01 split on active session
      const splitEnd = Math.min(activeEndMin, SEVEN_AM_MIN);
      segments.push({
        id: 'active-a',
        startMin: activeStartMin,
        endMin: splitEnd,
        color: COLOR_RED,
        isActive: false,
        startISO: currentSessionStart,
        endISO: now.toISOString(),
      });
      if (activeEndMin > SEVEN_AM_MIN) {
        segments.push({
          id: 'active',
          startMin: SEVEN_AM_MIN,
          endMin: activeEndMin,
          color: isRG02Violation ? COLOR_RED : COLOR_GREEN,
          isActive: !isRG02Violation,
          startISO: currentSessionStart,
          endISO: now.toISOString(),
        });
      }
    } else {
      // Entirely after 07:00
      segments.push({
        id: 'active',
        startMin: activeStartMin,
        endMin: activeEndMin,
        color: isRG02Violation ? COLOR_RED : COLOR_GREEN,
        isActive: !isRG02Violation,
        startISO: currentSessionStart,
        endISO: now.toISOString(),
      });
    }
  }

  return segments;
}

// ── Hook ──────────────────────────────────────────────────────────────────

/**
 * React hook wrapping computeTimelineSegments.
 * No memoization needed — the Dashboard re-renders every second via
 * useTimeTracker's totalMilliseconds timer, so segments stay current.
 */
export function useTimelineSegments(
  history: SessionEntry[],
  currentSessionStart: string | null,
  status: 'IN' | 'OUT'
): TimelineSegment[] {
  return computeTimelineSegments(history, currentSessionStart, status);
}

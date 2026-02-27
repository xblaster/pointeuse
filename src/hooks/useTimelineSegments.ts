import type { SessionEntry } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────

const TIMELINE_START_H = 6;
const TIMELINE_END_H = 20;
export const TIMELINE_TOTAL_MIN = (TIMELINE_END_H - TIMELINE_START_H) * 60;
const SEVEN_AM_MIN = (7 - TIMELINE_START_H) * 60; // 60 min

export const COLOR_GREEN = '#4ADE80';
export const COLOR_RED = '#F87171';

// ── Types ─────────────────────────────────────────────────────────────────

export interface TimelineSegment {
  id: string;
  startMin: number;
  endMin: number;
  color: string;
  isActive: boolean;
  startISO: string;
  endISO: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function isoToMin(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60 - TIMELINE_START_H * 60;
}

function dateToMin(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60 - TIMELINE_START_H * 60;
}

/**
 * Emit up to 3 sub-segments for one completed session, applying:
 *  - RG-01 : portion before 07:00 → red
 *  - RG-02 : deducted minutes (lunchDeducted) at the START of the session → red
 *  - RG-03 : remaining portion ≥ 07:00 → green
 *
 * The deduction is read directly from `session.rawDuration - session.duration`
 * (the authoritative value stored at clock-out time), NOT re-derived from gap width.
 */
function pushSessionSegments(
  out: TimelineSegment[],
  session: SessionEntry,
  i: number,
  sMin: number,
  eMin: number,
): void {
  // Deduction in minutes: the portion at the start of this session that was not counted.
  const dedMin = session.lunchDeducted
    ? Math.max(0, (session.rawDuration - session.duration) / 60_000)
    : 0;

  // We split the session into up to three colour zones:
  //   Zone PRE  [sMin        … min(eMin, 7AM)]          always RED  (RG-01)
  //   Zone DED  [7AM … 7AM + remaining_ded]             RED  (RG-02, deduction overflow past 7AM)
  //   Zone OK   [rest until eMin]                        GREEN (RG-03)
  //
  // Special case: session entirely after 07:00 — no Zone PRE.

  if (sMin < SEVEN_AM_MIN) {
    // ── Zone PRE : before 07:00 ──────────────────────────────────────────
    const preEnd = Math.min(eMin, SEVEN_AM_MIN);
    out.push({ id: `${i}-pre`, startMin: sMin, endMin: preEnd, color: COLOR_RED, isActive: false, startISO: session.start, endISO: session.end });

    if (eMin <= SEVEN_AM_MIN) return; // session ends before 07:00 — done

    // ── Post 07:00 portion ───────────────────────────────────────────────
    // How much deduction was already "consumed" by Zone PRE?
    const preDuration = preEnd - sMin;
    const remainingDed = Math.max(0, dedMin - preDuration);

    const postStart = SEVEN_AM_MIN;
    if (remainingDed > 0) {
      const dedEnd = Math.min(eMin, postStart + remainingDed);
      out.push({ id: `${i}-ded`, startMin: postStart, endMin: dedEnd, color: COLOR_RED, isActive: false, startISO: session.start, endISO: session.end });
      if (dedEnd < eMin) {
        out.push({ id: `${i}-ok`, startMin: dedEnd, endMin: eMin, color: COLOR_GREEN, isActive: false, startISO: session.start, endISO: session.end });
      }
    } else {
      out.push({ id: `${i}-ok`, startMin: postStart, endMin: eMin, color: COLOR_GREEN, isActive: false, startISO: session.start, endISO: session.end });
    }
  } else {
    // ── Session entirely after 07:00 ────────────────────────────────────
    if (dedMin > 0) {
      const dedEnd = Math.min(eMin, sMin + dedMin);
      out.push({ id: `${i}-ded`, startMin: sMin, endMin: dedEnd, color: COLOR_RED, isActive: false, startISO: session.start, endISO: session.end });
      if (dedEnd < eMin) {
        out.push({ id: `${i}`, startMin: dedEnd, endMin: eMin, color: COLOR_GREEN, isActive: false, startISO: session.start, endISO: session.end });
      }
    } else {
      out.push({ id: `${i}`, startMin: sMin, endMin: eMin, color: COLOR_GREEN, isActive: false, startISO: session.start, endISO: session.end });
    }
  }
}

// ── Pure computation (exported for unit tests) ────────────────────────────

/**
 * Compute timeline segments from session history and current session state.
 *
 *  RG-01 : portion before 07:00 → red
 *  RG-02 : deducted portion (lunchDeducted, at session start) → red
 *  RG-03 : remainder ≥ 07:00, not deducted → green
 *  RG-04 : active session → green + isActive flag (particles)
 */
export function computeTimelineSegments(
  history: SessionEntry[],
  currentSessionStart: string | null,
  status: 'IN' | 'OUT',
  now: Date = new Date(),
): TimelineSegment[] {
  const segments: TimelineSegment[] = [];
  const sorted = [...history].sort((a, b) => a.start.localeCompare(b.start));

  // ── Completed sessions ────────────────────────────────────────────────

  for (let i = 0; i < sorted.length; i++) {
    const session = sorted[i];
    const sMin = clamp(isoToMin(session.start), 0, TIMELINE_TOTAL_MIN);
    const eMin = clamp(isoToMin(session.end), 0, TIMELINE_TOTAL_MIN);
    if (eMin <= sMin) continue;
    pushSessionSegments(segments, session, i, sMin, eMin);
  }

  // ── Active session (RG-04) ────────────────────────────────────────────

  if (status === 'IN' && currentSessionStart) {
    const activeStartMin = clamp(isoToMin(currentSessionStart), 0, TIMELINE_TOTAL_MIN);
    const activeEndMin = clamp(dateToMin(now), activeStartMin, TIMELINE_TOTAL_MIN);

    if (activeStartMin < SEVEN_AM_MIN) {
      const splitEnd = Math.min(activeEndMin, SEVEN_AM_MIN);
      segments.push({ id: 'active-pre', startMin: activeStartMin, endMin: splitEnd, color: COLOR_RED, isActive: false, startISO: currentSessionStart, endISO: now.toISOString() });
      if (activeEndMin > SEVEN_AM_MIN) {
        segments.push({ id: 'active', startMin: SEVEN_AM_MIN, endMin: activeEndMin, color: COLOR_GREEN, isActive: true, startISO: currentSessionStart, endISO: now.toISOString() });
      }
    } else {
      segments.push({ id: 'active', startMin: activeStartMin, endMin: activeEndMin, color: COLOR_GREEN, isActive: true, startISO: currentSessionStart, endISO: now.toISOString() });
    }
  }

  return segments;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useTimelineSegments(
  history: SessionEntry[],
  currentSessionStart: string | null,
  status: 'IN' | 'OUT',
): TimelineSegment[] {
  return computeTimelineSegments(history, currentSessionStart, status);
}

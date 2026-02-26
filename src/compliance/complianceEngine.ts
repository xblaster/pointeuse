import { SessionEntry, ComplianceStatus } from '../types';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const FIVE_HOURS_45_MIN_MS = 5.75 * 60 * 60 * 1000;
const TEN_HOURS_MS = 10 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const THIRTY_MIN_MS = 30 * 60 * 1000;

export interface ComplianceInfo {
  continuousWorkMs: number;
  dailyTotalMs: number;
  weeklyTotalMs: number;
  status: ComplianceStatus;
  messages: string[];
}

/**
 * Compliance Engine for CSSF Labor Law.
 */
export const ComplianceEngine = {
  /**
   * Calculates the continuous work duration since the last 30-minute break.
   */
  getContinuousWorkDuration(
    todayHistory: Pick<SessionEntry, 'start' | 'end'>[],
    currentSessionStart: Date | null,
    now: Date = new Date()
  ): number {
    const allSessions = [
      ...todayHistory.map((h) => ({
        start: new Date(h.start),
        end: new Date(h.end),
      })),
    ].sort((a, b) => a.start.getTime() - b.start.getTime());

    if (currentSessionStart) {
      allSessions.push({ start: currentSessionStart, end: now });
    }

    if (allSessions.length === 0) return 0;

    let continuousStart = allSessions[0].start.getTime();
    
    for (let i = 0; i < allSessions.length - 1; i++) {
      const pauseStart = allSessions[i].end.getTime();
      const pauseEnd = allSessions[i + 1].start.getTime();
      const pauseDuration = pauseEnd - pauseStart;

      // If break is less than 30 minutes, it doesn't reset continuous work
      if (pauseDuration >= THIRTY_MIN_MS) {
        continuousStart = allSessions[i + 1].start.getTime();
      }
    }

    const lastSessionEnd = allSessions[allSessions.length - 1].end.getTime();
    return lastSessionEnd - continuousStart;
  },

  /**
   * Calculates daily total work duration.
   */
  getDailyTotal(
    todayHistory: Pick<SessionEntry, 'duration'>[],
    currentSessionStart: Date | null,
    now: Date = new Date()
  ): number {
    const historicalTotal = todayHistory.reduce((sum, s) => sum + s.duration, 0);
    const currentTotal = currentSessionStart ? now.getTime() - currentSessionStart.getTime() : 0;
    return historicalTotal + currentTotal;
  },

  /**
   * Calculates weekly total work duration (since Monday 00:00).
   */
  getWeeklyTotal(
    history: Pick<SessionEntry, 'start' | 'duration'>[],
    currentSessionStart: Date | null,
    now: Date = new Date()
  ): number {
    // Find Monday of current week
    const monday = new Date(now);
    const day = monday.getDay(); // 0 is Sunday
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const weeklyHistory = history.filter(s => new Date(s.start) >= monday);
    const historicalTotal = weeklyHistory.reduce((sum, s) => sum + s.duration, 0);
    const currentTotal = currentSessionStart ? now.getTime() - currentSessionStart.getTime() : 0;
    
    return historicalTotal + currentTotal;
  },

  /**
   * Evaluates the overall compliance status and returns detailed info.
   */
  checkCompliance(
    history: SessionEntry[],
    currentSessionStart: string | null,
    now: Date = new Date()
  ): ComplianceInfo {
    const todayStr = now.toISOString().split('T')[0];
    const todayHistory = history.filter(s => s.date === todayStr);
    const currentStart = currentSessionStart ? new Date(currentSessionStart) : null;

    const continuousWorkMs = this.getContinuousWorkDuration(todayHistory, currentStart, now);
    const dailyTotalMs = this.getDailyTotal(todayHistory, currentStart, now);
    const weeklyTotalMs = this.getWeeklyTotal(history, currentStart, now);

    let status: ComplianceStatus = 'normal';
    const messages: string[] = [];

    // 6-hour rule
    if (continuousWorkMs >= SIX_HOURS_MS) {
      status = 'violation';
      messages.push('Continuous work exceeds 6 hours without a 30-minute break.');
    } else if (continuousWorkMs >= FIVE_HOURS_45_MIN_MS) {
      status = 'warning';
      messages.push('Approaching 6 hours of continuous work. Take a 30-minute break soon.');
    }

    // Daily limit
    if (dailyTotalMs >= TEN_HOURS_MS) {
      status = 'violation';
      messages.push('Daily work limit (10h) reached.');
    }

    // Weekly limit
    if (weeklyTotalMs >= FORTY_EIGHT_HOURS_MS) {
      status = 'violation';
      messages.push('Weekly work limit (48h) reached.');
    }

    return {
      continuousWorkMs,
      dailyTotalMs,
      weeklyTotalMs,
      status,
      messages
    };
  },

  /**
   * Calculates mandatory deductions based on compliance violations.
   * Deduction = 30min − total short breaks already taken (breaks < 30min).
   * Example: 5min break taken → deduction = 25min.
   */
  getMandatoryDeductions(
    todayHistory: SessionEntry[],
    currentStart: Date,
    currentEnd: Date
  ): { deductionMs: number; reason: string } {
    const continuousWork = this.getContinuousWorkDuration(todayHistory, currentStart, currentEnd);

    if (continuousWork > SIX_HOURS_MS) {
      // Reconstruct all sessions in chronological order to find short breaks
      const allSessions = [
        ...todayHistory.map((h) => ({ start: new Date(h.start), end: new Date(h.end) })),
        { start: currentStart, end: currentEnd },
      ].sort((a, b) => a.start.getTime() - b.start.getTime());

      // Sum breaks < 30min (they didn't reset continuous work, but count toward the required pause)
      let shortBreaksMs = 0;
      for (let i = 0; i < allSessions.length - 1; i++) {
        const gap = allSessions[i + 1].start.getTime() - allSessions[i].end.getTime();
        if (gap > 0 && gap < THIRTY_MIN_MS) {
          shortBreaksMs += gap;
        }
      }

      const deductionMs = Math.max(0, THIRTY_MIN_MS - shortBreaksMs);
      return {
        deductionMs,
        reason: '6-hour rule violation (mandatory 30min break deduction)',
      };
    }

    return { deductionMs: 0, reason: '' };
  }
};

import { ComplianceEngine } from '../compliance/complianceEngine';
import { SessionEntry } from '../types';

const MIN = 60_000;
const HOUR = 60 * MIN;

const YEAR = 2026;
const MONTH = 1; // February
const DAY = 25; // Wednesday

function d(hour: number, min: number, sec = 0): Date {
  return new Date(YEAR, MONTH, DAY, hour, min, sec, 0);
}

function entry(
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number,
): SessionEntry {
  const start = d(startHour, startMin);
  const end = d(endHour, endMin);
  const duration = end.getTime() - start.getTime();
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    rawDuration: duration,
    duration: duration,
    date: start.toISOString().split('T')[0],
    lunchDeducted: false,
  };
}

describe('ComplianceEngine - Continuous Work (6h Rule)', () => {
  it('calculates continuous work correctly with no breaks', () => {
    const history: SessionEntry[] = [];
    const currentStart = d(8, 0);
    const now = d(12, 0);
    const duration = ComplianceEngine.getContinuousWorkDuration(history, currentStart, now);
    expect(duration).toBe(4 * HOUR);
  });

  it('resets continuous work after a 30-minute break', () => {
    const history = [entry(8, 0, 12, 0)];
    const currentStart = d(12, 30);
    const now = d(14, 0);
    const duration = ComplianceEngine.getContinuousWorkDuration(history, currentStart, now);
    expect(duration).toBe(1.5 * HOUR);
  });

  it('does NOT reset continuous work after a 20-minute break', () => {
    const history = [entry(8, 0, 12, 0)];
    const currentStart = d(12, 20);
    const now = d(14, 0);
    const duration = ComplianceEngine.getContinuousWorkDuration(history, currentStart, now);
    expect(duration).toBe(6 * HOUR);
  });

  it('handles multiple short breaks', () => {
    const history = [
      entry(8, 0, 10, 0), // 2h work
      entry(10, 15, 12, 15), // 2h work, 15m break
    ];
    const currentStart = d(12, 30); // 15m break
    const now = d(14, 30); // 2h work
    const duration = ComplianceEngine.getContinuousWorkDuration(history, currentStart, now);
    expect(duration).toBe(6.5 * HOUR);
  });
});

describe('ComplianceEngine - Daily Total (10h Limit)', () => {
  it('sums historical and current session durations', () => {
    const history = [entry(8, 0, 12, 0)]; // 4h
    const currentStart = d(13, 0);
    const now = d(15, 0); // 2h
    const total = ComplianceEngine.getDailyTotal(history, currentStart, now);
    expect(total).toBe(6 * HOUR);
  });
});

describe('ComplianceEngine - Weekly Total (48h Limit)', () => {
  it('calculates weekly total since Monday', () => {
    // Feb 25, 2026 is a Wednesday. Monday was Feb 23.
    const history = [
      { ...entry(8, 0, 17, 0), date: '2026-02-23', start: new Date(2026, 1, 23, 8, 0).toISOString() }, // Mon: 9h
      { ...entry(8, 0, 17, 0), date: '2026-02-24', start: new Date(2026, 1, 24, 8, 0).toISOString() }, // Tue: 9h
      entry(8, 0, 12, 0), // Wed: 4h
    ];
    const currentStart = d(13, 0);
    const now = d(15, 0); // 2h
    const total = ComplianceEngine.getWeeklyTotal(history, currentStart, now);
    expect(total).toBe((9 + 9 + 4 + 2) * HOUR);
  });
});

describe('ComplianceEngine - checkCompliance', () => {
  it('returns normal status for reasonable work', () => {
    const history = [entry(8, 0, 12, 0)];
    const currentStart = d(13, 0).toISOString();
    const now = d(15, 0);
    const info = ComplianceEngine.checkCompliance(history, currentStart, now);
    expect(info.status).toBe('normal');
    expect(info.messages).toHaveLength(0);
  });

  it('returns warning when approaching 6h continuous work', () => {
    const history: SessionEntry[] = [];
    const currentStart = d(8, 0).toISOString();
    const now = d(13, 45); // 5h45m
    const info = ComplianceEngine.checkCompliance(history, currentStart, now);
    expect(info.status).toBe('warning');
    expect(info.messages[0]).toContain('Approaching 6 hours');
  });

  it('returns violation when exceeding 6h continuous work', () => {
    const history: SessionEntry[] = [];
    const currentStart = d(8, 0).toISOString();
    const now = d(14, 0); // 6h
    const info = ComplianceEngine.checkCompliance(history, currentStart, now);
    expect(info.status).toBe('violation');
    expect(info.messages[0]).toContain('exceeds 6 hours');
  });

  it('returns violation when exceeding 10h daily limit', () => {
    const history = [entry(8, 0, 17, 0)]; // 9h
    const currentStart = d(18, 0).toISOString();
    const now = d(19, 30); // 1.5h -> Total 10.5h
    const info = ComplianceEngine.checkCompliance(history, currentStart, now);
    expect(info.status).toBe('violation');
    expect(info.messages).toContain('Daily work limit (10h) reached.');
  });
});

describe('ComplianceEngine - getMandatoryDeductions', () => {
  it('returns 30m deduction for 6h continuous work violation', () => {
    const history: SessionEntry[] = [];
    const start = d(8, 0);
    const end = d(14, 1); // 6h 1m
    const result = ComplianceEngine.getMandatoryDeductions(history, start, end);
    expect(result.deductionMs).toBe(30 * MIN);
    expect(result.reason).toContain('6-hour rule');
  });

  it('returns 0 deduction if no violation', () => {
    const history = [entry(8, 0, 12, 0)];
    const start = d(12, 30);
    const end = d(18, 0); // 5.5h session, but break before it
    const result = ComplianceEngine.getMandatoryDeductions(history, start, end);
    expect(result.deductionMs).toBe(0);
  });
});

import { useRef, useState, useEffect } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import type { SessionEntry } from '../types';
import { useTimelineSegments, TIMELINE_TOTAL_MIN } from '../hooks/useTimelineSegments';
import ParticleOverlay from './ParticleOverlay';

// ── Constants ─────────────────────────────────────────────────────────────

const HOUR_TICKS = Array.from({ length: 15 }, (_, i) => i + 6); // 06 … 20

/** Minimum gap in minutes between two timestamp labels to avoid overlap */
const MIN_LABEL_GAP_MIN = 38;

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

interface LabelPoint {
  posMin: number;
  text: string;
  key: string;
}

/**
 * Build a de-overlapped list of timestamp labels from segments.
 * Collects all segment start/end boundaries, sorts by position,
 * then greedily filters out labels that are too close to each other.
 */
function buildLabels(segments: ReturnType<typeof useTimelineSegments>): LabelPoint[] {
  const raw: LabelPoint[] = [];
  const seen = new Set<string>(); // avoid duplicate positions

  for (const seg of segments) {
    const startKey = `${seg.startMin.toFixed(1)}`;
    const endKey = `${seg.endMin.toFixed(1)}`;
    if (!seen.has(startKey)) {
      seen.add(startKey);
      raw.push({ posMin: seg.startMin, text: fmtTime(seg.startISO), key: `s-${seg.id}` });
    }
    if (!seen.has(endKey)) {
      seen.add(endKey);
      raw.push({ posMin: seg.endMin, text: fmtTime(seg.endISO), key: `e-${seg.id}` });
    }
  }

  raw.sort((a, b) => a.posMin - b.posMin);

  // Greedy de-overlap pass
  const result: LabelPoint[] = [];
  let lastPosMin = -Infinity;
  for (const lp of raw) {
    if (lp.posMin - lastPosMin >= MIN_LABEL_GAP_MIN) {
      result.push(lp);
      lastPosMin = lp.posMin;
    }
  }
  return result;
}

// ── Props ─────────────────────────────────────────────────────────────────

interface TimelineSmartBarProps {
  sessions: SessionEntry[];
  currentSessionStart: string | null;
  status: 'IN' | 'OUT';
  /** Compact mode: thin bar, no ticks, no labels — for use in history rows */
  mini?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function TimelineSmartBar({
  sessions,
  currentSessionStart,
  status,
  mini = false,
}: TimelineSmartBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBarWidth(e.contentRect.width));
    ro.observe(el);
    setBarWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const segments = useTimelineSegments(sessions, currentSessionStart, status);
  const labels = mini ? [] : buildLabels(segments);

  const barHeight = mini ? 8 : 26;
  const trackRadius = mini ? '4px' : '13px';

  return (
    <Box sx={{ width: '100%', userSelect: 'none' }}>
      {/* Section title — full mode only */}
      {!mini && (
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 2, fontSize: '0.6rem', display: 'block', mb: 0.75 }}
        >
          TIMELINE DU JOUR
        </Typography>
      )}

      {/* ── Segment bar ───────────────────────────────────────────────── */}
      <Box
        ref={barRef}
        sx={{
          position: 'relative',
          height: barHeight,
          width: '100%',
          borderRadius: trackRadius,
          bgcolor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          // No overflow:hidden — lets the glow extend beyond the track
        }}
      >
        {segments.map((seg) => {
          const leftPct = (seg.startMin / TIMELINE_TOTAL_MIN) * 100;
          const widthPct = ((seg.endMin - seg.startMin) / TIMELINE_TOTAL_MIN) * 100;
          // Neon glow: two-layer box-shadow using the segment color
          const glow = `0 0 6px ${seg.color}99, 0 0 14px ${seg.color}55`;
          return (
            <Box
              key={seg.id}
              sx={{
                position: 'absolute',
                top: 0,
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                height: '100%',
                bgcolor: seg.color,
                borderRadius: '9999px',
                opacity: mini ? 0.9 : 0.92,
                boxShadow: glow,
                transition: 'width 0.4s ease, background-color 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              {seg.isActive && !mini && <ParticleOverlay color={seg.color} />}
            </Box>
          );
        })}
      </Box>

      {/* ── Hour ticks — full mode only ───────────────────────────────── */}
      {!mini && (
        <Box sx={{ position: 'relative', height: 18, mt: '2px' }}>
          {HOUR_TICKS.map((hour) => {
            const leftPct = (((hour - 6) * 60) / TIMELINE_TOTAL_MIN) * 100;
            return (
              <Box
                key={hour}
                sx={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Box sx={{ width: '1px', height: '5px', bgcolor: 'rgba(255,255,255,0.18)', mb: '2px' }} />
                <Typography sx={{ fontSize: '8px', color: 'text.disabled', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {hour.toString().padStart(2, '0')}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── Timestamp labels — full mode only, de-overlapped ─────────── */}
      {!mini && (
        <Box sx={{ position: 'relative', height: 14 }}>
          {/* Invisible hit targets for tooltip on narrow segments */}
          {segments.map((seg) => {
            const leftPct = (seg.startMin / TIMELINE_TOTAL_MIN) * 100;
            const widthPct = ((seg.endMin - seg.startMin) / TIMELINE_TOTAL_MIN) * 100;
            const widthPx = barWidth > 0 ? (widthPct / 100) * barWidth : 999;
            if (widthPx >= 44) return null;
            return (
              <Tooltip
                key={`${seg.id}-tt`}
                title={`${fmtTime(seg.startISO)} → ${fmtTime(seg.endISO)}`}
                placement="bottom"
                arrow
              >
                <Box sx={{ position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`, height: '100%', cursor: 'help' }} />
              </Tooltip>
            );
          })}
          {/* De-overlapped timestamp labels */}
          {labels.map((lp) => (
            <Typography
              key={lp.key}
              sx={{
                position: 'absolute',
                left: `${(lp.posMin / TIMELINE_TOTAL_MIN) * 100}%`,
                transform: 'translateX(-50%)',
                fontSize: '10px',
                color: 'text.secondary',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {lp.text}
            </Typography>
          ))}
        </Box>
      )}

      {/* ── Mini mode: hour ticks + small labels every hour ──────────── */}
      {mini && (
        <Box sx={{ position: 'relative', height: 13, mt: '2px' }}>
          {HOUR_TICKS.map((hour) => {
            const leftPct = (((hour - 6) * 60) / TIMELINE_TOTAL_MIN) * 100;
            return (
              <Box
                key={hour}
                sx={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Box sx={{ width: '1px', height: '3px', bgcolor: 'rgba(255,255,255,0.18)' }} />
                <Typography
                  sx={{
                    fontSize: '7px',
                    color: 'text.disabled',
                    lineHeight: 1,
                    mt: '1px',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: 0,
                  }}
                >
                  {hour.toString().padStart(2, '0')}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

import { Box } from '@mui/material';

interface ParticleOverlayProps {
  color: string;
}

const POSITIONS = [8, 20, 33, 46, 59, 72, 85]; // % left, evenly spread

/**
 * CSS keyframe particle overlay for the active session segment.
 * 7 dots floating up/down with staggered delays — no Canvas needed.
 */
export default function ParticleOverlay({ color }: ParticleOverlayProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        borderRadius: '9999px',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {POSITIONS.map((left, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            bgcolor: color,
            left: `${left}%`,
            top: '50%',
            boxShadow: `0 0 4px 2px ${color}88`,
            animation: `particle-float ${2.4 + (i % 3) * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.32}s`,
          }}
        />
      ))}
    </Box>
  );
}

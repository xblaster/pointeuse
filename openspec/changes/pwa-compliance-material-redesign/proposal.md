## Why

The current time tracker does not strictly adhere to Luxembourgish labor laws (specifically the 6-hour rule and the 10h/48h limits). Additionally, the UI lacks modern design standards and fluid interactions expected from a high-quality PWA.

## What Changes

- **Compliance Engine**: Implementation of a strict compliance engine for Luxembourgish labor law, including the 6-hour continuous work rule and the 10h daily / 48h weekly limits.
- **Material Design 3**: Redesign of the UI using Material Design 3 (M3) principles for a modern, professional look.
- **Hero Animations**: Addition of shared element transitions to create a "fluid" app experience.
- **PWA Enhancements**: Improved offline support and platform-native feel.

## Capabilities

### New Capabilities
- `compliance-engine-lux`: Logic to monitor continuous work, calculate weekly totals, and trigger alerts for 6h, 10h, and 48h limits.
- `material-design-3-ui`: New UI components based on M3 specifications and dynamic coloring.
- `hero-animations`: Fluid transitions for key elements (timer, action buttons).

### Modified Capabilities
- `time-tracking`: Updating the core tracking logic to incorporate real-time compliance monitoring.

## Impact

- `src/utils/timeUtils.ts` & `src/utils/lunchDeduction.ts`: Business logic will be refactored or replaced by the compliance engine.
- `src/hooks/useTimeTracker.ts`: State management will include weekly totals and compliance status.
- `src/screens/HomeScreen.tsx`: Complete visual overhaul.
- New Dependencies: `react-native-paper` for M3 components, `react-native-reanimated` for fluid animations.

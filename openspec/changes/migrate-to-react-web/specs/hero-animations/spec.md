## MODIFIED Requirements

### Requirement: Shared Element Transitions
The system MUST implement Hero animations using Framer Motion's `layout` prop and `AnimatePresence` to provide fluid transitions between UI states. These animations replace the react-native-reanimated implementation.

#### Scenario: Timer expansion
- **WHEN** the user clicks on the cumulative timer card
- **THEN** the timer text MUST smoothly scale and reposition using Framer Motion `layoutId` shared element transition

#### Scenario: Compliance alert entrance
- **WHEN** a compliance alert appears (status changes to warning or violation)
- **THEN** the alert card MUST animate in from above using a Framer Motion `initial`/`animate` variant (y: -20 → 0, opacity: 0 → 1)

#### Scenario: Session card entrance/exit
- **WHEN** the user clocks in and the "session démarrée à" card appears
- **THEN** the card MUST animate in using `AnimatePresence` with a slide-down + fade-in effect

#### Scenario: History item stagger
- **WHEN** today's session history renders
- **THEN** each history row MUST enter with a staggered delay (100ms per item) using Framer Motion variants

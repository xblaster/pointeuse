## MODIFIED Requirements

### Requirement: Material Design 3 Theming
The system MUST implement a theme based on Material Design 3 (M3) specifications, including tonal palettes and dynamic coloring. Surface containers (cards, dialogs, bottom sheets) MUST additionally apply Glassmorphism visual tokens as defined in the `glassmorphism-theme` spec — specifically `backdrop-filter: blur(10px–20px)`, `background: rgba(255,255,255,0.1)`, and `border: 1px solid rgba(255,255,255,0.2)` — replacing the default M3 opaque surface fills.

#### Scenario: Dynamic state coloring
- **WHEN** the compliance status changes from OK to WARNING
- **THEN** the system UI MUST transition its primary accent color to the Tertiary (Amber) tonal range

#### Scenario: Glass surface replaces opaque M3 surface
- **WHEN** any M3 card or container component is rendered in the application
- **THEN** it MUST use the Glassmorphism surface style instead of the default M3 opaque `surface` color token

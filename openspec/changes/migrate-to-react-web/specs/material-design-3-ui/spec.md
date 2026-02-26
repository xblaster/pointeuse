## MODIFIED Requirements

### Requirement: Material Design 3 Theming
The system MUST implement a theme based on Material Design 3 (M3) specifications using MUI v5 (`experimental_extendTheme`), including tonal palettes and dynamic coloring. The theme MUST be defined in `src/theme.ts` and applied via `CssVarsProvider`.

#### Scenario: Dynamic state coloring
- **WHEN** the compliance status changes from OK to WARNING
- **THEN** the system UI MUST transition its primary accent color to the Tertiary (Amber) tonal range

#### Scenario: Theme applied globally
- **WHEN** the app mounts
- **THEN** all MUI components MUST use the M3 theme (typography scale, color tokens, shape)

### Requirement: Responsive Layout for PWA
The system SHALL provide a responsive layout that adapts to mobile and desktop viewports while maintaining a platform-native feel. On mobile, the layout MUST use a single-column scrollable view. On desktop, content MUST be centered with a max-width of 480px.

#### Scenario: Mobile viewport optimization
- **WHEN** the app is viewed on a device with width less than 600px
- **THEN** the system MUST display a centered clock-in/out button pair filling the full width

#### Scenario: Desktop centered layout
- **WHEN** the app is viewed on a viewport wider than 600px
- **THEN** the content MUST be constrained to a max-width of 480px and centered horizontally

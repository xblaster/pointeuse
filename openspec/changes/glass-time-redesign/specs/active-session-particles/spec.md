## ADDED Requirements

### Requirement: Particle Overlay on Active Session Segment
The system MUST render a Canvas-based particle animation exclusively on the timeline segment corresponding to the currently active (clocked-in) session.

#### Scenario: Particles appear when session is active
- **WHEN** the user is currently clocked in (an active session exists with no end time)
- **THEN** a Canvas overlay MUST be rendered on top of the active session segment, displaying between 5 and 10 animated particles

#### Scenario: Particles disappear when session ends
- **WHEN** the user clocks out and the session receives an end time
- **THEN** the particle Canvas animation MUST stop and the overlay MUST be removed from the DOM

### Requirement: Particle Motion and Appearance
Particles MUST move slowly to produce a "breathing" effect without distracting the user.

#### Scenario: Particle opacity range
- **WHEN** particles are rendered
- **THEN** each particle MUST have an opacity between 0.2 and 0.5 at all times during its lifecycle

#### Scenario: Particle Y-axis translation
- **WHEN** a particle is animated
- **THEN** it MUST travel on the Y axis (entering or exiting the segment bounds) at a speed low enough that a full traversal takes no less than 2 seconds

#### Scenario: Animation is constrained to segment bounding box
- **WHEN** the active segment's position or width changes (e.g., on viewport resize)
- **THEN** the Canvas MUST resize and reposition to match the updated segment bounding box, and particles MUST not overflow outside it

### Requirement: Animation Performance Budget
The particle animation MUST NOT degrade mobile battery life beyond an acceptable threshold.

#### Scenario: Animation uses requestAnimationFrame
- **WHEN** the particle loop is running
- **THEN** it MUST use `requestAnimationFrame` and MUST call `cancelAnimationFrame` when the segment is hidden or unmounted

#### Scenario: Particle count ceiling
- **WHEN** the animation initialises
- **THEN** the total number of simultaneously active particles MUST NOT exceed 10

## ADDED Requirements

### Requirement: Horizontal Time Axis
The system MUST render a horizontal timeline covering the range 06:00 to 20:00, with hourly graduation marks.

#### Scenario: Graduation marks displayed
- **WHEN** the TimelineSmartBar component is rendered
- **THEN** a tick mark and hour label (e.g., "07", "08") MUST appear at every full hour between 06:00 and 20:00 inclusive

#### Scenario: Temporal alignment is consistent across days
- **WHEN** two sessions starting at 10:00 on different calendar days are displayed
- **THEN** both session segments MUST begin at the same horizontal pixel position on the timeline axis

### Requirement: Session Segments as Rounded Capsules
The system MUST represent each work session as a horizontally-positioned capsule whose left and right edges correspond to the session's start and end times respectively.

#### Scenario: Segment width proportional to duration
- **WHEN** a session of 1 hour is displayed alongside a session of 2 hours on the same timeline
- **THEN** the 2-hour segment MUST be exactly twice the pixel width of the 1-hour segment

#### Scenario: Capsule styling
- **WHEN** a session segment is rendered
- **THEN** it MUST use `border-radius: 9999px` (pill shape) and adopt the Glassmorphism surface style (see `glassmorphism-theme` spec)

### Requirement: Timestamp Indicators Under Segment Bounds
The system MUST display the precise time (HH:MM) below each segment start and end point.

#### Scenario: Timestamp label at segment boundary
- **WHEN** a session segment is rendered
- **THEN** a small icon and time label (font-size ≤ 12px) MUST appear directly below the left edge (clock-in time) and right edge (clock-out time) of the segment

#### Scenario: Labels hidden when segment is too narrow
- **WHEN** a session segment is less than 40px wide on screen
- **THEN** the timestamp labels MUST be hidden to prevent overlap, and a tooltip MUST be available on tap/hover

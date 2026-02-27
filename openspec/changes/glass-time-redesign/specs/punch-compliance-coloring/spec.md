## ADDED Requirements

### Requirement: RG-01 — Pre-07:00 Presence Coloring
The system MUST color any session segment that starts before 07:00 as red, indicating non-counted time.

#### Scenario: Segment starting before 07:00
- **WHEN** a session segment's start time is before 07:00
- **THEN** the segment MUST be rendered in red (`#F87171`) for the portion falling before 07:00
- **AND** the portion from 07:00 onward MUST be evaluated independently by subsequent rules

#### Scenario: Segment entirely before 07:00
- **WHEN** a session segment both starts and ends before 07:00
- **THEN** the entire segment MUST be rendered in red (`#F87171`)

### Requirement: RG-02 — Insufficient Break Coloring
The system MUST color segments red when the gap between two consecutive sessions is less than 30 minutes.

#### Scenario: Break shorter than 30 minutes detected
- **WHEN** the gap between the end of one session and the start of the next session is less than 30 minutes
- **THEN** both the preceding segment (or the portion within the insufficient break window) MUST be recolored to red (`#F87171`)

#### Scenario: Break of exactly 30 minutes is valid
- **WHEN** the gap between two sessions is exactly 30 minutes
- **THEN** neither segment SHALL be recolored due to RG-02; they retain their color from other rules

### Requirement: RG-03 — Valid Counted Time Coloring
The system MUST color green any session segment (or portion thereof) that starts at or after 07:00 and is not affected by RG-02.

#### Scenario: Fully valid session segment
- **WHEN** a session starts at or after 07:00 and the preceding break is ≥ 30 minutes (or it is the first session of the day)
- **THEN** the segment MUST be rendered in green (`#4ADE80`)

### Requirement: RG-04 — Active Session Coloring
The system MUST apply the green color to the currently active session segment, in addition to the particle overlay defined in `active-session-particles`.

#### Scenario: Active session segment is green with particles
- **WHEN** a session has a start time and no end time (user is currently clocked in)
- **AND** the session start time is at or after 07:00
- **THEN** the segment MUST be rendered in green (`#4ADE80`) and MUST have the particle overlay active

#### Scenario: Active session starting before 07:00 is red until 07:00
- **WHEN** an active session started before 07:00
- **THEN** the segment before 07:00 MUST be red (`#F87171`) and the portion from 07:00 onward MUST be green with particles

### Requirement: Absent Time is Transparent
The system MUST render the absence of sessions (gaps on the timeline) as transparent, not as a colored block.

#### Scenario: Gap between sessions
- **WHEN** there is a time range on the timeline with no associated session
- **THEN** that range MUST show the underlying timeline bar (transparent or background-only) with no colored fill

## ADDED Requirements

### Requirement: Real-time Duration Calculation
The system MUST calculate the effective duration of work in real-time, subtracting any necessary compliance deductions (like the 6-hour break) as they occur.

#### Scenario: Continuous update with deduction
- **WHEN** a session exceeds 6 hours and a 30-minute auto-deduction is applied
- **THEN** the displayed "Effective Duration" MUST immediately reflect the -30 minute adjustment

## ADDED Requirements

### Requirement: 6-Hour Continuous Work Rule
The system MUST monitor continuous work duration and identify when 6 hours of work have been reached without a minimum 30-minute break.

#### Scenario: 6-hour threshold approaching
- **WHEN** a continuous work session reaches 5 hours and 45 minutes
- **THEN** the system MUST display a visual warning to the user

#### Scenario: 6-hour threshold reached without break
- **WHEN** a continuous work session reaches 6 hours without a 30-minute break
- **THEN** the system MUST log a compliance violation and apply a mandatory 30-minute deduction if auto-regulation is enabled

### Requirement: Daily Maximum Work Limit
The system MUST prevent or alert the user when the daily work duration reaches the legal limit of 10 hours.

#### Scenario: 10-hour daily limit reached
- **WHEN** the total effective work duration for a single day reaches 10 hours
- **THEN** the system MUST change the timer color to red and display a critical alert

### Requirement: Weekly Maximum Work Limit
The system MUST monitor the total work duration for the current week (Monday to Sunday) against the 48-hour limit.

#### Scenario: Weekly limit exceeded
- **WHEN** the sum of all session durations since Monday 00:00 exceeds 48 hours
- **THEN** the system MUST display a critical compliance warning

## MODIFIED Requirements

### Requirement: Real-time Duration Calculation
The system MUST calculate the effective duration of work in real-time, subtracting any necessary compliance deductions (like the 6-hour break) as they occur. State is persisted in Firestore under `users/{uid}/state` and synced in real-time via `onSnapshot`.

#### Scenario: Continuous update with deduction
- **WHEN** a session exceeds 6 hours and a 30-minute auto-deduction is applied
- **THEN** the displayed "Effective Duration" MUST immediately reflect the -30 minute adjustment

#### Scenario: State persisted to Firestore on clock-in
- **WHEN** the user clicks the clock-in button
- **THEN** the system MUST write the new state (status: IN, currentSessionStart) to Firestore under the authenticated user's document

#### Scenario: State persisted to Firestore on clock-out
- **WHEN** the user clicks the clock-out button
- **THEN** the system MUST write the completed session entry and updated accumulatedMilliseconds to Firestore

#### Scenario: State restored from Firestore on page load
- **WHEN** an authenticated user loads the app
- **THEN** the system MUST read the user's state from Firestore and resume the timer if status is IN

#### Scenario: Monthly reset applied automatically
- **WHEN** the app loads and the current date is past `nextResetDate`
- **THEN** the system MUST reset accumulatedMilliseconds, weeklyAccumulatedMilliseconds, and history to zero, and persist the new state to Firestore

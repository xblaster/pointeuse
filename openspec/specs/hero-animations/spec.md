# Spec: Hero Animations

## Purpose

Define Shared Element Transition (Hero animation) behaviour between views in the PWA, providing a fluid and spatially coherent navigation experience.

## Requirements

### Requirement: Shared Element Transitions
The system MUST implement Hero animations (Shared Element Transitions) between the dashboard and detail views.

#### Scenario: Timer expansion
- **WHEN** the user taps on the cumulative timer card
- **THEN** the timer text MUST smoothly scale and reposition to the header of the detail view without interruption

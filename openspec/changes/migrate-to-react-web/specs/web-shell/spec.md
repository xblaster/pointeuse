## ADDED Requirements

### Requirement: Vite React Web Entry Point
The system SHALL provide a standard Vite + React + TypeScript project structure with `index.html` as entry point and `src/main.tsx` as React root.

#### Scenario: App loads in browser
- **WHEN** the user opens the app URL in a web browser
- **THEN** the React application MUST mount and display either the login screen or the dashboard, depending on auth state

#### Scenario: PWA manifest present
- **WHEN** the browser loads the app
- **THEN** a `manifest.json` MUST be served with app name, icons, and `display: standalone`

### Requirement: Firebase Configuration
The system MUST initialize Firebase (app, auth, Firestore) from environment variables stored in `.env.local`.

#### Scenario: Environment variables loaded
- **WHEN** the app starts
- **THEN** Firebase MUST be initialized using `VITE_FIREBASE_*` env vars (apiKey, authDomain, projectId, etc.)

#### Scenario: Missing config fails gracefully
- **WHEN** a required `VITE_FIREBASE_*` variable is missing
- **THEN** the app MUST throw a clear error at startup identifying the missing variable

### Requirement: Google Authentication
The system MUST allow users to sign in with their Google account via Firebase Auth, and sign out at any time.

#### Scenario: Sign in with Google
- **WHEN** the unauthenticated user clicks the "Se connecter avec Google" button
- **THEN** the system MUST open a Google OAuth popup and, on success, transition to the dashboard

#### Scenario: Auth state persistence
- **WHEN** the user refreshes the page after signing in
- **THEN** the system MUST restore the authenticated session without requiring a new sign-in

#### Scenario: Sign out
- **WHEN** the authenticated user clicks the "Se déconnecter" button
- **THEN** the system MUST sign out from Firebase Auth and redirect to the login screen

### Requirement: Auth-gated Routing
The system MUST show the login screen to unauthenticated users and the dashboard to authenticated users, with no in-between flash of wrong content.

#### Scenario: Loading state
- **WHEN** Firebase Auth is resolving the initial auth state
- **THEN** the system MUST display a centered loading spinner, not the login or dashboard

#### Scenario: Redirect unauthenticated
- **WHEN** an unauthenticated user navigates to the app
- **THEN** the system MUST display only the login screen

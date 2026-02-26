## Context

The current application uses basic React Native components and a simple logic for lunch deductions. It lacks a centralized compliance engine to handle complex labor laws and modern UX standards.

## Goals / Non-Goals

**Goals:**
- Centralize compliance logic in a dedicated `ComplianceEngine` utility.
- Adopt Material Design 3 (M3) via `react-native-paper`.
- Implement performant Hero animations using `react-native-reanimated`.
- Improve PWA capabilities (offline support, responsive layout).

**Non-Goals:**
- Backend integration (the app remains local-first with AsyncStorage).
- Support for complex multi-timezone shifts (Luxembourg focus only).

## Decisions

### 1. Centralized Compliance Engine
- **Decision**: Replace `lunchDeduction.ts` with a comprehensive `complianceEngine.ts`.
- **Rationale**: The new rules (6h, 10h, 48h) require shared state and cross-session analysis. A centralized engine ensures consistency between the timer display and the recorded history.
- **Alternatives**: Keeping logic in the hook (leads to "prop-drilling" of logic and harder testing).

### 2. UI Framework: React Native Paper (M3)
- **Decision**: Integrate `react-native-paper` for all core UI components.
- **Rationale**: Provides out-of-the-box M3 support, dynamic coloring, and excellent PWA/Web compatibility.
- **Alternatives**: Vanilla CSS/StyleSheet (too much manual work to match M3 specs).

### 3. Animation Engine: Reanimated + Shared Elements
- **Decision**: Use `react-native-reanimated` for transitions and shared elements for Hero animations.
- **Rationale**: Reanimated provides 60fps animations on both Native and Web (PWA).
- **Alternatives**: LayoutAnimation (too limited for Hero transitions).

## Risks / Trade-offs

- **[Risk]** Shared Elements support in PWA (Web) → **Mitigation**: Use `react-native-reanimated` layout transitions which have better web support, or implement a "Scale & Fade" fallback for web.
- **[Risk]** Logic complexity with multiple overlapping rules → **Mitigation**: Exhaustive unit testing for the `ComplianceEngine` covering edge cases (e.g., 5h59 session followed by a 1-minute break).
- **[Risk]** AsyncStorage performance with large histories → **Mitigation**: Implement a monthly cleanup/archive strategy to keep the active state small.

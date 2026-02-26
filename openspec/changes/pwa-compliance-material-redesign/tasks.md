## 1. Foundation & Dependencies

- [x] 1.1 Install `react-native-paper` and `react-native-vector-icons`.
- [x] 1.2 Install `react-native-reanimated` and configure the babel plugin.
- [x] 1.3 Create the new directory structure for `src/compliance/`.

## 2. Compliance Engine Implementation

- [x] 2.1 Implement `complianceEngine.ts` with the 6-hour continuous work rule.
- [x] 2.2 Add daily (10h) and weekly (48h) limit calculations to the engine.
- [x] 2.3 Implement the automatic 30-minute deduction logic for breaches.
- [x] 2.4 Create unit tests in `src/__tests__/complianceEngine.test.ts`.

## 3. Hook & State Refactoring

- [x] 3.1 Update `TrackerState` type to include `weeklyAccumulatedMilliseconds` and `complianceStatus`.
- [x] 3.2 Refactor `useTimeTracker.ts` to integrate the `ComplianceEngine`.
- [x] 3.3 Ensure the timer updates in real-time with compliance warnings (amber/red).

## 4. Material Design 3 UI

- [x] 4.1 Setup `PaperProvider` with a custom M3 tonal palette in `App.tsx`.
- [x] 4.2 Rewrite `HomeScreen.tsx` using `react-native-paper` components (Card, Button, Text, FAB).
- [x] 4.3 Implement the dynamic coloring logic based on compliance status.

## 5. Hero Animations

- [x] 5.1 Implement shared element transition for the cumulative timer card.
- [x] 5.2 Add entrance/exit animations for compliance alerts using Reanimated.
- [x] 5.3 Implement the "Action Morph" animation for the clock-in/out button.

## 6. Verification & PWA

- [x] 6.1 Verify the 6-hour rule alert triggers at 5h45.
- [x] 6.2 Verify the 10h daily limit turns the UI red.
- [x] 6.3 Test PWA responsiveness and offline state persistence.

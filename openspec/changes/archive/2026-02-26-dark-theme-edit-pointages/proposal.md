## Why

L'app est uniquement en mode clair sans moyen de basculer en thème sombre, ce qui nuit au confort visuel. Par ailleurs, il est impossible de corriger une erreur de pointage ou de saisir manuellement une session passée oubliée, rendant l'historique non fiable.

## What Changes

- Ajout d'un bouton toggle dark/light dans le Dashboard (header ou menu)
- Persistance du choix de thème dans `localStorage` (survit aux rechargements)
- Modal d'édition d'un `SessionEntry` existant : modification de `start`, `end`, recalcul automatique de `rawDuration`, `duration`, `lunchDeducted`
- Formulaire de création manuelle d'une session passée : choix libre de la date, heure de début et heure de fin
- Recalcul du `accumulatedMilliseconds` et du `complianceStatus` après toute modification d'historique
- Les sessions passées créées/éditées sont persistées dans Firestore comme les sessions normales

## Capabilities

### New Capabilities

- `dark-theme`: Toggle dark/light avec persistance localStorage ; le thème MUI utilise déjà `experimental_extendTheme` avec les deux `colorSchemes` définis — il faut brancher `useColorScheme()` de MUI et exposer le toggle dans l'UI.
- `edit-pointage`: Édition d'une session existante via un modal (champs date/heure début-fin), création d'une session passée via le même formulaire, recalcul des totaux et de la conformité après chaque modification.

### Modified Capabilities

- `time-tracking`: Le hook `useTimeTracker` doit exposer deux nouvelles actions — `updateEntry(index, partial)` et `addEntry(entry)` — qui mettent à jour `history`, recalculent `accumulatedMilliseconds` et persistente en Firestore.

## Impact

- `src/theme.ts` — aucune modification (palettes déjà prêtes)
- `src/main.tsx` — brancher `CssVarsProvider` / `useColorScheme` de MUI
- `src/hooks/useTimeTracker.ts` — ajout de `updateEntry` et `addEntry`
- `src/components/Dashboard.tsx` — ajout du toggle thème + boutons édition/ajout dans l'historique
- Nouveaux composants : `ThemeToggle.tsx`, `EditSessionModal.tsx`
- Dépendances : aucune nouvelle (MUI et date-fns déjà présents)

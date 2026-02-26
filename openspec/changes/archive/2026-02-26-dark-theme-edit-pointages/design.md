## Context

L'app utilise MUI v6 avec `experimental_extendTheme` / `CssVarsProvider` — le système CSS variables est déjà en place dans `App.tsx`. Les deux palettes `light` et `dark` sont définies dans `theme.ts`. Le hook `useColorScheme()` de MUI est donc disponible sans dépendance supplémentaire.

Les sessions sont stockées dans `TrackerState.history: SessionEntry[]` persisté dans Firestore à `users/{uid}/state/tracker`. Aujourd'hui `useTimeTracker` n'expose que `clockIn` / `clockOut` ; toute mutation d'historique passe par `persist(newState)`.

## Goals / Non-Goals

**Goals:**
- Toggle dark/light dans le header du Dashboard, persisté automatiquement par MUI via `localStorage`
- Édition d'une `SessionEntry` existante (heure début, heure fin) avec recalcul automatique
- Création d'une session passée (date libre + heures)
- Recalcul correct de `accumulatedMilliseconds` et `complianceStatus` après toute mutation d'historique
- Historique étendu : afficher toutes les sessions du mois groupées par date (pas seulement aujourd'hui)

**Non-Goals:**
- Suppression de sessions (hors scope, risque d'erreur irréversible sans confirmation)
- Édition de la session en cours (statut `IN`)
- Sync multi-appareils temps réel sur les mutations manuelles (le `onSnapshot` existant suffit)
- Authentification ou gestion des rôles

## Decisions

### 1. Dark theme — `useColorScheme()` sans état custom

**Décision** : utiliser `useColorScheme()` fourni par MUI dans tout composant enfant de `CssVarsProvider`. Stocker le choix avec le `storageKey` par défaut de MUI (`mui-color-scheme`) dans `localStorage`.

**Pourquoi pas un contexte React custom ?** `CssVarsProvider` gère déjà la persistance, l'injection CSS et le SSR. Dupliquer cette logique ajouterait de la complexité sans bénéfice.

**Composant `ThemeToggle`** : `IconButton` avec `LightModeIcon` / `DarkModeIcon`, placé dans le header du Dashboard à côté du bouton de déconnexion. Appelle `setMode('light' | 'dark')`.

### 2. Édition / création — modal unique `EditSessionModal`

**Décision** : un seul composant modal pour les deux cas (édition et création), distingués par une prop `mode: 'edit' | 'create'` et `entry?: SessionEntry & { index: number }`.

**Champs du formulaire** :
- Date : `<input type="date">` natif (pas de dépendance DatePicker)
- Heure début : `<input type="time">`
- Heure fin : `<input type="time">`

**Validation** : fin > début, date ≤ aujourd'hui, pas de chevauchement avec une autre session du même jour (avertissement non bloquant).

**Recalcul à la soumission** : reconstruire la `SessionEntry` complète en appelant `ComplianceEngine.getMandatoryDeductions()` pour déterminer `lunchDeducted` et `duration`.

### 3. Mutations dans `useTimeTracker`

Deux nouvelles fonctions exposées :

```
updateEntry(index: number, start: string, end: string): Promise<void>
addEntry(date: string, start: string, end: string): Promise<void>
```

**Recalcul de `accumulatedMilliseconds`** : somme de tous les `entry.duration` de l'historique entier (plus fiable que le cumul incrémental actuel qui peut dériver après éditions).

**Recalcul de `complianceStatus`** : `ComplianceEngine.checkCompliance(newHistory, state.currentSessionStart)`.

### 4. Affichage de l'historique étendu

**Décision** : remplacer la section "AUJOURD'HUI" par un historique groupé par date, affiché en ordre décroissant. Chaque ligne de session a un `IconButton` (crayon) pour ouvrir le modal en mode édition. Un bouton "Ajouter une session passée" (outlined, en bas de l'historique) ouvre le modal en mode création.

**Pourquoi pas une page dédiée ?** L'app est une SPA mono-vue mobile-first ; un scroll simple suffit pour l'historique mensuel (~20 sessions max).

## Risks / Trade-offs

- **Chevauchement de sessions** : deux sessions peuvent se chevaucher après édition manuelle → avertissement UI non bloquant (l'utilisateur est responsable de la cohérence)
- **Recalcul `accumulatedMilliseconds` par somme** : légèrement plus coûteux qu'un incrément, mais O(n) sur 20-30 entrées max → négligeable ; élimine le risque de dérive
- **`input type="date/time"` natif** : rendu différent selon navigateur/OS, mais acceptable pour une app interne mono-utilisateur ; évite d'ajouter date-fns/MUI DatePicker

## Migration Plan

1. Ajouter `ThemeToggle` dans le Dashboard (aucune migration de données)
2. Ajouter `updateEntry` / `addEntry` dans `useTimeTracker` (rétrocompatible, nouvelles fonctions seulement)
3. Ajouter `EditSessionModal` (nouveau fichier)
4. Étendre la section historique dans `Dashboard` (modification UI uniquement)
5. Déployer — aucune migration Firestore requise (le schéma `TrackerState` ne change pas)

## Open Questions

- Faut-il un mode `system` (suit les préférences OS) en plus de `light`/`dark` ? → Par défaut non, le toggle binaire suffit pour l'usage prévu.
- L'historique étendu doit-il être paginé ou toujours tout afficher ? → Tout afficher (reset mensuel limite à ~20 sessions).

## Why

Le projet est actuellement une app React Native/Expo ciblant mobile, mais la pointeuse doit fonctionner comme une PWA web accessible depuis n'importe quel navigateur de bureau ou mobile. Tout le code React Native (composants, APIs, dépendances) doit être remplacé par du React web pur avec Vite, en conservant toute la logique métier (compliance engine, types, hooks).

## What Changes

- **BREAKING** Suppression complète d'Expo, React Native, react-native-paper, react-native-reanimated, AsyncStorage
- Création d'un projet Vite + React + TypeScript avec pnpm
- Ajout de **Firebase** : authentification Google (Firebase Auth) + persistance multi-devices (Firestore)
- Remplacement d'AsyncStorage par **Firestore** (`users/{uid}/state`) avec sync temps réel via `onSnapshot`
- Ajout d'un écran de login avec bouton **"Se connecter avec Google"** (Firebase Auth popup)
- Remplacement des composants React Native par des composants HTML/CSS + Material UI (MUI v5)
- Remplacement des animations Reanimated par **Framer Motion** (layout animations, AnimatePresence)
- Conservation du `ComplianceEngine`, des types et de la logique du hook `useTimeTracker` (portage minimal)
- Mise à jour de la configuration Jest pour jsdom (web)
- `index.html` + point d'entrée Vite standard (`src/main.tsx`)
- PWA-ready : `manifest.json` + meta tags

## Capabilities

### New Capabilities
- `web-shell`: Point d'entrée Vite, index.html, App.tsx, configuration TypeScript/ESLint, package.json pnpm, PWA manifest

### Modified Capabilities
- `time-tracking`: Le hook `useTimeTracker` passe de AsyncStorage à Firestore (même interface exposée, scoped par uid)
- `compliance-engine-lux`: Aucun changement de comportement — le moteur est pure TypeScript, il est porté tel quel
- `material-design-3-ui`: Remplace react-native-paper par MUI v5 avec thème M3 (tonal palette, couleurs dynamiques selon statut compliance)
- `hero-animations`: Remplace react-native-reanimated par Framer Motion (layout animations, shared element–style transitions)

## Impact

- `package.json` : refonte complète des dépendances
- `App.tsx` : nouveau point d'entrée React web
- `src/screens/HomeScreen.tsx` → `src/components/Dashboard.tsx` : refonte en HTML/MUI
- `src/hooks/useTimeTracker.ts` : remplacement AsyncStorage → Firestore
- `src/hooks/useAuth.ts` : nouveau hook Firebase Auth
- `src/firebase.ts` : nouveau fichier d'initialisation Firebase
- `src/components/LoginScreen.tsx` : nouveau composant login Google
- `src/compliance/complianceEngine.ts` : aucun changement
- `src/types/index.ts` : aucun changement
- `src/utils/timeUtils.ts` : aucun changement
- Suppression de `babel.config.js`, `app.json`, `src/screens/`
- Ajout de `vite.config.ts`, `index.html`, `src/main.tsx`, `tsconfig.json` web-standard
- Ajout de `firestore.rules` (isolation des données par uid)
- Ajout de `.env.local.example` (variables Firebase)

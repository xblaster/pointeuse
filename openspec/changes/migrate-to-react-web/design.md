## Context

La pointeuse est actuellement une app Expo/React Native. L'objectif est de la transformer en une application web React classique (SPA/PWA) servie par Vite, sans conserver aucune dépendance mobile. La logique métier (ComplianceEngine, types, hook) est portable sans modification majeure.

## Goals / Non-Goals

**Goals:**
- Remplacer l'intégralité du runtime mobile (Expo, RN, paper, reanimated) par des équivalents web
- Conserver à l'identique : `ComplianceEngine`, `types/index.ts`, `utils/timeUtils.ts`, `utils/lunchDeduction.ts`
- Passer AsyncStorage → **Firestore** (`users/{uid}/state`) dans `useTimeTracker`, scoped par uid
- Implémenter l'UI avec MUI v5 (thème M3) et Framer Motion pour les animations
- Produire un `index.html` + `manifest.json` pour une utilisation PWA basique
- Garder la suite de tests Jest (ts-jest) fonctionnelle avec env jsdom

**Non-Goals:**
- Service Worker / mode hors-ligne complet
- Back-end ou synchronisation serveur
- Multi-utilisateur
- Conserver la compatibilité React Native

## Decisions

### 1. Bundler : Vite (pas CRA)
Vite offre un démarrage à froid quasi-instantané, HMR natif ESM, et une config TypeScript sans éjection. CRA est déprécié. Next.js serait surdimensionné pour une SPA statique.

### 2. UI : MUI v5 + thème personnalisé M3
MUI v5 supporte nativement le design system M3 (palettes tonales, `experimental_extendTheme`). react-native-paper ne s'exécute pas en web pur. Alternative rejetée : Chakra UI (moins aligné M3), Tailwind (trop bas niveau pour reproduire les composants paper rapidement).

### 3. Animations : Framer Motion
`framer-motion` est la bibliothèque la plus proche de react-native-reanimated côté web : layout animations (`layout` prop), `AnimatePresence`, transitions de valeurs partagées. Alternative : CSS transitions pures (moins expressif pour les layout animations).

### 4. Persistance : Firestore (Firebase)
**Firebase Firestore** remplace localStorage. Chaque utilisateur authentifié dispose de son propre document `users/{uid}/state` en Firestore. La persistance est multi-appareils et temps réel. `onSnapshot` remplace le polling localStorage. Alternative rejetée : localStorage (pas de sync multi-devices, perdu si l'utilisateur vide le cache).

### 4b. Authentification : Firebase Auth + Google Sign-In
`firebase/auth` avec le provider `GoogleAuthProvider`. Le flux est : écran de login → popup/redirect Google → `onAuthStateChanged` → chargement de l'état Firestore de l'utilisateur. Les données sont strictement isolées par UID (règles Firestore : `request.auth.uid == userId`). Alternative rejetée : email/mot de passe (friction inutile pour un usage interne mono-utilisateur ou petit groupe).

### 5. Structure de fichiers conservée
```
src/
  compliance/complianceEngine.ts   ← inchangé
  types/index.ts                   ← inchangé
  utils/timeUtils.ts               ← inchangé
  utils/lunchDeduction.ts          ← inchangé
  hooks/useTimeTracker.ts          ← AsyncStorage → Firestore (onSnapshot)
  hooks/useAuth.ts                 ← nouveau : Firebase Auth state
  components/Dashboard.tsx         ← remplace HomeScreen.tsx (MUI + Framer Motion)
  components/LoginScreen.tsx       ← nouveau : bouton Google Sign-In
  firebase.ts                      ← initialisation Firebase app/auth/firestore
  theme.ts                         ← thème MUI M3
App.tsx                            ← nouveau point d'entrée web (router auth)
index.html                         ← entrée Vite
vite.config.ts
tsconfig.json
```

### 6. Tests : Jest + ts-jest + jsdom
Le `complianceEngine.test.ts` existant est pur TypeScript, il passe sans changement. L'env passe de `node` à `jsdom` pour couvrir les futurs tests de composants. Vitest était envisagé mais ts-jest est déjà configuré et fonctionne bien.

## Risks / Trade-offs

- **Popup Google bloquée** → certains navigateurs bloquent les popups ; prévoir fallback `signInWithRedirect` si le popup échoue.
- **Latence Firestore au premier chargement** → afficher un spinner pendant `onSnapshot` initial ; état local mis à jour dès réception.
- **Pas de SSR** → acceptable pour une PWA interne monopage.
- **MUI bundle size (~300 KB gz)** → acceptable pour usage interne ; tree-shaking Vite limite l'impact.
- **Framer Motion layout animations** → peuvent être saccadées si trop de nœuds re-rendent ; le composant Dashboard est simple, risque faible.

## Migration Plan

1. Supprimer les fichiers Expo/RN (`app.json`, `babel.config.js`, `src/screens/`)
2. Réécrire `package.json` (Vite, React, MUI, Framer Motion, Firebase, types web)
3. Installer les dépendances avec pnpm
4. Créer `index.html`, `vite.config.ts`, `tsconfig.json`
5. Créer `src/firebase.ts` (init Firebase app, auth, firestore) + `.env.local` pour les clés
6. Créer `src/hooks/useAuth.ts` (onAuthStateChanged, signInWithGoogle, signOut)
7. Porter `useTimeTracker` (AsyncStorage → Firestore onSnapshot, scoped par uid)
8. Créer `src/theme.ts` (thème MUI M3)
9. Créer `src/components/LoginScreen.tsx` (Google Sign-In button MUI)
10. Créer `src/components/Dashboard.tsx` (UI MUI + Framer Motion layout + hero animations)
11. Mettre à jour `App.tsx` (routing auth : LoginScreen vs Dashboard)
12. Mettre à jour la config Jest (jsdom, moduleNameMapper, mock firebase)
13. Vérifier que les tests passent (`pnpm test`)
14. Vérifier que l'app démarre (`pnpm dev`)

Rollback : le code React Native est toujours dans git, un `git revert` suffit.

## Open Questions

- Aucune : le périmètre est clairement défini.

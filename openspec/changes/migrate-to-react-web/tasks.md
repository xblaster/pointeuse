## 1. Nettoyage du projet React Native

- [x] 1.1 Supprimer `app.json`, `babel.config.js`
- [x] 1.2 Supprimer `src/screens/HomeScreen.tsx`
- [x] 1.3 Supprimer les dépendances Expo/RN de `package.json` (expo, react-native, react-native-paper, react-native-reanimated, react-native-vector-icons, @react-native-async-storage/async-storage, expo-status-bar)

## 2. Scaffolding Vite + TypeScript

- [x] 2.1 Réécrire `package.json` avec les dépendances web : `vite`, `@vitejs/plugin-react`, `react`, `react-dom`, `typescript`, `@types/react`, `@types/react-dom`
- [x] 2.2 Ajouter MUI v5 : `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`
- [x] 2.3 Ajouter Framer Motion : `framer-motion`
- [x] 2.4 Ajouter Firebase : `firebase`
- [x] 2.5 Créer `index.html` (point d'entrée Vite, meta viewport, lien manifest)
- [x] 2.6 Créer `src/main.tsx` (ReactDOM.createRoot, StrictMode, mount de App)
- [x] 2.7 Créer `vite.config.ts` (plugin React, alias `@` → `src/`)
- [x] 2.8 Créer `tsconfig.json` et `tsconfig.node.json` compatibles web
- [x] 2.9 Créer `public/manifest.json` (PWA : name, icons, display: standalone)
- [x] 2.10 Mettre à jour `.gitignore` : ajouter `.env.local`
- [x] 2.11 Installer toutes les dépendances avec `pnpm install`

## 3. Firebase

- [x] 3.1 Créer `src/firebase.ts` : initialisation `initializeApp`, export `auth` (getAuth) et `db` (getFirestore)
- [x] 3.2 Créer `.env.local.example` documentant toutes les variables `VITE_FIREBASE_*` requises (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)
- [x] 3.3 Créer `firestore.rules` avec isolation par uid : `allow read, write: if request.auth != null && request.auth.uid == userId;`

## 4. Authentification Google

- [x] 4.1 Créer `src/hooks/useAuth.ts` : `onAuthStateChanged`, `signInWithPopup(GoogleAuthProvider)`, `signOut`, expose `{ user, loading, signIn, signOut }`
- [x] 4.2 Créer `src/components/LoginScreen.tsx` : écran centré MUI avec bouton "Se connecter avec Google" (icône Google) et branding de l'app
- [x] 4.3 Mettre à jour `App.tsx` : afficher spinner pendant résolution auth, `LoginScreen` si non authentifié, `Dashboard` si authentifié

## 5. Persistance Firestore

- [x] 5.1 Porter `src/hooks/useTimeTracker.ts` : accepter `uid: string` en paramètre, remplacer AsyncStorage par Firestore (`doc(db, 'users', uid, 'state')`, `setDoc`, `onSnapshot`)
- [x] 5.2 Implémenter `onSnapshot` pour synchronisation temps réel de l'état du tracker (remplace le polling)
- [x] 5.3 Vérifier que la logique de reset mensuel (`nextResetDate`) écrit bien le nouvel état dans Firestore
- [x] 5.4 Brancher `uid` dans `App.tsx` : passer `user.uid` de `useAuth` à `useTimeTracker` (le hook n'est activé que si `user !== null`)

## 6. Thème MUI M3

- [x] 6.1 Créer `src/theme.ts` avec `experimental_extendTheme` MUI : palette primaire (bleu), tertiaire (ambre pour warnings), shape, typographie M3
- [x] 6.2 Appliquer `CssVarsProvider` dans `App.tsx` en wrappant le contenu avec le thème

## 7. Composant Dashboard

- [x] 7.1 Créer `src/components/Dashboard.tsx` : structure générale (header, alertes, timer card, boutons, historique)
- [x] 7.2 Implémenter le header : titre "POINTEUSE" + badge statut (EN SERVICE / HORS SERVICE) avec couleurs MUI
- [x] 7.3 Implémenter la carte timer principale (cumul mensuel) avec `motion.div` Framer Motion et `layoutId="timer-display"`
- [x] 7.4 Implémenter la carte cumul hebdomadaire + date de reset
- [x] 7.5 Implémenter les boutons ENTRÉE / SORTIE (MUI `Button` contained/outlined, couleurs selon état)
- [x] 7.6 Ajouter le bouton "Se déconnecter" (icône logout, discret en haut à droite)
- [x] 7.7 Implémenter l'historique du jour (liste MUI + `Divider`)
- [x] 7.8 Responsive : centrer le contenu sur desktop avec `maxWidth: 480px`, pleine largeur sur mobile

## 8. Hero Animations (Framer Motion)

- [x] 8.1 Animer l'apparition des alertes compliance (`AnimatePresence`, `motion.div` y:-20→0, opacity:0→1)
- [x] 8.2 Animer l'entrée/sortie de la carte session en cours (`AnimatePresence`, slide-down + fade)
- [x] 8.3 Ajouter `layoutId="timer-display"` sur le texte du timer pour la transition hero au clic
- [x] 8.4 Ajouter l'animation staggered sur les lignes d'historique (variants, staggerChildren 0.1s)

## 9. Tests

- [x] 9.1 Mettre à jour la config Jest dans `package.json` : `testEnvironment: jsdom`, ajouter `moduleNameMapper` pour alias `@/`
- [x] 9.2 Ajouter mock Firebase dans `src/__tests__/__mocks__/firebase.ts` (ou `jest.setup.ts`)
- [x] 9.3 Vérifier que `src/__tests__/complianceEngine.test.ts` passe sans modification (`pnpm test`)

## 10. Validation finale

- [x] 10.1 `pnpm dev` : vérifier que l'app démarre sans erreurs TypeScript ni console errors
- [ ] 10.2 Tester le flux complet : login Google → clock-in → attendre → clock-out → vérifier historique
- [ ] 10.3 Vérifier la persistance Firestore : recharger la page et contrôler que l'état est restauré
- [ ] 10.4 Vérifier les animations (alerte compliance, session card, historique stagger)
- [ ] 10.5 Tester sur mobile (viewport < 600px) : layout responsive correct

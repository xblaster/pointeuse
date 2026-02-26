## 1. Thème dark — Toggle UI

- [x] 1.1 Créer `src/components/ThemeToggle.tsx` : `IconButton` qui appelle `useColorScheme()` de MUI pour basculer entre `light` et `dark`, affichant `DarkModeIcon` ou `LightModeIcon` selon le mode actif
- [x] 1.2 Ajouter `ThemeToggle` dans le header du `Dashboard.tsx`, entre le chip de statut et le bouton de déconnexion
- [x] 1.3 Vérifier que `CssVarsProvider` dans `App.tsx` utilise bien `defaultMode="system"` ou `"light"` et que la persistance `localStorage` fonctionne (clé `mui-color-scheme` automatique)
- [x] 1.4 Tester visuellement : basculer dark ↔ light, recharger la page, vérifier que le thème est conservé

## 2. Hook — updateEntry et addEntry

- [x] 2.1 Ajouter la fonction `updateEntry(index: number, start: string, end: string): Promise<void>` dans `useTimeTracker` : reconstruire la `SessionEntry` avec `ComplianceEngine.getMandatoryDeductions`, recalculer `accumulatedMilliseconds` par somme de tout l'historique, persister
- [x] 2.2 Ajouter la fonction `addEntry(date: string, start: string, end: string): Promise<void>` dans `useTimeTracker` : construire une nouvelle `SessionEntry`, l'insérer dans `history` (trié par date/heure), recalculer `accumulatedMilliseconds`, persister
- [x] 2.3 Dans les deux fonctions, appeler `ComplianceEngine.checkCompliance(newHistory, state.currentSessionStart)` pour mettre à jour `complianceStatus` et `weeklyAccumulatedMilliseconds`
- [x] 2.4 Exposer `updateEntry` et `addEntry` dans le retour du hook

## 3. Modal EditSessionModal

- [x] 3.1 Créer `src/components/EditSessionModal.tsx` avec les props : `open`, `onClose`, `onSubmit`, `mode: 'edit' | 'create'`, `entry?: SessionEntry & { index: number }`, `defaultDate?: string`
- [x] 3.2 Implémenter les champs du formulaire : `<input type="date">` (max = aujourd'hui), `<input type="time">` début, `<input type="time">` fin
- [x] 3.3 Implémenter la validation : fin > début (erreur bloquante), date ≤ aujourd'hui (erreur bloquante)
- [x] 3.4 En mode `edit`, pré-remplir les champs avec les valeurs de la session existante
- [x] 3.5 En mode `create`, pré-remplir la date avec aujourd'hui, heures vides
- [x] 3.6 Au submit, appeler `onSubmit({ date, start, end })` et fermer le modal

## 4. Dashboard — Historique étendu et intégration

- [x] 4.1 Remplacer la section "AUJOURD'HUI" par un historique complet du mois : grouper `history` par date, trier les groupes en ordre décroissant (plus récent en premier)
- [x] 4.2 Afficher le total journalier sous chaque groupe de sessions (déjà présent pour aujourd'hui, à généraliser)
- [x] 4.3 Ajouter un `IconButton` avec `EditIcon` sur chaque ligne de session pour ouvrir `EditSessionModal` en mode `edit`
- [x] 4.4 Ajouter un bouton "Ajouter une session" (variant `outlined`, avec `AddIcon`) en bas de la section historique pour ouvrir `EditSessionModal` en mode `create`
- [x] 4.5 Connecter les callbacks du modal aux fonctions `updateEntry` et `addEntry` du hook
- [x] 4.6 Vérifier que l'état du modal (open/fermé, mode, entry sélectionnée) est correctement géré avec `useState` local dans `Dashboard`

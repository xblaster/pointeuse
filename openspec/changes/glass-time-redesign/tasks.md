## 1. Glassmorphism Theme Tokens

- [x] 1.1 Définir les CSS custom properties glassmorphism (--glass-blur, --glass-bg, --glass-border) dans un fichier global `src/styles/glass.css`
- [x] 1.2 Créer la classe utilitaire `.glass-surface` appliquant `backdrop-filter`, `background` et `border` depuis les tokens
- [x] 1.3 Ajouter le fallback `@supports not (backdrop-filter: blur())` avec `background: rgba(30,30,40,0.7)`
- [x] 1.4 Remplacer les surfaces M3 opaques par `.glass-surface` sur les composants Card/Dialog/BottomSheet du Dashboard
- [x] 1.5 Ajouter le fond dégradé organique multi-stop sur `body` avec `background-attachment: fixed`
- [ ] 1.6 Vérifier le rendu sur iOS Safari et Firefox (fallback)

## 2. Hook `useTimelineSegments`

- [x] 2.1 Créer `src/hooks/useTimelineSegments.ts` prenant `sessions: SessionEntry[]` et `activeSession: ActiveSession | null` en paramètres
- [x] 2.2 Calculer pour chaque session un segment `{ startMin, endMin, color, isActive }` où `startMin`/`endMin` sont les minutes depuis 06:00
- [x] 2.3 Implémenter RG-01 : fraction avant 07:00 → couleur rouge (`#F87171`)
- [x] 2.4 Implémenter RG-02 : détecter les gaps < 30 min entre sessions consécutives et recolorer en rouge
- [x] 2.5 Implémenter RG-03 : portion >= 07:00 sans violation → vert (`#4ADE80`)
- [x] 2.6 Implémenter RG-04 : segment actif (pas de end time) → vert + flag `isActive = true`
- [x] 2.7 Écrire les tests unitaires couvrant les cas limites RG-01→RG-04 (session à cheval 07:00, pause exacte 30 min, session active avant 07:00)

## 3. Composant `TimelineSmartBar`

- [x] 3.1 Créer `src/components/TimelineSmartBar.tsx` avec props `{ sessions, activeSession, complianceStatus }`
- [x] 3.2 Rendre l'axe horizontal avec graduation horaire de 06:00 à 20:00 (ticks et labels)
- [x] 3.3 Rendre chaque segment comme une capsule (`border-radius: 9999px`) positionnée par `left` et `width` calculés depuis `startMin`/`endMin` sur 840 minutes totales
- [x] 3.4 Appliquer le style `.glass-surface` aux capsules de segment
- [x] 3.5 Afficher les timestamp labels (HH:MM) sous chaque borne gauche/droite de segment
- [x] 3.6 Masquer les labels si largeur du segment < 40px et ajouter un tooltip (title ou Radix Tooltip)
- [x] 3.7 Rendre le composant responsive (recalcul des pixels sur resize via `ResizeObserver`)

## 4. Composant `ParticleOverlay`

- [x] 4.1 Créer `src/components/ParticleOverlay.tsx` encapsulant un `<canvas>` superposé au segment actif
- [x] 4.2 Initialiser entre 5 et 10 particules avec position, vitesse Y aléatoire (traversée ≥ 2 s) et opacité entre 0.2 et 0.5
- [x] 4.3 Implémenter la boucle `requestAnimationFrame` avec mise à jour de position et rebond/respawn en sortie de bounding box
- [x] 4.4 Appeler `cancelAnimationFrame` dans le `useEffect` cleanup (unmount ou segment inactif)
- [x] 4.5 Synchroniser la taille/position du canvas avec le bounding box du segment via `ResizeObserver`
- [x] 4.6 Intégrer `ParticleOverlay` dans `TimelineSmartBar` conditionné sur `segment.isActive`

## 5. Intégration Dashboard

- [x] 5.1 Importer et placer `TimelineSmartBar` dans `src/pages/Dashboard.tsx` sous le bloc "Durée effective"
- [x] 5.2 Passer `history`, `currentSession` et `complianceStatus` depuis `useTimeTracker` au composant
- [ ] 5.3 Vérifier l'alignement visuel avec les maquettes (Smart Bar pleine largeur, marges cohérentes)
- [ ] 5.4 Tester sur mobile (Chrome DevTools, vraie session active) : particules visibles, performance acceptable (pas de jank)
- [ ] 5.5 Tester les transitions couleur RG lors du changement de statut de conformité en temps réel

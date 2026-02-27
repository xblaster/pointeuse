## Context

L'application est une PWA React (Vite) avec Firebase/Firestore et un système de conformité au droit du travail luxembourgeois. Les couches existantes :
- `useTimeTracker` : hook central qui gère sessions, durées effectives et statut de conformité
- `compliance-engine-lux` : produit les statuts RG (violations 6h, max journalier/hebdo)
- `material-design-3-ui` : définit les tokens visuels et la mise en page responsive

La refonte ne touche pas à la logique métier ni au modèle de données — elle ajoute une couche de présentation par-dessus les données déjà calculées.

## Goals / Non-Goals

**Goals:**
- Implémenter le système visuel Glassmorphism comme remplacement des surfaces M3 plates
- Créer le composant `TimelineSmartBar` consommant l'historique de sessions
- Implémenter la logique de colorisation RG-01→RG-04 en lecture seule sur les données de conformité existantes
- Ajouter l'animation de particules Canvas sur le segment de session active

**Non-Goals:**
- Modifier le moteur de conformité (`compliance-engine-lux`) ou ses règles
- Changer le modèle de données Firestore
- Modifier le hook `useTimeTracker` (contrat d'API déjà suffisant)
- Supporter les navigateurs sans `backdrop-filter` (IE11, vieux Edge)
- Internationalisation ou thème clair/sombre conditionnel

## Decisions

### D-01 : Glassmorphism via CSS natif, pas de lib

**Choix** : `backdrop-filter: blur()` + tokens CSS custom properties, sans bibliothèque.

**Alternatives considérées** :
- `styled-components` glassmorphism plugin → overhead de build inutile
- SVG filter blur → non pris en charge proprement sur les conteneurs DOM

**Rationale** : browser support suffisant (iOS Safari ≥ 9, Chrome ≥ 76, Firefox ≥ 103). Zéro dépendance supplémentaire. Les tokens CSS sont écrasables par composant.

### D-02 : Particules via Canvas natif, pas de tsparticles

**Choix** : implémentation Canvas `requestAnimationFrame` maison (~80 lignes).

**Alternatives considérées** :
- `tsparticles` (70 kB gzip) → trop lourd pour 5–10 particules
- Animations CSS `@keyframes` sur pseudo-éléments → impossible de contraindre les particules à l'intérieur d'un segment dynamique (largeur calculée au runtime)

**Rationale** : performance maîtrisée, aucun bundle cost, contrôle total sur le bounding box du segment.

### D-03 : TimelineSmartBar comme composant autonome avec props dérivées

**Choix** : `<TimelineSmartBar sessions={history} activeSession={current} complianceStatus={status} />` — aucun accès direct au store.

**Rationale** : testabilité unitaire (props pures), réutilisable dans une vue "Historique" future.

### D-04 : Calcul des segments dans un hook `useTimelineSegments`

**Choix** : hook dérivé qui transforme `SessionEntry[]` en tableau de segments `{ start, end, color, isActive }`.

**Rationale** : séparation logique de calcul / rendu. La colorisation RG-01→RG-04 est centralisée ici.

### D-05 : Fond dégradé organique sur `AppShell`

**Choix** : gradient CSS multi-couches sur `:root` ou `body` (ex. violet → bleu nuit → vert sombre).

**Rationale** : le Glassmorphism est invisible sans fond coloré derrière. Approche CSS pure, pas d'image bitmap.

## Risks / Trade-offs

- **[Performance mobile] Canvas animation drain batterie** → Mitigation : max 10 particules, `cancelAnimationFrame` dès que le segment n'est plus actif, `visibility: hidden` hors viewport
- **[Browser] `backdrop-filter` non supporté sur Firefox < 103** → Mitigation : fallback `background: rgba(30,30,40,0.7)` solide (dégradation gracieuse acceptable, FF moderne supporte)
- **[Précision timeline] Segments < 5 min trop petits pour afficher les horodatages** → Mitigation : horodatages masqués en dessous d'un seuil de largeur calculée, tooltip au survol/tap
- **[Complexité RG-02] Détection pause < 30 min entre deux segments** → Mitigation : `useTimelineSegments` recolore rétroactivement le segment précédant une pause trop courte en rouge

## Migration Plan

1. Créer les nouveaux composants (`TimelineSmartBar`, `ParticleOverlay`) sans modifier l'existant
2. Intégrer `glassmorphism-theme` tokens dans les variables CSS globales (écrasement des tokens M3 surface)
3. Remplacer les cartes M3 plates par les variantes verre sur l'écran Dashboard uniquement
4. Ajouter `TimelineSmartBar` sous le bloc "Durée effective" du Dashboard
5. QA sur iOS Safari et Android Chrome (backdrop-filter + Canvas)

**Rollback** : les nouveaux composants sont additifs — supprimer `TimelineSmartBar` et revert les tokens CSS restaure l'état antérieur sans toucher à la logique métier.

## Open Questions

- Le fond dégradé organique doit-il être animé (lent morphing de couleurs) ou statique ? *(décision UX, hors scope technique initial)*
- La timeline est-elle affichée aussi dans la vue "Historique / édition des pointages" ou uniquement sur le Dashboard ? *(impact sur D-03 si réutilisé)*

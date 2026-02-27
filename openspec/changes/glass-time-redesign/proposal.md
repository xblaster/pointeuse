## Why

L'interface de pointage actuelle repose sur Material Design 3 avec une navigation fonctionnelle mais sans valeur visuelle différenciante. La refonte "Glass-Time 2026" transforme l'expérience utilisateur en introduisant le Glassmorphism et une timeline horizontale intelligente : l'employé comprend d'un seul regard la validité réglementaire de sa journée, sans devoir interpréter des chiffres bruts.

## What Changes

- Remplacement du thème visuel M3 plat par un style Glassmorphism (flou, transparence, bordures lumineuses)
- Ajout d'une "Smart Bar" — timeline horizontale de 06h00 à 20h00 représentant les segments de pointage sous forme de capsules colorées
- Code couleur réglementaire sur les segments : vert (temps comptabilisé) / rouge (temps non comptabilisé selon règles RH)
- Animation de particules discrète sur le segment de la session en cours (confirmation visuelle que le chrono tourne)
- Affichage des horodatages précis (entrée/sortie) sous chaque borne de segment

## Capabilities

### New Capabilities
- `glassmorphism-theme`: Système de design verre — backdrop-filter blur 10–20px, background rgba(255,255,255,0.1), bordures rgba(255,255,255,0.2), fond dégradé organique requis
- `timeline-smart-bar`: Ligne de temps horizontale graduée de 06h00 à 20h00, segments calculés depuis l'historique de sessions, capsules aux bords arrondis, alignement temporel strict, horodatages sous chaque borne
- `active-session-particles`: Animation Canvas/SVG de 5 à 10 particules (opacité 0.2–0.5, translation lente sur axe Y) sur le segment de session active uniquement
- `punch-compliance-coloring`: Logique de colorisation RG-01→RG-04 appliquée aux segments de la timeline (rouge si < 07h00 ou pause < 30 min, vert sinon, vert+particules si session active)

### Modified Capabilities
- `material-design-3-ui`: Le système de theming visuel est étendu — les conteneurs M3 adoptent le style verre ; les tokens de couleur primaire/surface sont remplacés par les valeurs glassmorphism. Les exigences de layout responsive (mobile/desktop) restent inchangées.

## Impact

- **Composants front-end** : nouveau composant `TimelineSmartBar`, nouveau composant `ParticleOverlay`, mise à jour de `AppShell`/conteneurs pour les styles verre
- **Hook** : `useTimeTracker` expose déjà l'historique de sessions — aucun changement de contrat nécessaire
- **Moteur de conformité** : `compliance-engine-lux` fournit les statuts RG-01/RG-02/RG-03 — consommation en lecture seule, pas de modification
- **Dépendances** : ajout possible de `tsparticles` (léger) ou implémentation Canvas native ; `backdrop-filter` nécessite les navigateurs modernes (iOS Safari ≥ 9, Chrome ≥ 76)
- **Performance** : l'animation doit être limitée à 5–10 particules et utiliser `requestAnimationFrame` pour ne pas dégrader la batterie mobile

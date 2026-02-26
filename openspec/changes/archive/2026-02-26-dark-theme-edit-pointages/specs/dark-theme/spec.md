## ADDED Requirements

### Requirement: Toggle dark/light mode
L'application SHALL proposer un bouton de bascule entre le thème clair et le thème sombre, accessible depuis le header du Dashboard.

#### Scenario: Basculer vers le thème sombre
- **WHEN** l'utilisateur clique sur le bouton ThemeToggle alors que le mode actif est `light`
- **THEN** l'application passe immédiatement en mode `dark` sans rechargement de page

#### Scenario: Basculer vers le thème clair
- **WHEN** l'utilisateur clique sur le bouton ThemeToggle alors que le mode actif est `dark`
- **THEN** l'application passe immédiatement en mode `light` sans rechargement de page

### Requirement: Persistance du thème choisi
Le thème sélectionné SHALL être conservé entre les sessions via `localStorage` (clé `mui-color-scheme`).

#### Scenario: Rechargement après sélection du thème sombre
- **WHEN** l'utilisateur a sélectionné le mode `dark` puis recharge la page
- **THEN** l'application s'affiche directement en mode `dark` sans flash de thème clair

#### Scenario: Rechargement après sélection du thème clair
- **WHEN** l'utilisateur a sélectionné le mode `light` puis recharge la page
- **THEN** l'application s'affiche directement en mode `light`

### Requirement: Apparence correcte en mode sombre
Tous les composants de l'application (Dashboard, LoginScreen, modals) SHALL utiliser les tokens MUI `background.default`, `background.paper`, et les couleurs de palette qui s'adaptent automatiquement via `CssVarsProvider`.

#### Scenario: Dashboard en mode sombre
- **WHEN** le mode `dark` est actif
- **THEN** le fond du Dashboard affiche `#0A0F1C`, les cards affichent `#111827`, et les textes sont lisibles sur fond sombre

#### Scenario: LoginScreen en mode sombre
- **WHEN** le mode `dark` est actif
- **THEN** l'écran de login s'affiche correctement sans texte illisible ni fond blanc

### Requirement: Icône du toggle reflète le mode actif
Le bouton ThemeToggle SHALL afficher `LightModeIcon` quand le mode actif est `dark` (pour indiquer qu'on peut passer au clair) et `DarkModeIcon` quand le mode actif est `light`.

#### Scenario: Icône en mode sombre
- **WHEN** le mode actif est `dark`
- **THEN** le bouton affiche l'icône soleil (LightModeIcon)

#### Scenario: Icône en mode clair
- **WHEN** le mode actif est `light`
- **THEN** le bouton affiche l'icône lune (DarkModeIcon)

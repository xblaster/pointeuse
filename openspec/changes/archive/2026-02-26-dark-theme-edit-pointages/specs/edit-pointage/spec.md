## ADDED Requirements

### Requirement: Édition d'une session existante
L'utilisateur SHALL pouvoir modifier les heures de début et de fin d'une `SessionEntry` existante via un modal d'édition.

#### Scenario: Ouverture du modal d'édition
- **WHEN** l'utilisateur clique sur l'icône de modification (crayon) d'une session dans l'historique
- **THEN** un modal s'ouvre pré-rempli avec la date, l'heure de début et l'heure de fin de la session sélectionnée

#### Scenario: Modification valide
- **WHEN** l'utilisateur modifie les heures et soumet le formulaire avec heure de fin > heure de début
- **THEN** la session est mise à jour dans l'historique, `rawDuration` et `duration` sont recalculés, `lunchDeducted` est réévalué, et les totaux (`accumulatedMilliseconds`, `complianceStatus`) sont mis à jour

#### Scenario: Modification invalide — fin avant début
- **WHEN** l'utilisateur saisit une heure de fin antérieure ou égale à l'heure de début
- **THEN** le formulaire affiche un message d'erreur et le bouton de validation est désactivé

#### Scenario: Persistance après édition
- **WHEN** une modification valide est soumise
- **THEN** le nouvel état est persisté dans Firestore

### Requirement: Création d'une session passée
L'utilisateur SHALL pouvoir créer manuellement une session de travail pour n'importe quelle date passée (≤ aujourd'hui) via le même modal en mode création.

#### Scenario: Ouverture du modal de création
- **WHEN** l'utilisateur clique sur le bouton "Ajouter une session passée"
- **THEN** le modal s'ouvre avec des champs vides : date (pré-remplie avec aujourd'hui), heure de début, heure de fin

#### Scenario: Création valide
- **WHEN** l'utilisateur renseigne une date ≤ aujourd'hui, une heure de début et une heure de fin > début, puis soumet
- **THEN** une nouvelle `SessionEntry` est ajoutée à l'historique avec recalcul de `rawDuration`, `duration`, `lunchDeducted`, `accumulatedMilliseconds` et `complianceStatus`

#### Scenario: Création invalide — date future
- **WHEN** l'utilisateur saisit une date postérieure à aujourd'hui
- **THEN** le formulaire affiche un message d'erreur et le bouton de validation est désactivé

#### Scenario: Persistance après création
- **WHEN** une création valide est soumise
- **THEN** le nouvel état est persisté dans Firestore

### Requirement: Recalcul des totaux après mutation
Après toute édition ou création manuelle, les cumuls SHALL être recalculés depuis zéro à partir de l'intégralité de `history`.

#### Scenario: Recalcul de accumulatedMilliseconds
- **WHEN** une session est éditée ou créée
- **THEN** `accumulatedMilliseconds` est recalculé comme la somme de tous les `entry.duration` de l'historique

#### Scenario: Recalcul du statut de conformité CSSF
- **WHEN** une session est éditée ou créée
- **THEN** `ComplianceEngine.checkCompliance(newHistory, currentSessionStart)` est appelé et `complianceStatus` est mis à jour

### Requirement: Affichage de l'historique complet du mois
Le Dashboard SHALL afficher toutes les sessions du mois en cours, groupées par date en ordre décroissant (jour le plus récent en premier).

#### Scenario: Sessions de plusieurs jours affichées
- **WHEN** l'historique contient des sessions sur plusieurs dates différentes
- **THEN** chaque date est affichée comme un groupe distinct avec ses sessions et son total journalier

#### Scenario: Bouton d'édition visible sur chaque session
- **WHEN** l'historique contient au moins une session
- **THEN** chaque ligne de session affiche un `IconButton` crayon pour ouvrir le modal d'édition

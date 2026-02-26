## MODIFIED Requirements

### Requirement: Exposition des actions de mutation d'historique
Le hook `useTimeTracker` SHALL exposer deux nouvelles fonctions permettant de modifier l'historique des sessions.

#### Scenario: updateEntry — mise à jour d'une session existante
- **WHEN** `updateEntry(index, start, end)` est appelé avec un index valide et `end > start`
- **THEN** la session à l'index spécifié est remplacée par une nouvelle `SessionEntry` recalculée, `accumulatedMilliseconds` est recalculé par somme de tout l'historique, `complianceStatus` est mis à jour, et l'état est persisté dans Firestore

#### Scenario: addEntry — ajout d'une session passée
- **WHEN** `addEntry(date, start, end)` est appelé avec `end > start` et `date ≤ aujourd'hui`
- **THEN** une nouvelle `SessionEntry` est construite et ajoutée à `history`, `accumulatedMilliseconds` est recalculé par somme de tout l'historique, `complianceStatus` est mis à jour, et l'état est persisté dans Firestore

#### Scenario: Pas d'effet si uid est null
- **WHEN** `updateEntry` ou `addEntry` est appelé sans utilisateur authentifié (uid null)
- **THEN** aucune mutation n'est effectuée et aucune erreur n'est propagée

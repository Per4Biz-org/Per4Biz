/*
  # Rendre le champ contrat client obligatoire dans la table entité

  1. Modifications
    - Modification du champ com_contrat_client_id pour le rendre NOT NULL
    
  2. Notes
    - Cette modification nécessite que toutes les entités existantes aient déjà un contrat client associé
*/

ALTER TABLE com_entite 
  ALTER COLUMN com_contrat_client_id SET NOT NULL;
/*
  # Rendre le champ contrat client obligatoire dans la table com_profil

  1. Modifications
    - Modification du champ com_contrat_client_id pour le rendre NOT NULL
    
  2. Notes
    - Cette modification nécessite que tous les profils existants aient déjà un contrat client associé
*/

ALTER TABLE com_profil 
  ALTER COLUMN com_contrat_client_id SET NOT NULL;
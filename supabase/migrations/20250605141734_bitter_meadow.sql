/*
  # Rendre le champ contrat client obligatoire dans la table fin_compte_bancaire

  1. Modifications
    - Modification du champ com_contrat_client_id pour le rendre NOT NULL
    
  2. Notes
    - Cette modification nécessite que tous les comptes bancaires existants aient déjà un contrat client associé
*/

ALTER TABLE fin_compte_bancaire 
  ALTER COLUMN com_contrat_client_id SET NOT NULL;
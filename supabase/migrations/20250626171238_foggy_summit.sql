/*
  # Correction de la contrainte d'unicité sur com_tiers

  1. Modifications
    - Ajout d'une contrainte d'unicité sur la combinaison (code, id_type_tiers, com_contrat_client_id)
    - Suppression de la condition WHERE qui causait une erreur de syntaxe
*/

-- Ajout de la contrainte d'unicité sur code et id_type_tiers
ALTER TABLE public.com_tiers 
ADD CONSTRAINT com_tiers_code_id_type_tiers_unique 
UNIQUE (code, id_type_tiers, com_contrat_client_id);
/*
  # Ajout d'une contrainte d'unicité sur la table com_tiers

  1. Modifications
    - Ajout d'une contrainte d'unicité sur les colonnes (code, id_type_tiers) pour la table com_tiers
    - La contrainte ne s'applique que lorsque com_contrat_client_id n'est pas NULL
*/

-- Ajout de la contrainte d'unicité sur code et id_type_tiers
ALTER TABLE public.com_tiers 
ADD CONSTRAINT com_tiers_code_id_type_tiers_unique 
UNIQUE (code, id_type_tiers) 
WHERE com_contrat_client_id IS NOT NULL;
/*
  # Modification de la contrainte d'unicité pour la table com_tiers
  
  1. Changements
    - Suppression de la contrainte d'unicité existante sur le code seul
    - Ajout d'une nouvelle contrainte d'unicité sur la combinaison (code, id_type_tiers, com_contrat_client_id)
    
  Cette modification permettra de créer plusieurs tiers avec le même code tant qu'ils ont des types différents
  au sein d'un même contrat client.
*/

-- Supprimer la contrainte d'unicité existante sur le code
ALTER TABLE public.com_tiers
DROP CONSTRAINT IF EXISTS com_tiers_code_unique;

-- Créer une nouvelle contrainte d'unicité sur la combinaison (code, id_type_tiers, com_contrat_client_id)
ALTER TABLE public.com_tiers
ADD CONSTRAINT com_tiers_code_type_contrat_unique
UNIQUE (code, id_type_tiers, com_contrat_client_id);
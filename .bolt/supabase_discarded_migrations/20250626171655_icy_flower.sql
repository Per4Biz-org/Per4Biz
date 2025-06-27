-- Ajout de la contrainte d'unicité sur code et id_type_tiers
ALTER TABLE public.com_tiers 
ADD CONSTRAINT com_tiers_code_id_type_tiers_unique 
UNIQUE (code, id_type_tiers, com_contrat_client_id);
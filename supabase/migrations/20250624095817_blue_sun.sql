/*
  # Ajout du champ salarie à la table com_param_type_tiers

  1. Modifications
    - Ajout d'un champ `salarie` de type boolean avec valeur par défaut FALSE
    
  2. Objectif
    - Permettre d'identifier les types de tiers qui correspondent à des salariés
    - Faciliter le filtrage et la recherche des tiers de type salarié
    - Améliorer la classification des tiers dans l'application
*/

-- Ajout du champ salarie avec valeur par défaut FALSE
ALTER TABLE com_param_type_tiers 
ADD COLUMN salarie boolean DEFAULT FALSE;

-- Vérification de l'ajout de la colonne
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'com_param_type_tiers' 
    AND column_name = 'salarie'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ La colonne salarie a été ajoutée avec succès à la table com_param_type_tiers';
  ELSE
    RAISE WARNING '❌ Échec de l''ajout de la colonne salarie à la table com_param_type_tiers';
  END IF;
END $$;
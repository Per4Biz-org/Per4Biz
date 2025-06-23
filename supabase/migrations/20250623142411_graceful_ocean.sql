/*
  # Ajout du champ updated_at à la table rh_fonction

  1. Modifications
    - Ajout d'un champ `updated_at` de type timestamp with time zone
    - Valeur par défaut : now()
    
  2. Objectif
    - Compléter les champs d'audit de la table
    - Assurer la cohérence avec les autres tables du système
    - Permettre le suivi des modifications
*/

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rh_fonction' AND column_name = 'updated_at'
  ) THEN
    -- Ajouter la colonne updated_at
    ALTER TABLE rh_fonction 
    ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    
    RAISE NOTICE 'Colonne updated_at ajoutée à la table rh_fonction';
  ELSE
    RAISE NOTICE 'La colonne updated_at existe déjà dans la table rh_fonction';
  END IF;
END $$;

-- Vérification finale
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'rh_fonction' 
    AND column_name = 'updated_at'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ La colonne updated_at a été ajoutée avec succès à la table rh_fonction';
  ELSE
    RAISE WARNING '❌ Échec de l''ajout de la colonne updated_at à la table rh_fonction';
  END IF;
END $$;
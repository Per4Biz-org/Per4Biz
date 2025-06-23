/*
  # Ajout de contraintes d'exclusivité pour les types de facture

  1. Contraintes ajoutées
    - Contrainte CHECK pour s'assurer qu'une seule option est activée par ligne
    - Contrainte d'unicité conditionnelle pour chaque type de facture par contrat client

  2. Objectif
    - Garantir qu'une seule des options (exploitation, RH, autres) est activée par ligne
    - Assurer qu'un seul type de facture peut être défini pour chaque catégorie par contrat client
    - Maintenir l'intégrité des données pour la classification des factures
*/

-- Étape 1: Ajouter une contrainte CHECK pour s'assurer qu'une seule option est activée par ligne
ALTER TABLE com_param_type_facture
ADD CONSTRAINT com_param_type_facture_single_type_check
CHECK (
  (facture_exploitation::int + facture_rh::int + facture_autres::int) <= 1
);

-- Étape 2: Ajouter des contraintes d'unicité conditionnelles pour chaque type de facture par contrat client
-- Pour les factures d'exploitation
CREATE UNIQUE INDEX idx_unique_facture_exploitation
ON com_param_type_facture (com_contrat_client_id)
WHERE facture_exploitation = true;

-- Pour les factures RH
CREATE UNIQUE INDEX idx_unique_facture_rh
ON com_param_type_facture (com_contrat_client_id)
WHERE facture_rh = true;

-- Pour les autres factures
CREATE UNIQUE INDEX idx_unique_facture_autres
ON com_param_type_facture (com_contrat_client_id)
WHERE facture_autres = true;

-- Vérification des contraintes ajoutées
DO $$
DECLARE
  check_constraint_exists BOOLEAN;
  exploitation_index_exists BOOLEAN;
  rh_index_exists BOOLEAN;
  autres_index_exists BOOLEAN;
BEGIN
  -- Vérifier la contrainte CHECK
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'com_param_type_facture_single_type_check'
    AND table_name = 'com_param_type_facture'
  ) INTO check_constraint_exists;
  
  -- Vérifier les index d'unicité conditionnels
  SELECT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'idx_unique_facture_exploitation'
  ) INTO exploitation_index_exists;
  
  SELECT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'idx_unique_facture_rh'
  ) INTO rh_index_exists;
  
  SELECT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'idx_unique_facture_autres'
  ) INTO autres_index_exists;
  
  -- Afficher les résultats
  RAISE NOTICE 'Vérification des contraintes:';
  RAISE NOTICE '- Contrainte CHECK: %', CASE WHEN check_constraint_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '- Index d''unicité pour facture_exploitation: %', CASE WHEN exploitation_index_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '- Index d''unicité pour facture_rh: %', CASE WHEN rh_index_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '- Index d''unicité pour facture_autres: %', CASE WHEN autres_index_exists THEN '✅' ELSE '❌' END;
  
  -- Vérification globale
  IF check_constraint_exists AND exploitation_index_exists AND rh_index_exists AND autres_index_exists THEN
    RAISE NOTICE '✅ Toutes les contraintes ont été ajoutées avec succès';
  ELSE
    RAISE WARNING '⚠️ Certaines contraintes n''ont pas été ajoutées correctement';
  END IF;
END $$;
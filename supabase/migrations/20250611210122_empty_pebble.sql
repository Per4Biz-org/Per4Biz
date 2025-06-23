/*
  # Ajout du champ nb_jours_ouverts à la table ca_budget_mensuel_detail

  1. Modifications
    - Ajout d'un champ `nb_jours_ouverts` de type integer
    - Le champ est nullable pour permettre des détails de budget sans jours d'ouverture spécifiés
    
  2. Objectif
    - Permettre de spécifier un nombre de jours d'ouverture spécifique par type de service
    - Offrir plus de granularité dans la planification budgétaire
    - Compléter les informations de budget mensuel avec des données opérationnelles

  3. Impact
    - Les enregistrements existants auront une valeur NULL pour ce champ
    - Les nouveaux enregistrements pourront spécifier un nombre de jours d'ouverture
*/

-- Ajout de la colonne nb_jours_ouverts (nullable)
ALTER TABLE ca_budget_mensuel_detail 
ADD COLUMN nb_jours_ouverts integer;

-- Vérification de l'ajout de la colonne
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ca_budget_mensuel_detail' 
    AND column_name = 'nb_jours_ouverts'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ La colonne nb_jours_ouverts a été ajoutée avec succès à la table ca_budget_mensuel_detail';
  ELSE
    RAISE WARNING '❌ Échec de l''ajout de la colonne nb_jours_ouverts à la table ca_budget_mensuel_detail';
  END IF;
END $$;
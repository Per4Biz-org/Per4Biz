/*
  # Ajout du champ tx_presence à la table rh_affectation

  1. Modifications
    - Ajout d'un champ `tx_presence` de type numeric(5,4)
    - Le champ est nullable pour permettre des affectations sans taux de présence spécifié
    
  2. Objectif
    - Permettre de spécifier un taux de présence pour chaque affectation
    - Faciliter le calcul des coûts et la planification des ressources
    - Gérer les temps partiels et les affectations multiples

  3. Impact
    - Les affectations existantes auront une valeur NULL pour ce champ
    - Les nouvelles affectations pourront spécifier un taux de présence
*/

-- Ajout de la colonne tx_presence (nullable)
ALTER TABLE rh_affectation 
ADD COLUMN tx_presence numeric(5,4);

-- Vérification de l'ajout de la colonne
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'rh_affectation' 
    AND column_name = 'tx_presence'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE '✅ La colonne tx_presence a été ajoutée avec succès à la table rh_affectation';
  ELSE
    RAISE WARNING '❌ Échec de l''ajout de la colonne tx_presence à la table rh_affectation';
  END IF;
END $$;
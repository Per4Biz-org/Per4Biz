/*
  # Ajout du champ tx_presence à la table rh_affectation

  1. Modifications
    - Ajout d'un champ `tx_presence` de type numeric(5,4)
    - Valeur par défaut : 1.0000 (100%)
    
  2. Objectif
    - Permettre de spécifier un taux de présence pour chaque affectation
    - Faciliter la gestion des temps partiels et des affectations multiples
    - Améliorer la précision des calculs de coûts RH
*/

-- Ajout de la colonne tx_presence avec valeur par défaut 1.0000 (100%)
ALTER TABLE rh_affectation 
ADD COLUMN tx_presence numeric(5,4) DEFAULT 1.0000;

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
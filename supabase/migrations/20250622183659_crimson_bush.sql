/*
  # Rendre le champ id_type_facture obligatoire dans fin_facture_achat

  1. Modifications
    - Modification du champ id_type_facture pour le rendre NOT NULL
    
  2. Objectif
    - Assurer que toutes les factures ont un type de facture associé
    - Renforcer l'intégrité des données
    - Simplifier les requêtes et les rapports

  3. Impact
    - Les factures existantes devront être mises à jour pour associer un type de facture
    - Les nouvelles factures devront obligatoirement spécifier un type de facture
*/

-- Rendre la colonne id_type_facture NOT NULL
ALTER TABLE fin_facture_achat 
  ALTER COLUMN id_type_facture SET NOT NULL;

-- Vérification de la modification
DO $$
DECLARE
  is_not_nullable BOOLEAN;
BEGIN
  SELECT is_nullable = 'NO'
  INTO is_not_nullable
  FROM information_schema.columns
  WHERE table_name = 'fin_facture_achat'
  AND column_name = 'id_type_facture';
  
  IF is_not_nullable THEN
    RAISE NOTICE '✅ La colonne id_type_facture est maintenant NOT NULL';
  ELSE
    RAISE WARNING '❌ Échec de la modification: la colonne id_type_facture est toujours nullable';
  END IF;
END $$;
/*
  # Vérification et mise à jour des contraintes NOT NULL pour les montants de facture

  1. Vérification
    - Vérifier que les champs montant_ht, montant_tva et montant_ttc sont tous NOT NULL
    - Afficher l'état actuel des contraintes

  2. Mise à jour
    - Si nécessaire, mettre à jour les valeurs NULL existantes
    - Ajouter les contraintes NOT NULL manquantes

  3. Validation
    - Confirmer que toutes les contraintes sont correctement appliquées
*/

-- Vérification de l'état actuel des contraintes
DO $$
DECLARE
  ht_nullable TEXT;
  tva_nullable TEXT;
  ttc_nullable TEXT;
BEGIN
  SELECT is_nullable INTO ht_nullable
  FROM information_schema.columns
  WHERE table_name = 'fin_facture_achat'
  AND column_name = 'montant_ht';
  
  SELECT is_nullable INTO tva_nullable
  FROM information_schema.columns
  WHERE table_name = 'fin_facture_achat'
  AND column_name = 'montant_tva';
  
  SELECT is_nullable INTO ttc_nullable
  FROM information_schema.columns
  WHERE table_name = 'fin_facture_achat'
  AND column_name = 'montant_ttc';
  
  RAISE NOTICE 'État actuel des contraintes:';
  RAISE NOTICE '- montant_ht: %', CASE WHEN ht_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL autorisé' END;
  RAISE NOTICE '- montant_tva: %', CASE WHEN tva_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL autorisé' END;
  RAISE NOTICE '- montant_ttc: %', CASE WHEN ttc_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL autorisé' END;
  
  -- Mise à jour des valeurs NULL pour montant_ht si nécessaire
  IF ht_nullable = 'YES' THEN
    UPDATE fin_facture_achat
    SET montant_ht = 0
    WHERE montant_ht IS NULL;
    
    -- Ajouter la contrainte NOT NULL
    ALTER TABLE fin_facture_achat
    ALTER COLUMN montant_ht SET NOT NULL;
    
    RAISE NOTICE '✅ La colonne montant_ht a été mise à jour et est maintenant NOT NULL';
  END IF;
  
  -- Mise à jour des valeurs NULL pour montant_tva si nécessaire
  IF tva_nullable = 'YES' THEN
    UPDATE fin_facture_achat
    SET montant_tva = 0
    WHERE montant_tva IS NULL;
    
    -- Ajouter la contrainte NOT NULL
    ALTER TABLE fin_facture_achat
    ALTER COLUMN montant_tva SET NOT NULL;
    
    RAISE NOTICE '✅ La colonne montant_tva a été mise à jour et est maintenant NOT NULL';
  END IF;
  
  -- Mise à jour des valeurs NULL pour montant_ttc si nécessaire
  IF ttc_nullable = 'YES' THEN
    UPDATE fin_facture_achat
    SET montant_ttc = 0
    WHERE montant_ttc IS NULL;
    
    -- Ajouter la contrainte NOT NULL
    ALTER TABLE fin_facture_achat
    ALTER COLUMN montant_ttc SET NOT NULL;
    
    RAISE NOTICE '✅ La colonne montant_ttc a été mise à jour et est maintenant NOT NULL';
  END IF;
END $$;

-- Vérification finale
DO $$
DECLARE
  ht_nullable TEXT;
  tva_nullable TEXT;
  ttc_nullable TEXT;
BEGIN
  SELECT is_nullable INTO ht_nullable
  FROM information_schema.columns
  WHERE table_name = 'fin_facture_achat'
  AND column_name = 'montant_ht';
  
  SELECT is_nullable INTO tva_nullable
  FROM information_schema.columns
  WHERE table_name = 'fin_facture_achat'
  AND column_name = 'montant_tva';
  
  SELECT is_nullable INTO ttc_nullable
  FROM information_schema.columns
  WHERE table_name = 'fin_facture_achat'
  AND column_name = 'montant_ttc';
  
  IF ht_nullable = 'NO' AND tva_nullable = 'NO' AND ttc_nullable = 'NO' THEN
    RAISE NOTICE '✅ Vérification finale: tous les champs de montant sont correctement définis comme NOT NULL';
  ELSE
    RAISE WARNING '⚠️ Certains champs de montant ne sont pas correctement définis comme NOT NULL:';
    IF ht_nullable = 'YES' THEN RAISE WARNING '- montant_ht est toujours nullable'; END IF;
    IF tva_nullable = 'YES' THEN RAISE WARNING '- montant_tva est toujours nullable'; END IF;
    IF ttc_nullable = 'YES' THEN RAISE WARNING '- montant_ttc est toujours nullable'; END IF;
  END IF;
END $$;
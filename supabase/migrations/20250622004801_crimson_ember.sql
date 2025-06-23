/*
  # Ajout de la contrainte NOT NULL au champ montant_tva de la table fin_facture_achat

  1. Modifications
    - Modification de la colonne `montant_tva` pour la rendre NOT NULL
    
  2. Objectif
    - Assurer que toutes les factures ont un montant de TVA spécifié
    - Maintenir la cohérence des données financières
    - Simplifier les calculs et les rapports

  3. Impact
    - Les factures existantes avec montant_tva NULL devront être mises à jour
    - Les nouvelles factures devront obligatoirement spécifier un montant de TVA
*/

-- Étape 1: Mettre à jour les enregistrements existants avec montant_tva NULL
UPDATE fin_facture_achat
SET montant_tva = 0
WHERE montant_tva IS NULL;

-- Étape 2: Ajouter la contrainte NOT NULL
ALTER TABLE fin_facture_achat
ALTER COLUMN montant_tva SET NOT NULL;

-- Vérification finale
DO $$
DECLARE
  is_not_nullable BOOLEAN;
BEGIN
  SELECT is_nullable = 'NO'
  INTO is_not_nullable
  FROM information_schema.columns
  WHERE table_name = 'fin_facture_achat'
  AND column_name = 'montant_tva';
  
  IF is_not_nullable THEN
    RAISE NOTICE '✅ La colonne montant_tva est maintenant NOT NULL';
  ELSE
    RAISE WARNING '❌ Échec de la modification: la colonne montant_tva est toujours nullable';
  END IF;
END $$;
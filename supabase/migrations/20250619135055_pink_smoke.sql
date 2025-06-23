/*
  # Ajout des colonnes de traçabilité à bq_import_releves_brut_detail

  1. Nouvelles Colonnes
    - `traite` : VARCHAR(20), valeur par défaut 'A TRAITER'
      Indique l'état du traitement de la ligne d'import
      Valeurs possibles : 'A TRAITER', 'CREER', 'DOUBLON'
    
    - `id_bq_mouvement` : BIGINT, référence vers bq_ecriture_bancaire(id)
      Permet de lier la ligne d'import à l'écriture bancaire correspondante

  2. Objectif
    - Assurer la traçabilité du traitement des relevés bancaires importés
    - Permettre de suivre quelles lignes ont été traitées et comment
    - Faciliter la réconciliation entre les imports bruts et les écritures validées

  3. Impact
    - Les enregistrements existants auront par défaut le statut 'A TRAITER'
    - La référence vers bq_ecriture_bancaire sera NULL pour les lignes non traitées
*/

-- Ajout des colonnes à la table bq_import_releves_brut_detail
ALTER TABLE bq_import_releves_brut_detail 
ADD COLUMN traite VARCHAR(20) DEFAULT 'A TRAITER',
ADD COLUMN id_bq_mouvement BIGINT REFERENCES bq_ecriture_bancaire(id) ON DELETE SET NULL;

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_bq_import_releves_brut_detail_traite 
  ON bq_import_releves_brut_detail(traite);

CREATE INDEX IF NOT EXISTS idx_bq_import_releves_brut_detail_id_bq_mouvement 
  ON bq_import_releves_brut_detail(id_bq_mouvement);

-- Vérification finale
DO $$
DECLARE
  columns_exist BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bq_import_releves_brut_detail' 
    AND column_name IN ('traite', 'id_bq_mouvement')
    GROUP BY table_name
    HAVING COUNT(*) = 2
  ) INTO columns_exist;
  
  IF columns_exist THEN
    RAISE NOTICE '✅ Les colonnes traite et id_bq_mouvement ont été ajoutées avec succès à la table bq_import_releves_brut_detail';
  ELSE
    RAISE WARNING '❌ Échec de l''ajout des colonnes à la table bq_import_releves_brut_detail';
  END IF;
END $$;
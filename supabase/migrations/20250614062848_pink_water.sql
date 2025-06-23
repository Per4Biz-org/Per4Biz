/*
  # Renommage de la table fin_bq_compte_bancaire en bq_compte_bancaire

  1. Modifications
    - Renommage de la table `fin_bq_compte_bancaire` en `bq_compte_bancaire`
    - Renommage de tous les index associés
    - Renommage de toutes les contraintes (clé primaire, clés étrangères, contraintes d'unicité)
    - Mise à jour des politiques RLS et des triggers

  2. Objectif
    - Harmoniser la nomenclature des tables bancaires avec le préfixe 'bq_'
    - Maintenir la cohérence avec les autres tables du module bancaire
    - Simplifier la structure de nommage en supprimant le préfixe 'fin_' redondant
*/

-- Renommer la table
ALTER TABLE fin_bq_compte_bancaire RENAME TO bq_compte_bancaire;

-- Vérifier et renommer les index s'ils existent
DO $$
BEGIN
    -- Renommer l'index de clé primaire
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fin_bq_compte_bancaire_pkey') THEN
        ALTER INDEX fin_bq_compte_bancaire_pkey RENAME TO bq_compte_bancaire_pkey;
    END IF;
    
    -- Renommer l'index unique sur code
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fin_bq_compte_bancaire_code_key') THEN
        ALTER INDEX fin_bq_compte_bancaire_code_key RENAME TO bq_compte_bancaire_code_key;
    END IF;
END $$;

-- Vérifier et renommer les contraintes s'elles existent
DO $$
BEGIN
    -- Renommer la contrainte de clé primaire
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_bq_compte_bancaire_pkey' 
               AND table_name = 'bq_compte_bancaire') THEN
        ALTER TABLE bq_compte_bancaire RENAME CONSTRAINT fin_bq_compte_bancaire_pkey TO bq_compte_bancaire_pkey;
    END IF;
    
    -- Renommer la contrainte unique sur code
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_bq_compte_bancaire_code_key' 
               AND table_name = 'bq_compte_bancaire') THEN
        ALTER TABLE bq_compte_bancaire RENAME CONSTRAINT fin_bq_compte_bancaire_code_key TO bq_compte_bancaire_code_key;
    END IF;
    
    -- Renommer les contraintes de clé étrangère
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_bq_compte_bancaire_com_contrat_client_id_fkey' 
               AND table_name = 'bq_compte_bancaire') THEN
        ALTER TABLE bq_compte_bancaire RENAME CONSTRAINT fin_bq_compte_bancaire_com_contrat_client_id_fkey TO bq_compte_bancaire_com_contrat_client_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_bq_compte_bancaire_id_entite_fkey' 
               AND table_name = 'bq_compte_bancaire') THEN
        ALTER TABLE bq_compte_bancaire RENAME CONSTRAINT fin_bq_compte_bancaire_id_entite_fkey TO bq_compte_bancaire_id_entite_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_bq_compte_bancaire_created_by_fkey' 
               AND table_name = 'bq_compte_bancaire') THEN
        ALTER TABLE bq_compte_bancaire RENAME CONSTRAINT fin_bq_compte_bancaire_created_by_fkey TO bq_compte_bancaire_created_by_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_bq_compte_bancaire_updated_by_fkey' 
               AND table_name = 'bq_compte_bancaire') THEN
        ALTER TABLE bq_compte_bancaire RENAME CONSTRAINT fin_bq_compte_bancaire_updated_by_fkey TO bq_compte_bancaire_updated_by_fkey;
    END IF;
END $$;

-- Supprimer les anciennes politiques RLS
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent lire les comptes bancaires" ON bq_compte_bancaire;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent modifier les comptes bancaires" ON bq_compte_bancaire;

-- Recréer les politiques RLS avec les nouveaux noms
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les comptes bancaires"
  ON bq_compte_bancaire
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les comptes bancaires"
  ON bq_compte_bancaire
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Renommer le trigger de mise à jour de updated_at
DROP TRIGGER IF EXISTS update_fin_bq_compte_bancaire_updated_at ON bq_compte_bancaire;
CREATE TRIGGER update_bq_compte_bancaire_updated_at
  BEFORE UPDATE ON bq_compte_bancaire
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Vérification finale
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'bq_compte_bancaire'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table fin_bq_compte_bancaire a été renommée avec succès en bq_compte_bancaire';
  ELSE
    RAISE WARNING '❌ Échec du renommage de la table fin_bq_compte_bancaire';
  END IF;
END $$;
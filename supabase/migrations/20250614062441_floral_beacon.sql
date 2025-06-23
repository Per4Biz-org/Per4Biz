/*
  # Renommage de la table fin_compte_bancaire en fin_bq_compte_bancaire

  1. Renommage de table
    - Renommer `fin_compte_bancaire` en `fin_bq_compte_bancaire`
    - Renommer tous les index et contraintes associés
    - Mettre à jour les clés étrangères qui référencent cette table
    - Recréer les politiques RLS avec les nouveaux noms

  2. Objectif
    - Harmoniser la nomenclature des tables bancaires avec le préfixe 'bq'
    - Maintenir la cohérence avec les autres tables du module bancaire
    - Faciliter l'identification des tables par module

  3. Impact
    - Toutes les fonctionnalités existantes sont préservées
    - Les données sont conservées
    - Les relations sont maintenues
*/

-- Renommer la table
ALTER TABLE fin_compte_bancaire RENAME TO fin_bq_compte_bancaire;

-- Vérifier et renommer les index s'ils existent
DO $$
BEGIN
    -- Renommer l'index de clé primaire
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fin_compte_bancaire_pkey') THEN
        ALTER INDEX fin_compte_bancaire_pkey RENAME TO fin_bq_compte_bancaire_pkey;
    END IF;
    
    -- Renommer l'index unique sur code
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'fin_compte_bancaire_code_key') THEN
        ALTER INDEX fin_compte_bancaire_code_key RENAME TO fin_bq_compte_bancaire_code_key;
    END IF;
END $$;

-- Vérifier et renommer les contraintes s'elles existent
DO $$
BEGIN
    -- Renommer la contrainte de clé primaire
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_compte_bancaire_pkey' 
               AND table_name = 'fin_bq_compte_bancaire') THEN
        ALTER TABLE fin_bq_compte_bancaire RENAME CONSTRAINT fin_compte_bancaire_pkey TO fin_bq_compte_bancaire_pkey;
    END IF;
    
    -- Renommer la contrainte unique sur code
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_compte_bancaire_code_key' 
               AND table_name = 'fin_bq_compte_bancaire') THEN
        ALTER TABLE fin_bq_compte_bancaire RENAME CONSTRAINT fin_compte_bancaire_code_key TO fin_bq_compte_bancaire_code_key;
    END IF;
    
    -- Renommer les contraintes de clé étrangère
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_compte_bancaire_com_contrat_client_id_fkey' 
               AND table_name = 'fin_bq_compte_bancaire') THEN
        ALTER TABLE fin_bq_compte_bancaire RENAME CONSTRAINT fin_compte_bancaire_com_contrat_client_id_fkey TO fin_bq_compte_bancaire_com_contrat_client_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_compte_bancaire_id_entite_fkey' 
               AND table_name = 'fin_bq_compte_bancaire') THEN
        ALTER TABLE fin_bq_compte_bancaire RENAME CONSTRAINT fin_compte_bancaire_id_entite_fkey TO fin_bq_compte_bancaire_id_entite_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_compte_bancaire_created_by_fkey' 
               AND table_name = 'fin_bq_compte_bancaire') THEN
        ALTER TABLE fin_bq_compte_bancaire RENAME CONSTRAINT fin_compte_bancaire_created_by_fkey TO fin_bq_compte_bancaire_created_by_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fin_compte_bancaire_updated_by_fkey' 
               AND table_name = 'fin_bq_compte_bancaire') THEN
        ALTER TABLE fin_bq_compte_bancaire RENAME CONSTRAINT fin_compte_bancaire_updated_by_fkey TO fin_bq_compte_bancaire_updated_by_fkey;
    END IF;
END $$;

-- Supprimer les anciennes politiques RLS
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent lire les comptes bancair" ON fin_bq_compte_bancaire;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent modifier les comptes ban" ON fin_bq_compte_bancaire;

-- Recréer les politiques RLS avec les nouveaux noms
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les comptes bancaires"
  ON fin_bq_compte_bancaire
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les comptes bancaires"
  ON fin_bq_compte_bancaire
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Renommer le trigger de mise à jour de updated_at
DROP TRIGGER IF EXISTS update_fin_compte_bancaire_updated_at ON fin_bq_compte_bancaire;
CREATE TRIGGER update_fin_bq_compte_bancaire_updated_at
  BEFORE UPDATE ON fin_bq_compte_bancaire
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
    WHERE table_name = 'fin_bq_compte_bancaire'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table fin_compte_bancaire a été renommée avec succès en fin_bq_compte_bancaire';
  ELSE
    RAISE WARNING '❌ Échec du renommage de la table fin_compte_bancaire';
  END IF;
END $$;
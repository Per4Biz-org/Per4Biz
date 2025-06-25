/*
  # Ajout des champs code_court et matricule à la table rh_personnel

  1. Nouvelles Colonnes
    - `code_court` : varchar(12), obligatoire, unique par contrat client
      Permet d'identifier un salarié dans les tableaux de liste
    - `matricule` : varchar(12), obligatoire, unique par contrat client
      Permet d'identifier un salarié dans les tableaux de liste

  2. Contraintes
    - Contrainte d'unicité sur (com_contrat_client_id, code_court)
    - Contrainte d'unicité sur (com_contrat_client_id, matricule)
    - Contraintes NOT NULL sur les deux champs

  3. Index
    - Index sur (com_contrat_client_id, code_court) pour optimiser les recherches
    - Index sur (com_contrat_client_id, matricule) pour optimiser les recherches
*/

-- Étape 1: Ajouter les colonnes (d'abord nullable pour permettre la mise à jour des données existantes)
ALTER TABLE rh_personnel 
ADD COLUMN code_court varchar(12),
ADD COLUMN matricule varchar(12);

-- Étape 2: Mettre à jour les enregistrements existants avec des valeurs par défaut
UPDATE rh_personnel 
SET 
  code_court = 'EMP' || SUBSTRING(id::text, 1, 8),
  matricule = 'MAT' || SUBSTRING(id::text, 1, 8)
WHERE code_court IS NULL OR matricule IS NULL;

-- Étape 3: Rendre les colonnes NOT NULL
ALTER TABLE rh_personnel 
ALTER COLUMN code_court SET NOT NULL,
ALTER COLUMN matricule SET NOT NULL;

-- Étape 4: Ajouter les contraintes d'unicité
ALTER TABLE rh_personnel 
ADD CONSTRAINT rh_personnel_com_contrat_client_id_code_court_key UNIQUE (com_contrat_client_id, code_court),
ADD CONSTRAINT rh_personnel_com_contrat_client_id_matricule_key UNIQUE (com_contrat_client_id, matricule);

-- Étape 5: Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_rh_personnel_code_court 
  ON rh_personnel(com_contrat_client_id, code_court);

CREATE INDEX IF NOT EXISTS idx_rh_personnel_matricule 
  ON rh_personnel(com_contrat_client_id, matricule);

-- Vérification finale
DO $$
DECLARE
  columns_exist BOOLEAN;
  constraints_exist BOOLEAN;
BEGIN
  -- Vérifier que les colonnes existent et sont NOT NULL
  SELECT COUNT(*) = 2
  INTO columns_exist
  FROM information_schema.columns
  WHERE table_name = 'rh_personnel'
  AND column_name IN ('code_court', 'matricule')
  AND is_nullable = 'NO';
  
  -- Vérifier que les contraintes d'unicité existent
  SELECT COUNT(*) = 2
  INTO constraints_exist
  FROM information_schema.table_constraints
  WHERE table_name = 'rh_personnel'
  AND constraint_name IN (
    'rh_personnel_com_contrat_client_id_code_court_key',
    'rh_personnel_com_contrat_client_id_matricule_key'
  );
  
  IF columns_exist AND constraints_exist THEN
    RAISE NOTICE '✅ Les colonnes code_court et matricule ont été ajoutées avec succès à la table rh_personnel';
  ELSE
    IF NOT columns_exist THEN
      RAISE WARNING '❌ Les colonnes code_court et/ou matricule n''ont pas été correctement ajoutées ou définies comme NOT NULL';
    END IF;
    
    IF NOT constraints_exist THEN
      RAISE WARNING '❌ Les contraintes d''unicité n''ont pas été correctement ajoutées';
    END IF;
  END IF;
END $$;
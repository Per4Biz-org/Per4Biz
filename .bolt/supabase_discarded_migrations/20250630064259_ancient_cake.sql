/*
  # Refonte des tables de flux financiers pour gestion multi-entité

  1. Modifications structurelles
    - Rendre `id_entite` NULLABLE dans les tables `fin_flux_nature` et `fin_flux_categorie`
    - Remplacer les contraintes d'unicité existantes par des contraintes sur (com_contrat_client_id, id_entite, code)
    - Créer des index optimisés pour les recherches

  2. Objectifs
    - Permettre de définir des flux au niveau du contrat client (id_entite NULL)
    - Permettre des exceptions spécifiques pour certaines entités (id_entite renseigné)
    - Maintenir la cohérence et l'unicité des données
*/

-- 1. Modifications pour la table fin_flux_nature

-- Rendre la colonne id_entite NULLABLE
ALTER TABLE public.fin_flux_nature
ALTER COLUMN id_entite DROP NOT NULL;

-- Supprimer l'ancienne contrainte d'unicité sur (id_entite, code)
ALTER TABLE public.fin_flux_nature
DROP CONSTRAINT IF EXISTS fin_flux_nature_id_entite_code_key;

-- Ajouter la nouvelle contrainte d'unicité sur (com_contrat_client_id, id_entite, code)
-- Dans PostgreSQL, une contrainte UNIQUE traite les valeurs NULL comme distinctes.
-- Cela signifie que vous pouvez avoir plusieurs lignes avec id_entite NULL,
-- tant que la combinaison (com_contrat_client_id, NULL, code) est unique.
ALTER TABLE public.fin_flux_nature
ADD CONSTRAINT fin_flux_nature_unique_contract_entity_code UNIQUE (com_contrat_client_id, id_entite, code);

-- Créer un index explicite pour la nouvelle contrainte d'unicité
CREATE INDEX IF NOT EXISTS idx_fin_flux_nature_contract_entity_code
ON public.fin_flux_nature USING btree (com_contrat_client_id, id_entite, code);

-- Créer un index supplémentaire pour les recherches par entité et code
CREATE INDEX IF NOT EXISTS idx_fin_flux_nature_id_entite_code
ON public.fin_flux_nature USING btree (id_entite, code);


-- 2. Modifications pour la table fin_flux_categorie

-- Rendre la colonne id_entite NULLABLE
ALTER TABLE public.fin_flux_categorie
ALTER COLUMN id_entite DROP NOT NULL;

-- Supprimer l'ancienne contrainte d'unicité sur (id_entite, code)
ALTER TABLE public.fin_flux_categorie
DROP CONSTRAINT IF EXISTS fin_flux_categorie_id_entite_code_key;

-- Ajouter la nouvelle contrainte d'unicité sur (com_contrat_client_id, id_entite, code)
ALTER TABLE public.fin_flux_categorie
ADD CONSTRAINT fin_flux_categorie_unique_contract_entity_code UNIQUE (com_contrat_client_id, id_entite, code);

-- Créer un index explicite pour la nouvelle contrainte d'unicité
CREATE INDEX IF NOT EXISTS idx_fin_flux_categorie_contract_entity_code
ON public.fin_flux_categorie USING btree (com_contrat_client_id, id_entite, code);

-- Créer un index supplémentaire pour les recherches par entité et code
CREATE INDEX IF NOT EXISTS idx_fin_flux_categorie_id_entite_code
ON public.fin_flux_categorie USING btree (id_entite, code);


-- 3. Vérification de la table fin_flux_sous_categorie
-- Aucune modification structurelle n'est nécessaire pour cette table
-- car elle est déjà liée via id_categorie et com_contrat_client_id.
-- La contrainte d'unicité existante sur (id_categorie, code) est déjà conforme aux exigences.

-- Note: Les triggers existants (prevent_created_by_update_trigger, set_updated_by_trigger, etc.)
-- sont déjà en place et n'ont pas besoin d'être recréés après les opérations ALTER TABLE.
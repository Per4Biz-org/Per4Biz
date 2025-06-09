/*
  # Ajout du champ id_entite à la table fin_flux_categorie

  1. Modifications
    - Ajout d'un champ `id_entite` de type uuid NOT NULL
    - Création d'une clé étrangère vers la table com_entite
    - Mise à jour des politiques existantes pour maintenir la cohérence

  2. Notes
    - Le champ est obligatoire (NOT NULL)
    - La suppression d'une entité est restreinte si elle est référencée par une catégorie de flux
    - Les politiques RLS existantes sont maintenues pour garantir l'isolation des données par contrat client
*/

-- Ajout de la colonne avec contrainte NOT NULL
ALTER TABLE fin_flux_categorie 
ADD COLUMN id_entite uuid NOT NULL REFERENCES com_entite(id) ON DELETE RESTRICT;

-- Mise à jour des politiques existantes
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les catégories de flux de leur contrat" ON fin_flux_categorie;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des catégories de flux pour leur contrat" ON fin_flux_categorie;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier les catégories de flux de leur contrat" ON fin_flux_categorie;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer les catégories de flux de leur contrat" ON fin_flux_categorie;

-- Recréation des politiques
CREATE POLICY "Les utilisateurs peuvent lire les catégories de flux de leur contrat"
  ON fin_flux_categorie
  FOR SELECT
  TO authenticated
  USING (
    com_contrat_client_id = (
      SELECT com_contrat_client_id 
      FROM com_profil 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Les utilisateurs peuvent créer des catégories de flux pour leur contrat"
  ON fin_flux_categorie
  FOR INSERT
  TO authenticated
  WITH CHECK (
    com_contrat_client_id = (
      SELECT com_contrat_client_id 
      FROM com_profil 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Les utilisateurs peuvent modifier les catégories de flux de leur contrat"
  ON fin_flux_categorie
  FOR UPDATE
  TO authenticated
  USING (
    com_contrat_client_id = (
      SELECT com_contrat_client_id 
      FROM com_profil 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    com_contrat_client_id = (
      SELECT com_contrat_client_id 
      FROM com_profil 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Les utilisateurs peuvent supprimer les catégories de flux de leur contrat"
  ON fin_flux_categorie
  FOR DELETE
  TO authenticated
  USING (
    com_contrat_client_id = (
      SELECT com_contrat_client_id 
      FROM com_profil 
      WHERE user_id = auth.uid()
    )
  );
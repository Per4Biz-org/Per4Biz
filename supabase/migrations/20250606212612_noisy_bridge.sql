/*
  # Création de la table fin_flux_sous_categorie

  1. Nouvelle Table
    - `fin_flux_sous_categorie`
      - `id` : uuid, clé primaire, générée automatiquement
      - `com_contrat_client_id` : uuid, obligatoire, clé étrangère vers `com_contrat_client(id)`
      - `id_categorie` : uuid, obligatoire, clé étrangère vers `fin_flux_categorie(id)`
      - `code` : texte, requis, code court unique par contrat
      - `libelle` : texte, requis, libellé lisible
      - `description` : texte, optionnel
      - `ordre_affichage` : entier, défaut = 0
      - `actif` : booléen, défaut = true
      - `created_at` : timestamp, défaut = now()

  2. Contraintes
    - Clé primaire sur id
    - Contrainte d'unicité sur (com_contrat_client_id, code)
    - Clés étrangères vers com_contrat_client et fin_flux_categorie
    - Suppression restreinte pour préserver l'intégrité

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - SELECT, INSERT, UPDATE, DELETE avec filtrage par contrat client
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS fin_flux_sous_categorie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  id_categorie uuid NOT NULL REFERENCES fin_flux_categorie(id) ON DELETE RESTRICT,
  code text NOT NULL,
  libelle text NOT NULL,
  description text,
  ordre_affichage integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  -- Contrainte d'unicité du code par contrat
  UNIQUE(com_contrat_client_id, code)
);

-- Activation de la sécurité RLS
ALTER TABLE fin_flux_sous_categorie ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : autoriser uniquement si com_contrat_client_id correspond à celui du profil
CREATE POLICY "Les utilisateurs peuvent lire les sous-catégories de flux de leur contrat"
  ON fin_flux_sous_categorie
  FOR SELECT
  TO authenticated
  USING (
    com_contrat_client_id = (
      SELECT com_contrat_client_id 
      FROM com_profil 
      WHERE user_id = auth.uid()
    )
  );

-- Politique d'insertion : autoriser uniquement si la valeur de com_contrat_client_id correspond à celle du profil
CREATE POLICY "Les utilisateurs peuvent créer des sous-catégories de flux pour leur contrat"
  ON fin_flux_sous_categorie
  FOR INSERT
  TO authenticated
  WITH CHECK (
    com_contrat_client_id = (
      SELECT com_contrat_client_id 
      FROM com_profil 
      WHERE user_id = auth.uid()
    )
  );

-- Politique de mise à jour : même filtre que SELECT
CREATE POLICY "Les utilisateurs peuvent modifier les sous-catégories de flux de leur contrat"
  ON fin_flux_sous_categorie
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

-- Politique de suppression : même filtre que SELECT
CREATE POLICY "Les utilisateurs peuvent supprimer les sous-catégories de flux de leur contrat"
  ON fin_flux_sous_categorie
  FOR DELETE
  TO authenticated
  USING (
    com_contrat_client_id = (
      SELECT com_contrat_client_id 
      FROM com_profil 
      WHERE user_id = auth.uid()
    )
  );
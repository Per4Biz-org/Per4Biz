/*
  # Création de la table ca_type_service

  1. Nouvelle Table
    - `ca_type_service`
      - `id` (uuid, clé primaire, générée automatiquement)
      - `com_contrat_client_id` (uuid, obligatoire, FK vers com_contrat_client)
      - `id_entite` (uuid, obligatoire, FK vers com_entite)
      - `code` (text, requis, ex: 'petit_dej')
      - `libelle` (text, requis, ex: 'Petit-déjeuner')
      - `description` (text, optionnel)
      - `ordre_affichage` (integer, défaut 0)
      - `actif` (boolean, défaut true)
      - `created_at` (timestamptz, défaut now())
      - `updated_at` (timestamptz, défaut now())
      - `created_by` (uuid, défaut auth.uid())
      - `updated_by` (uuid)

  2. Contraintes
    - Clé primaire sur id
    - Contrainte d'unicité sur (id_entite, code)
    - Clés étrangères vers com_contrat_client et com_entite
    - Suppression restreinte pour préserver l'intégrité

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Triggers
    - Triggers pour la mise à jour automatique des champs d'audit
    - Protection du champ created_by contre les modifications

  5. Index
    - Index sur les clés étrangères pour optimiser les performances
    - Index sur les champs de recherche fréquents
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS ca_type_service (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  id_entite uuid NOT NULL REFERENCES com_entite(id) ON DELETE RESTRICT,
  code text NOT NULL,
  libelle text NOT NULL,
  description text,
  ordre_affichage integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contrainte d'unicité sur (id_entite, code)
  UNIQUE(id_entite, code)
);

-- Activation de la sécurité RLS
ALTER TABLE ca_type_service ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour ca_type_service
CREATE POLICY "Les utilisateurs peuvent créer des types de service pour leur contrat"
  ON ca_type_service
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les types de service de leur contrat"
  ON ca_type_service
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les types de service de leur contrat"
  ON ca_type_service
  FOR UPDATE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ))
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent supprimer les types de service de leur contrat"
  ON ca_type_service
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON ca_type_service
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON ca_type_service
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_ca_type_service_updated_at
  BEFORE UPDATE ON ca_type_service
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_ca_type_service_com_contrat_client_id 
  ON ca_type_service(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_ca_type_service_id_entite 
  ON ca_type_service(id_entite);

CREATE INDEX IF NOT EXISTS idx_ca_type_service_code 
  ON ca_type_service(code);

CREATE INDEX IF NOT EXISTS idx_ca_type_service_id_entite_code 
  ON ca_type_service(id_entite, code);

CREATE INDEX IF NOT EXISTS idx_ca_type_service_ordre_affichage 
  ON ca_type_service(ordre_affichage);

CREATE INDEX IF NOT EXISTS idx_ca_type_service_actif 
  ON ca_type_service(actif);
/*
  # Création de la table ca_param_jours_ouverture

  1. Nouvelle Table
    - `ca_param_jours_ouverture`
      - `id` : bigint, clé primaire générée automatiquement
      - `com_contrat_client_id` : uuid, obligatoire, FK vers com_contrat_client
      - `id_entite` : uuid, obligatoire, FK vers com_entite
      - `annee` : integer, obligatoire
      - `mois` : integer, obligatoire (entre 1 et 12)
      - `nb_jours_ouverts` : integer, obligatoire (entre 0 et 31)
      - `taux_mp_prevu` : numeric(5,2), optionnel, pourcentage prévu de MP
      - `commentaire` : text, optionnel
      - Champs d'audit (created_at, updated_at, created_by, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Contrainte d'unicité sur (id_entite, annee, mois)
    - Contrainte CHECK sur mois (entre 1 et 12)
    - Contrainte CHECK sur nb_jours_ouverts (entre 0 et 31)
    - Clés étrangères vers com_contrat_client et com_entite

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Index
    - Index sur les clés étrangères pour optimiser les performances
    - Index sur la contrainte d'unicité
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS ca_param_jours_ouverture (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  id_entite uuid NOT NULL REFERENCES com_entite(id) ON DELETE RESTRICT,
  annee integer NOT NULL,
  mois integer NOT NULL CHECK (mois BETWEEN 1 AND 12),
  nb_jours_ouverts integer NOT NULL CHECK (nb_jours_ouverts >= 0 AND nb_jours_ouverts <= 31),
  taux_mp_prevu numeric(5,2), -- pourcentage prévu de MP
  commentaire text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contrainte d'unicité sur (id_entite, annee, mois)
  UNIQUE(id_entite, annee, mois)
);

-- Activation de la sécurité RLS
ALTER TABLE ca_param_jours_ouverture ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour ca_param_jours_ouverture
CREATE POLICY "Les utilisateurs peuvent créer des paramètres de jours pour leur contrat"
  ON ca_param_jours_ouverture
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les paramètres de jours de leur contrat"
  ON ca_param_jours_ouverture
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les paramètres de jours de leur contrat"
  ON ca_param_jours_ouverture
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

CREATE POLICY "Les utilisateurs peuvent supprimer les paramètres de jours de leur contrat"
  ON ca_param_jours_ouverture
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON ca_param_jours_ouverture
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON ca_param_jours_ouverture
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_ca_param_jours_ouverture_updated_at
  BEFORE UPDATE ON ca_param_jours_ouverture
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_ca_param_jours_ouverture_com_contrat_client_id 
  ON ca_param_jours_ouverture(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_ca_param_jours_ouverture_id_entite 
  ON ca_param_jours_ouverture(id_entite);

CREATE INDEX IF NOT EXISTS idx_ca_param_jours_ouverture_annee_mois 
  ON ca_param_jours_ouverture(annee, mois);

CREATE INDEX IF NOT EXISTS idx_ca_param_jours_ouverture_entite_annee_mois 
  ON ca_param_jours_ouverture(id_entite, annee, mois);
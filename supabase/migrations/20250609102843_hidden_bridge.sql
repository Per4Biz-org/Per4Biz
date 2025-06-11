/*
  # Création de la table fin_facture_achat

  1. Nouvelle Table
    - `fin_facture_achat`
      - `id` (uuid, clé primaire, générée automatiquement)
      - `com_contrat_client_id` (uuid, obligatoire, FK vers com_contrat_client)
      - `id_entite` (uuid, obligatoire, FK vers com_entite)
      - `code_user` (text, requis, code utilisateur du créateur)
      - `num_document` (text, requis, identifiant libre ou numéro de facture)
      - `date_facture` (date, requis)
      - `montant_ht` (numeric, requis)
      - `montant_tva` (numeric, facultatif)
      - `montant_ttc` (numeric, requis)
      - `id_tiers` (uuid, obligatoire, FK vers com_tiers)
      - `id_mode_paiement` (uuid, obligatoire, FK vers bq_param_mode_paiement)
      - `lien_piece_jointe` (text, facultatif, chemin dans le bucket Supabase)
      - `commentaire` (text, facultatif)
      - `created_at` (timestamptz, défaut now())

  2. Contraintes
    - Clé primaire sur id
    - Clés étrangères vers toutes les tables référencées
    - Suppression restreinte pour préserver l'intégrité
    - Contraintes NOT NULL sur les champs obligatoires

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Index
    - Index sur les clés étrangères pour optimiser les performances
    - Index sur les champs de recherche fréquents
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS fin_facture_achat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  id_entite uuid NOT NULL REFERENCES com_entite(id) ON DELETE RESTRICT,
  code_user text NOT NULL,
  num_document text NOT NULL,
  date_facture date NOT NULL,
  montant_ht numeric NOT NULL,
  montant_tva numeric,
  montant_ttc numeric NOT NULL,
  id_tiers uuid NOT NULL REFERENCES com_tiers(id) ON DELETE RESTRICT,
  id_mode_paiement uuid NOT NULL REFERENCES bq_param_mode_paiement(id) ON DELETE RESTRICT,
  lien_piece_jointe text,
  commentaire text,
  created_at timestamptz DEFAULT now()
);

-- Activation de la sécurité RLS
ALTER TABLE fin_facture_achat ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour fin_facture_achat
CREATE POLICY "Les utilisateurs peuvent créer des factures d'achat pour leur contrat"
  ON fin_facture_achat
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les factures d'achat de leur contrat"
  ON fin_facture_achat
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les factures d'achat de leur contrat"
  ON fin_facture_achat
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

CREATE POLICY "Les utilisateurs peuvent supprimer les factures d'achat de leur contrat"
  ON fin_facture_achat
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_com_contrat_client_id 
  ON fin_facture_achat(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_id_entite 
  ON fin_facture_achat(id_entite);

CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_id_tiers 
  ON fin_facture_achat(id_tiers);

CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_id_mode_paiement 
  ON fin_facture_achat(id_mode_paiement);

CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_date_facture 
  ON fin_facture_achat(date_facture);

CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_num_document 
  ON fin_facture_achat(num_document);

CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_code_user 
  ON fin_facture_achat(code_user);
/*
  # Création de la table fin_facture_achat_ligne

  1. Nouvelle Table
    - `fin_facture_achat_ligne`
      - `id` : UUID, clé primaire générée automatiquement
      - `id_facture_achat` : UUID, obligatoire, FK vers fin_facture_achat(id), ON DELETE CASCADE
      - `com_contrat_client_id` : UUID, obligatoire, FK vers com_contrat_client(id), ON DELETE RESTRICT
      - `code_user` : Text, obligatoire, code utilisateur du créateur
      - `id_categorie_flux` : UUID, obligatoire, FK vers fin_flux_categorie(id)
      - `id_sous_categorie_flux` : UUID, obligatoire, FK vers fin_flux_sous_categorie(id)
      - `montant_ht` : Numeric, obligatoire
      - `montant_tva` : Numeric, facultatif
      - `commentaire` : Text, facultatif
      - `created_at` : Timestamptz, défaut now()

  2. Contraintes
    - Clé primaire sur id
    - Clés étrangères avec contraintes d'intégrité appropriées
    - CASCADE pour la suppression de la facture parente
    - RESTRICT pour les autres références

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Index
    - Index sur les clés étrangères pour optimiser les performances
    - Index sur les champs de recherche fréquents
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS fin_facture_achat_ligne (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_facture_achat uuid NOT NULL REFERENCES fin_facture_achat(id) ON DELETE CASCADE,
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  code_user text NOT NULL,
  id_categorie_flux uuid NOT NULL REFERENCES fin_flux_categorie(id) ON DELETE RESTRICT,
  id_sous_categorie_flux uuid NOT NULL REFERENCES fin_flux_sous_categorie(id) ON DELETE RESTRICT,
  montant_ht numeric NOT NULL,
  montant_tva numeric,
  commentaire text,
  created_at timestamptz DEFAULT now()
);

-- Activation de la sécurité RLS
ALTER TABLE fin_facture_achat_ligne ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour fin_facture_achat_ligne
CREATE POLICY "Les utilisateurs peuvent créer des lignes de facture d'achat pour leur contrat"
  ON fin_facture_achat_ligne
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les lignes de facture d'achat de leur contrat"
  ON fin_facture_achat_ligne
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les lignes de facture d'achat de leur contrat"
  ON fin_facture_achat_ligne
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

CREATE POLICY "Les utilisateurs peuvent supprimer les lignes de facture d'achat de leur contrat"
  ON fin_facture_achat_ligne
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_ligne_id_facture_achat 
  ON fin_facture_achat_ligne(id_facture_achat);

CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_ligne_com_contrat_client_id 
  ON fin_facture_achat_ligne(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_ligne_id_categorie_flux 
  ON fin_facture_achat_ligne(id_categorie_flux);

CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_ligne_id_sous_categorie_flux 
  ON fin_facture_achat_ligne(id_sous_categorie_flux);

CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_ligne_code_user 
  ON fin_facture_achat_ligne(code_user);

CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_ligne_created_at 
  ON fin_facture_achat_ligne(created_at);
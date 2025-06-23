/*
  # Création de la table fin_ferm_facturedepenses

  1. Nouvelle Table
    - `fin_ferm_facturedepenses`
      - `id` : bigserial, clé primaire
      - `com_contrat_client_id` : uuid, obligatoire, FK vers com_contrat_client(id)
      - `fin_ferm_caisse_id` : bigint, obligatoire, FK vers fin_ferm_caisse(id)
      - `fin_facture_achat_id` : uuid, obligatoire, FK vers fin_facture_achat(id)
      - `montant_ttc` : numeric(12,2), obligatoire
      - `commentaire` : text, optionnel
      - Champs d'audit (created_at, created_by, updated_at, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Clé étrangère vers com_contrat_client avec ON DELETE CASCADE
    - Clé étrangère vers fin_ferm_caisse avec ON DELETE CASCADE
    - Clé étrangère vers fin_facture_achat avec ON DELETE RESTRICT
    - Contraintes NOT NULL sur les champs obligatoires

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS fin_ferm_facturedepenses (
  id bigserial primary key,
  com_contrat_client_id uuid not null references com_contrat_client(id) on delete cascade,
  fin_ferm_caisse_id bigint not null references fin_ferm_caisse(id) on delete cascade,
  fin_facture_achat_id uuid not null references fin_facture_achat(id) on delete restrict,

  montant_ttc numeric(12,2) not null,
  commentaire text,

  created_at timestamp with time zone default now(),
  created_by uuid references auth.users(id),
  updated_at timestamp with time zone,
  updated_by uuid references auth.users(id)
);

-- Activation de la sécurité RLS
ALTER TABLE fin_ferm_facturedepenses ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour fin_ferm_facturedepenses
CREATE POLICY "Les utilisateurs peuvent créer des factures de dépenses pour leur contrat"
  ON fin_ferm_facturedepenses
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les factures de dépenses de leur contrat"
  ON fin_ferm_facturedepenses
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les factures de dépenses de leur contrat"
  ON fin_ferm_facturedepenses
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

CREATE POLICY "Les utilisateurs peuvent supprimer les factures de dépenses de leur contrat"
  ON fin_ferm_facturedepenses
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Vérification finale
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'fin_ferm_facturedepenses'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table fin_ferm_facturedepenses a été créée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la création de la table fin_ferm_facturedepenses';
  END IF;
END $$;
/*
  # Création de la table fin_ferm_caisse

  1. Nouvelle Table
    - `fin_ferm_caisse`
      - `id` : bigint, clé primaire générée automatiquement
      - `com_contrat_client_id` : uuid, obligatoire, FK vers com_contrat_client
      - `id_entite` : uuid, obligatoire, FK vers com_entite
      - `date_fermeture` : date, obligatoire
      - `heure_fermeture` : time, obligatoire
      - Montants de caisse et dépôts bancaires
      - Totaux CB et factures
      - Chiffre d'affaires HT et TTC
      - Statut de validation et commentaire
      - Champs d'audit (created_at, created_by, updated_at, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Clés étrangères vers com_contrat_client et com_entite
    - Suppression restreinte pour préserver l'intégrité

  3. Sécurité
    - Activation de RLS
    - Politiques basées sur la correspondance du com_contrat_client_id avec le profil utilisateur
    - CRUD complet pour les utilisateurs authentifiés sur leurs données

  4. Index
    - Index sur les clés étrangères pour optimiser les performances
    - Index sur les champs de recherche fréquents (date_fermeture)
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS fin_ferm_caisse (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  com_contrat_client_id uuid NOT NULL REFERENCES com_contrat_client(id) ON DELETE RESTRICT,
  id_entite uuid NOT NULL REFERENCES com_entite(id) ON DELETE RESTRICT,
  
  date_fermeture date NOT NULL,
  heure_fermeture time NOT NULL,
  
  fond_caisse_espece_debut numeric(12,2),
  fond_caisse_espece_fin numeric(12,2),
  
  depot_banque_theorique numeric(12,2),
  depot_banque_reel numeric(12,2),
  
  total_cb_brut numeric(12,2),
  total_cb_reel numeric(12,2),
  total_facture_depenses_ttc numeric(12,2),
  
  ca_ht numeric(12,2),
  ca_ttc numeric(12,2),
  
  est_valide boolean DEFAULT false,
  commentaire text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Activation de la sécurité RLS
ALTER TABLE fin_ferm_caisse ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour fin_ferm_caisse
CREATE POLICY "Les utilisateurs peuvent créer des fermetures de caisse pour leur contrat"
  ON fin_ferm_caisse
  FOR INSERT
  TO authenticated
  WITH CHECK (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent lire les fermetures de caisse de leur contrat"
  ON fin_ferm_caisse
  FOR SELECT
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

CREATE POLICY "Les utilisateurs peuvent modifier les fermetures de caisse de leur contrat"
  ON fin_ferm_caisse
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

CREATE POLICY "Les utilisateurs peuvent supprimer les fermetures de caisse de leur contrat"
  ON fin_ferm_caisse
  FOR DELETE
  TO authenticated
  USING (com_contrat_client_id = (
    SELECT com_profil.com_contrat_client_id
    FROM com_profil
    WHERE (com_profil.user_id = auth.uid())
  ));

-- Triggers pour la mise à jour automatique des champs d'audit
CREATE TRIGGER set_updated_by_trigger
  BEFORE UPDATE ON fin_ferm_caisse
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();

CREATE TRIGGER prevent_created_by_update_trigger
  BEFORE UPDATE ON fin_ferm_caisse
  FOR EACH ROW
  EXECUTE FUNCTION prevent_created_by_update();

CREATE TRIGGER update_fin_ferm_caisse_updated_at
  BEFORE UPDATE ON fin_ferm_caisse
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Création d'index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_fin_ferm_caisse_com_contrat_client_id 
  ON fin_ferm_caisse(com_contrat_client_id);

CREATE INDEX IF NOT EXISTS idx_fin_ferm_caisse_id_entite 
  ON fin_ferm_caisse(id_entite);

CREATE INDEX IF NOT EXISTS idx_fin_ferm_caisse_date_fermeture 
  ON fin_ferm_caisse(date_fermeture);

CREATE INDEX IF NOT EXISTS idx_fin_ferm_caisse_est_valide 
  ON fin_ferm_caisse(est_valide);

-- Vérification finale
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'fin_ferm_caisse'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ La table fin_ferm_caisse a été créée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la création de la table fin_ferm_caisse';
  END IF;
END $$;
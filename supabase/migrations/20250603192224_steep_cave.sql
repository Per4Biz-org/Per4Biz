/*
  # Création de la table fin_compte_bancaire

  1. Nouvelle Table
    - `fin_compte_bancaire`
      - `id` : Identifiant unique du compte bancaire
      - `code` : Code unique du compte (12 caractères max)
      - `nom` : Nom du compte (30 caractères max)
      - `id_entite` : Référence vers l'entité propriétaire
      - `banque` : Nom de la banque (20 caractères max)
      - `iban` : Numéro IBAN (30 caractères max)
      - `bic` : Code BIC/SWIFT (11 caractères max)
      - `actif` : État du compte
      - `commentaire` : Notes additionnelles
      - `date_creation` : Date d'ouverture du compte
      - Champs d'audit (created_at, updated_at)

  2. Contraintes
    - Clé primaire sur id
    - Unicité sur code
    - Clé étrangère vers com_entite
    - Valeurs par défaut appropriées
    - Restrictions NOT NULL sur les champs obligatoires

  3. Sécurité
    - Activation de RLS
    - Politiques d'accès pour les utilisateurs authentifiés
*/

-- Création de la table
CREATE TABLE IF NOT EXISTS fin_compte_bancaire (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(12) NOT NULL UNIQUE,
  nom varchar(30) NOT NULL,
  id_entite uuid NOT NULL REFERENCES com_entite(id) ON DELETE RESTRICT,
  banque varchar(20) NOT NULL,
  iban varchar(30) NOT NULL,
  bic varchar(11),
  actif boolean NOT NULL DEFAULT true,
  commentaire text,
  date_creation timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de la sécurité RLS
ALTER TABLE fin_compte_bancaire ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les utilisateurs authentifiés
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les comptes bancaires"
  ON fin_compte_bancaire
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique de modification pour les utilisateurs authentifiés
CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les comptes bancaires"
  ON fin_compte_bancaire
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_fin_compte_bancaire_updated_at
  BEFORE UPDATE ON fin_compte_bancaire
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
/*
  # Création de la table rh_personnel

  1. Nouvelle Table
    - `rh_personnel`
      - `id` (uuid, clé primaire, générée automatiquement)
      - `com_contrat_client_id` (uuid, obligatoire, FK vers com_contrat_client)
      - `code_user` (text, obligatoire)
      - `nom` (text, obligatoire)
      - `prenom` (text, obligatoire)
      - `civilite` (text, CHECK IN ('Madame', 'Mademoiselle', 'Monsieur'))
      - `sexe` (text, CHECK IN ('Homme', 'Femme'))
      - `date_naissance` (date)
      - Informations de contact (adresse, code_postal, ville, pays)
      - `numero_securite_sociale` (text)
      - `lien_photo` (text)
      - `actif` (boolean, défaut true)
      - `nif` (varchar(20))
      - `email_perso` (text)
      - `telephone` (text)
      - `id_tiers` (uuid, obligatoire, FK vers com_tiers)
      - Champs d'audit (created_at, updated_at, created_by, updated_by)

  2. Contraintes
    - Clé primaire sur id
    - Clés étrangères vers com_contrat_client, com_tiers et auth.users
    - Contraintes CHECK pour civilite et sexe
    - Suppression restreinte pour préserver l'intégrité

  3. Index
    - Index sur com_contrat_client_id pour optimiser les performances
    - Index sur id_tiers pour les jointures
    - Index sur code_user pour les recherches

  4. Triggers
    - Triggers pour la mise à jour automatique des champs d'audit
    - Protection du champ created_by contre les modifications
*/

-- Création de la table
create table public.rh_personnel (
  id uuid not null default gen_random_uuid(),
  com_contrat_client_id uuid not null,
  code_user text not null,
  nom text not null,
  prenom text not null,
  civilite text check (civilite in ('Madame', 'Mademoiselle', 'Monsieur')),
  sexe text check (sexe in ('Homme', 'Femme')),
  date_naissance date,
  adresse text,
  code_postal text,
  ville text,
  pays text,
  numero_securite_sociale text,
  lien_photo text,
  actif boolean not null default true,
  nif varchar(20),
  email_perso text,
  telephone text,
  id_tiers uuid not null, -- lien vers com_tiers
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null default auth.uid(),
  updated_by uuid null,
  constraint rh_personnel_pkey primary key (id),
  constraint rh_personnel_com_contrat_client_id_fkey foreign key (com_contrat_client_id) references com_contrat_client(id) on delete restrict,
  constraint rh_personnel_id_tiers_fkey foreign key (id_tiers) references com_tiers(id) on delete restrict,
  constraint rh_personnel_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null,
  constraint rh_personnel_updated_by_fkey foreign key (updated_by) references auth.users(id) on delete set null
);

-- Création des index
create index if not exists idx_rh_personnel_com_contrat_client_id on public.rh_personnel using btree (com_contrat_client_id);
create index if not exists idx_rh_personnel_id_tiers on public.rh_personnel using btree (id_tiers);
create index if not exists idx_rh_personnel_code_user on public.rh_personnel using btree (code_user);

-- Activation de la sécurité RLS
alter table rh_personnel enable row level security;

-- Politiques RLS pour rh_personnel
create policy "Les utilisateurs peuvent créer du personnel pour leur contrat"
  on rh_personnel
  for insert
  to authenticated
  with check (com_contrat_client_id = (
    select com_profil.com_contrat_client_id
    from com_profil
    where (com_profil.user_id = auth.uid())
  ));

create policy "Les utilisateurs peuvent lire le personnel de leur contrat"
  on rh_personnel
  for select
  to authenticated
  using (com_contrat_client_id = (
    select com_profil.com_contrat_client_id
    from com_profil
    where (com_profil.user_id = auth.uid())
  ));

create policy "Les utilisateurs peuvent modifier le personnel de leur contrat"
  on rh_personnel
  for update
  to authenticated
  using (com_contrat_client_id = (
    select com_profil.com_contrat_client_id
    from com_profil
    where (com_profil.user_id = auth.uid())
  ))
  with check (com_contrat_client_id = (
    select com_profil.com_contrat_client_id
    from com_profil
    where (com_profil.user_id = auth.uid())
  ));

create policy "Les utilisateurs peuvent supprimer le personnel de leur contrat"
  on rh_personnel
  for delete
  to authenticated
  using (com_contrat_client_id = (
    select com_profil.com_contrat_client_id
    from com_profil
    where (com_profil.user_id = auth.uid())
  ));

-- Création des triggers
create trigger prevent_created_by_update_trigger before
update on rh_personnel for each row
execute function prevent_created_by_update();

create trigger set_updated_by_trigger before
update on rh_personnel for each row
execute function set_updated_by();

create trigger update_rh_personnel_updated_at before
update on rh_personnel for each row
execute function update_updated_at_column();
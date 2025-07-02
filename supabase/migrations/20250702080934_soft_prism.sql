/*
  # Suppression de la table rh_budget_mensuel
  
  1. Suppression
    - Supprime la table `rh_budget_mensuel` qui n'est plus nécessaire
    - Supprime les politiques RLS associées
    - Supprime les triggers associés
    - Supprime les index associés
*/

-- Suppression des politiques RLS
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des budgets mensuels pour leur contrat" ON public.rh_budget_mensuel;
DROP POLICY IF EXISTS "Les utilisateurs peuvent lire les budgets mensuels de leur contrat" ON public.rh_budget_mensuel;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier les budgets mensuels de leur contrat" ON public.rh_budget_mensuel;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer les budgets mensuels de leur contrat" ON public.rh_budget_mensuel;

-- Suppression des triggers
DROP TRIGGER IF EXISTS prevent_created_by_update_trigger ON public.rh_budget_mensuel;
DROP TRIGGER IF EXISTS set_updated_by_trigger ON public.rh_budget_mensuel;
DROP TRIGGER IF EXISTS update_rh_budget_mensuel_updated_at ON public.rh_budget_mensuel;

-- Suppression de la table
DROP TABLE IF EXISTS public.rh_budget_mensuel;
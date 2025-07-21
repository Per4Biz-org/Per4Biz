import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useProfil } from '../../context/ProfilContext';

// Type pour les données de budget
export interface BudgetData {
  id?: string;
  type: 'entite' | 'fonction' | 'personnel' | 'sous_categorie';
  entite_id: string;
  entite_code: string;
  entite_libelle: string;
  fonction_id?: string;
  fonction_code?: string;
  fonction_libelle?: string;
  personnel_id?: string;
  nom?: string;
  prenom?: string;
  sous_categorie_id?: string;
  sous_categorie_code?: string;
  sous_categorie_libelle?: string;
  janvier?: number;
  fevrier?: number;
  mars?: number;
  avril?: number;
  mai?: number;
  juin?: number;
  juillet?: number;
  aout?: number;
  septembre?: number;
  octobre?: number;
  novembre?: number;
  decembre?: number;
  total?: number;
  [key: string]: any;
}

export function useBudgetRHCalculations() {
  const { profil } = useProfil();
  const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour calculer le budget
  const calculateBudget = useCallback(async (year: number, entiteId: string | null) => {
    if (!profil?.com_contrat_client_id) {
      setError('Profil utilisateur incomplet');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 1. Récupérer les données nécessaires
      
      // 1.1 Récupérer les entités
      let entitesQuery = supabase
        .from('com_entite')
        .select('id, code, libelle')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('actif', true);
        
      if (entiteId) {
        entitesQuery = entitesQuery.eq('id', entiteId);
      }
      
      const { data: entites, error: entitesError } = await entitesQuery;
      
      if (entitesError) throw entitesError;
      if (!entites || entites.length === 0) {
        setError('Aucune entité trouvée');
        setLoading(false);
        return;
      }
      
      // 1.2 Récupérer tous les paramètres généraux RH applicables pour chaque mois de l'année
      const { data: paramsGeneraux, error: paramsError } = await supabase
        .from('rh_param_generaux')
        .select('*')
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('actif', true)
        .or(`date_fin.is.null,date_fin.gte.${year}-01-01`)
        .lte('date_debut', `${year}-12-31`)
        .order('date_debut', { ascending: false });
        
      if (paramsError) throw paramsError;
      
      // Créer une map des paramètres par mois pour un accès rapide
      const paramsParMois = new Map<number, any>();
      
      // Pour chaque mois de l'année, trouver les paramètres applicables
      for (let mois = 1; mois <= 12; mois++) {
        const dateMois = new Date(year, mois - 1, 15); // 15e jour du mois pour éviter les problèmes de fin de mois
        const dateMoisStr = dateMois.toISOString().split('T')[0];
        
        // Trouver les paramètres applicables pour ce mois
        const paramsApplicables = paramsGeneraux?.filter(param => {
          const dateDebut = new Date(param.date_debut);
          const dateFin = param.date_fin ? new Date(param.date_fin) : null;
          
          return dateDebut <= dateMois && (!dateFin || dateFin >= dateMois);
        }).sort((a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime());
        
        // Utiliser les paramètres les plus récents pour ce mois
        paramsParMois.set(mois, paramsApplicables?.[0] || null);
      }
      
      // 1.3 Récupérer les paramètres de sous-catégories RH
      const { data: paramsSousCategories, error: paramsSCError } = await supabase
        .from('rh_param_sous_categorie')
        .select(`
          *,
          sous_categorie:id_sous_categorie (
            id, code, libelle
          ),
          charge_patronale:id_sous_categorie_charge_patronale (
            id, code, libelle
          ),
          charge_salariale:id_sous_categorie_charge_salariale (
            id, code, libelle
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('actif', true);
        
      if (paramsSCError) throw paramsSCError;
      
      // 1.4 Récupérer le personnel avec ses contrats et affectations
      let personnelQuery = supabase
        .from('rh_personnel')
        .select(`
          id, code_court, nom, prenom, matricule,
          contrats:rh_historique_contrat(
            id, date_debut, date_fin,
            type_contrat:id_type_contrat(id, code, libelle)
          ),
          affectations:rh_affectation(
            id, date_debut, date_fin, id_entite, tx_presence,
            fonction:id_fonction(id, code, libelle, ordre_affichage)
          )
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .eq('actif', true);
        
      if (entiteId) {
        personnelQuery = personnelQuery.in('id', function(builder) {
          builder
            .select('id_personnel')
            .from('rh_affectation')
            .where('id_entite', '=', entiteId);
        });
      }
      
      const { data: personnel, error: personnelError } = await personnelQuery;
      
      if (personnelError) throw personnelError;
      if (!personnel || personnel.length === 0) {
        setError('Aucun personnel trouvé');
        setLoading(false);
        return;
      }
      
      // 1.5 Récupérer l'historique financier
      const { data: historiqueFinancier, error: historiqueError } = await supabase
        .from('rh_historique_financier')
        .select(`
          id, id_personnel, id_contrat, date_debut, date_fin, montant,
          categorie:id_categorie(id, code, libelle),
          sous_categorie:id_sous_categorie(id, code, libelle)
        `)
        .eq('com_contrat_client_id', profil.com_contrat_client_id)
        .or(`date_fin.is.null,date_fin.gte.${year}-01-01`)
        .lte('date_debut', `${year}-12-31`);
        
      if (historiqueError) throw historiqueError;
      
      // 2. Calculer le budget
      
      // Structure pour stocker les résultats
      const budgetResults: BudgetData[] = [];
      
      // Pour chaque entité
      for (const entite of entites) {
        // Ajouter une ligne pour l'entité
        const entiteLine: BudgetData = {
          type: 'entite',
          entite_id: entite.id,
          entite_code: entite.code,
          entite_libelle: entite.libelle,
          janvier: 0,
          fevrier: 0,
          mars: 0,
          avril: 0,
          mai: 0,
          juin: 0,
          juillet: 0,
          aout: 0,
          septembre: 0,
          octobre: 0,
          novembre: 0,
          decembre: 0,
          total: 0
        };
        
        budgetResults.push(entiteLine);
        
        // Filtrer le personnel pour cette entité
        const entitePersonnel = personnel.filter(p => 
          p.affectations.some(a => a.id_entite === entite.id)
        );
        
        // Regrouper par fonction
        const fonctionsMap = new Map<string, any>();
        
        entitePersonnel.forEach(p => {
          p.affectations.forEach(a => {
            if (a.id_entite === entite.id && a.fonction) {
              if (!fonctionsMap.has(a.fonction.id)) {
                fonctionsMap.set(a.fonction.id, {
                  id: a.fonction.id,
                  code: a.fonction.code,
                  libelle: a.fonction.libelle,
                  ordre_affichage: a.fonction.ordre_affichage,
                  personnel: []
                });
              }
              
              // Ajouter le personnel à cette fonction s'il n'y est pas déjà
              const fonctionData = fonctionsMap.get(a.fonction.id);
              if (!fonctionData.personnel.some((pers: any) => pers.id === p.id)) {
                fonctionData.personnel.push(p);
              }
            }
          });
        });
        
        // Trier les fonctions par ordre d'affichage
        const fonctions = Array.from(fonctionsMap.values()).sort((a, b) => 
          (a.ordre_affichage || 0) - (b.ordre_affichage || 0)
        );
        
        // Pour chaque fonction
        for (const fonction of fonctions) {
          // Ajouter une ligne pour la fonction
          const fonctionLine: BudgetData = {
            type: 'fonction',
            entite_id: entite.id,
            entite_code: entite.code,
            entite_libelle: entite.libelle,
            fonction_id: fonction.id,
            fonction_code: fonction.code,
            fonction_libelle: fonction.libelle,
            janvier: 0,
            fevrier: 0,
            mars: 0,
            avril: 0,
            mai: 0,
            juin: 0,
            juillet: 0,
            aout: 0,
            septembre: 0,
            octobre: 0,
            novembre: 0,
            decembre: 0,
            total: 0
          };
          
          budgetResults.push(fonctionLine);
          
          // Pour chaque personnel de cette fonction
          for (const pers of fonction.personnel) {
            // Ajouter une ligne pour le personnel
            const personnelLine: BudgetData = {
              type: 'personnel',
              entite_id: entite.id,
              entite_code: entite.code,
              entite_libelle: entite.libelle,
              fonction_id: fonction.id,
              fonction_code: fonction.code,
              fonction_libelle: fonction.libelle,
              personnel_id: pers.id,
              nom: pers.nom,
              prenom: pers.prenom,
              janvier: 0,
              fevrier: 0,
              mars: 0,
              avril: 0,
              mai: 0,
              juin: 0,
              juillet: 0,
              aout: 0,
              septembre: 0,
              octobre: 0,
              novembre: 0,
              decembre: 0,
              total: 0
            };
            
            budgetResults.push(personnelLine);
            
            // Récupérer les affectations de ce personnel pour cette entité
            const affectations = pers.affectations.filter(a => 
              a.id_entite === entite.id && a.fonction?.id === fonction.id
            );
            
            // Récupérer les contrats de ce personnel
            const contrats = pers.contrats;
            
            // Récupérer l'historique financier de ce personnel
            const historique = historiqueFinancier.filter(h => h.id_personnel === pers.id);
            
            // Pour chaque sous-catégorie dans l'historique financier
            const sousCategoriesMap = new Map<string, any>();
            
            historique.forEach(h => {
              if (!h.sous_categorie) return;
              
              const sousCategorieId = h.sous_categorie.id;
              if (!sousCategoriesMap.has(sousCategorieId)) {
                sousCategoriesMap.set(sousCategorieId, {
                  id: sousCategorieId,
                  code: h.sous_categorie.code,
                  libelle: h.sous_categorie.libelle,
                  montants: Array(12).fill(0), // Un montant par mois
                  charges_patronales: Array(12).fill(0),
                  charges_salariales: Array(12).fill(0)
                });
              }
              
              // Calculer les montants mensuels pour cette sous-catégorie
              const dateDebut = new Date(h.date_debut);
              const dateFin = h.date_fin ? new Date(h.date_fin) : null;
              
              // Vérifier si l'historique est applicable pour l'année demandée
              if (dateDebut.getFullYear() > year || (dateFin && dateFin.getFullYear() < year)) {
                return;
              }
              
              // Calculer les mois concernés pour l'année spécifiée
              const debutMois = dateDebut.getFullYear() < year ? 0 : dateDebut.getMonth();
              const finMois = !dateFin ? 11 : (dateFin.getFullYear() > year ? 11 : dateFin.getMonth());
              
              // Récupérer le paramètre de sous-catégorie RH
              const paramSousCategorie = paramsSousCategories?.find(p => 
                p.id_sous_categorie === sousCategorieId
              );
              
              // Pour chaque mois concerné
              for (let mois = debutMois; mois <= finMois; mois++) {
                // Vérifier si le personnel est affecté à cette entité pour ce mois spécifique
                const dateMois = new Date(year, mois, 15); // 15e jour du mois pour éviter les problèmes de fin de mois
                
                // Filtrer les affectations actives pour ce mois
                const affectationsActives = affectations.filter(a => {
                  const aDebut = new Date(a.date_debut);
                  const aFin = a.date_fin ? new Date(a.date_fin) : null;
                  
                  return aDebut <= dateMois && (!aFin || aFin >= dateMois);
                });
                
                // Si aucune affectation active pour ce mois, passer au mois suivant
                if (affectationsActives.length === 0) continue;
                
                // Calculer le taux de présence total pour ce mois (somme des tx_presence des affectations actives)
                const tauxPresenceTotal = affectationsActives.reduce((sum, a) => sum + (a.tx_presence || 1), 0);
                
                // Récupérer les paramètres RH applicables pour ce mois
                const paramsRHMois = paramsParMois.get(mois + 1); // +1 car les mois sont indexés de 1 à 12 dans la map
                const tauxPatronal = paramsRHMois?.taux_ss_patronale || 0;
                const tauxSalarial = paramsRHMois?.taux_ss_salariale || 0;
                
                // Calculer le montant pour ce mois
                const montantMensuel = h.montant;
                // Appliquer le taux de présence
                const montantAjuste = montantMensuel * tauxPresenceTotal;
                
                // Ajouter le montant au mois correspondant
                sousCategoriesMap.get(sousCategorieId).montants[mois] += montantAjuste;
                
                // Calculer les charges si applicable
                if (paramSousCategorie) {
                  if (paramSousCategorie.soumis_charge_patronale) {
                    const chargesPatronales = montantAjuste * (tauxPatronal / 100);
                    sousCategoriesMap.get(sousCategorieId).charges_patronales[mois] += chargesPatronales;
                  }
                  
                  if (paramSousCategorie.soumis_charge_salariale) {
                    const chargesSalariales = montantAjuste * (tauxSalarial / 100);
                    sousCategoriesMap.get(sousCategorieId).charges_salariales[mois] += chargesSalariales;
                  }
                }
              }
            });
            
            // Ajouter les lignes de sous-catégories
            for (const [_, sousCategorie] of Array.from(sousCategoriesMap.entries())) {
              // Ligne pour la sous-catégorie
              const sousCatLine: BudgetData = {
                type: 'sous_categorie',
                entite_id: entite.id,
                entite_code: entite.code,
                entite_libelle: entite.libelle,
                fonction_id: fonction.id,
                fonction_code: fonction.code,
                fonction_libelle: fonction.libelle,
                personnel_id: pers.id,
                nom: pers.nom,
                prenom: pers.prenom,
                sous_categorie_id: sousCategorie.id,
                sous_categorie_code: sousCategorie.code,
                sous_categorie_libelle: sousCategorie.libelle,
                janvier: sousCategorie.montants[0],
                fevrier: sousCategorie.montants[1],
                mars: sousCategorie.montants[2],
                avril: sousCategorie.montants[3],
                mai: sousCategorie.montants[4],
                juin: sousCategorie.montants[5],
                juillet: sousCategorie.montants[6],
                aout: sousCategorie.montants[7],
                septembre: sousCategorie.montants[8],
                octobre: sousCategorie.montants[9],
                novembre: sousCategorie.montants[10],
                decembre: sousCategorie.montants[11],
                total: sousCategorie.montants.reduce((a: number, b: number) => a + b, 0)
              };
              
              // Ajouter la ligne
              budgetResults.push(sousCatLine);
              
              // Mettre à jour les totaux du personnel
              personnelLine.janvier! += sousCatLine.janvier || 0;
              personnelLine.fevrier! += sousCatLine.fevrier || 0;
              personnelLine.mars! += sousCatLine.mars || 0;
              personnelLine.avril! += sousCatLine.avril || 0;
              personnelLine.mai! += sousCatLine.mai || 0;
              personnelLine.juin! += sousCatLine.juin || 0;
              personnelLine.juillet! += sousCatLine.juillet || 0;
              personnelLine.aout! += sousCatLine.aout || 0;
              personnelLine.septembre! += sousCatLine.septembre || 0;
              personnelLine.octobre! += sousCatLine.octobre || 0;
              personnelLine.novembre! += sousCatLine.novembre || 0;
              personnelLine.decembre! += sousCatLine.decembre || 0;
              personnelLine.total! += sousCatLine.total || 0;
              
              // Ajouter les charges patronales si applicable
              const paramSousCategorie = paramsSousCategories?.find(p => 
                p.id_sous_categorie === sousCategorie.id
              );
              
              if (paramSousCategorie?.soumis_charge_patronale && paramSousCategorie?.id_sous_categorie_charge_patronale) {
                const chargePatronaleSC = paramsSousCategories?.find(p => 
                  p.id_sous_categorie === paramSousCategorie.id_sous_categorie_charge_patronale
                )?.sous_categorie;
                
                if (chargePatronaleSC) {
                  const chargePatronaleLine: BudgetData = {
                    type: 'sous_categorie',
                    entite_id: entite.id,
                    entite_code: entite.code,
                    entite_libelle: entite.libelle,
                    fonction_id: fonction.id,
                    fonction_code: fonction.code,
                    fonction_libelle: fonction.libelle,
                    personnel_id: pers.id,
                    nom: pers.nom,
                    prenom: pers.prenom,
                    sous_categorie_id: chargePatronaleSC.id,
                    sous_categorie_code: chargePatronaleSC.code,
                    sous_categorie_libelle: `${chargePatronaleSC.libelle} (charges patronales)`,
                    janvier: sousCategorie.charges_patronales[0],
                    fevrier: sousCategorie.charges_patronales[1],
                    mars: sousCategorie.charges_patronales[2],
                    avril: sousCategorie.charges_patronales[3],
                    mai: sousCategorie.charges_patronales[4],
                    juin: sousCategorie.charges_patronales[5],
                    juillet: sousCategorie.charges_patronales[6],
                    aout: sousCategorie.charges_patronales[7],
                    septembre: sousCategorie.charges_patronales[8],
                    octobre: sousCategorie.charges_patronales[9],
                    novembre: sousCategorie.charges_patronales[10],
                    decembre: sousCategorie.charges_patronales[11],
                    total: sousCategorie.charges_patronales.reduce((a: number, b: number) => a + b, 0)
                  };
                  
                  // Ajouter la ligne
                  budgetResults.push(chargePatronaleLine);
                  
                  // Mettre à jour les totaux du personnel
                  personnelLine.janvier! += chargePatronaleLine.janvier || 0;
                  personnelLine.fevrier! += chargePatronaleLine.fevrier || 0;
                  personnelLine.mars! += chargePatronaleLine.mars || 0;
                  personnelLine.avril! += chargePatronaleLine.avril || 0;
                  personnelLine.mai! += chargePatronaleLine.mai || 0;
                  personnelLine.juin! += chargePatronaleLine.juin || 0;
                  personnelLine.juillet! += chargePatronaleLine.juillet || 0;
                  personnelLine.aout! += chargePatronaleLine.aout || 0;
                  personnelLine.septembre! += chargePatronaleLine.septembre || 0;
                  personnelLine.octobre! += chargePatronaleLine.octobre || 0;
                  personnelLine.novembre! += chargePatronaleLine.novembre || 0;
                  personnelLine.decembre! += chargePatronaleLine.decembre || 0;
                  personnelLine.total! += chargePatronaleLine.total || 0;
                }
              }
              
              // Ajouter les charges salariales si applicable
              if (paramSousCategorie?.soumis_charge_salariale && paramSousCategorie?.id_sous_categorie_charge_salariale) {
                const chargeSalarialeSC = paramsSousCategories?.find(p => 
                  p.id_sous_categorie === paramSousCategorie.id_sous_categorie_charge_salariale
                )?.sous_categorie;
                
                if (chargeSalarialeSC) {
                  const chargeSalarialeLine: BudgetData = {
                    type: 'sous_categorie',
                    entite_id: entite.id,
                    entite_code: entite.code,
                    entite_libelle: entite.libelle,
                    fonction_id: fonction.id,
                    fonction_code: fonction.code,
                    fonction_libelle: fonction.libelle,
                    personnel_id: pers.id,
                    nom: pers.nom,
                    prenom: pers.prenom,
                    sous_categorie_id: chargeSalarialeSC.id,
                    sous_categorie_code: chargeSalarialeSC.code,
                    sous_categorie_libelle: `${chargeSalarialeSC.libelle} (charges salariales)`,
                    janvier: sousCategorie.charges_salariales[0],
                    fevrier: sousCategorie.charges_salariales[1],
                    mars: sousCategorie.charges_salariales[2],
                    avril: sousCategorie.charges_salariales[3],
                    mai: sousCategorie.charges_salariales[4],
                    juin: sousCategorie.charges_salariales[5],
                    juillet: sousCategorie.charges_salariales[6],
                    aout: sousCategorie.charges_salariales[7],
                    septembre: sousCategorie.charges_salariales[8],
                    octobre: sousCategorie.charges_salariales[9],
                    novembre: sousCategorie.charges_salariales[10],
                    decembre: sousCategorie.charges_salariales[11],
                    total: sousCategorie.charges_salariales.reduce((a: number, b: number) => a + b, 0)
                  };
                  
                  // Ajouter la ligne
                  budgetResults.push(chargeSalarialeLine);
                  
                  // Mettre à jour les totaux du personnel
                  personnelLine.janvier! += chargeSalarialeLine.janvier || 0;
                  personnelLine.fevrier! += chargeSalarialeLine.fevrier || 0;
                  personnelLine.mars! += chargeSalarialeLine.mars || 0;
                  personnelLine.avril! += chargeSalarialeLine.avril || 0;
                  personnelLine.mai! += chargeSalarialeLine.mai || 0;
                  personnelLine.juin! += chargeSalarialeLine.juin || 0;
                  personnelLine.juillet! += chargeSalarialeLine.juillet || 0;
                  personnelLine.aout! += chargeSalarialeLine.aout || 0;
                  personnelLine.septembre! += chargeSalarialeLine.septembre || 0;
                  personnelLine.octobre! += chargeSalarialeLine.octobre || 0;
                  personnelLine.novembre! += chargeSalarialeLine.novembre || 0;
                  personnelLine.decembre! += chargeSalarialeLine.decembre || 0;
                  personnelLine.total! += chargeSalarialeLine.total || 0;
                }
              }
            }
            
            // Mettre à jour les totaux de la fonction
            fonctionLine.janvier! += personnelLine.janvier || 0;
            fonctionLine.fevrier! += personnelLine.fevrier || 0;
            fonctionLine.mars! += personnelLine.mars || 0;
            fonctionLine.avril! += personnelLine.avril || 0;
            fonctionLine.mai! += personnelLine.mai || 0;
            fonctionLine.juin! += personnelLine.juin || 0;
            fonctionLine.juillet! += personnelLine.juillet || 0;
            fonctionLine.aout! += personnelLine.aout || 0;
            fonctionLine.septembre! += personnelLine.septembre || 0;
            fonctionLine.octobre! += personnelLine.octobre || 0;
            fonctionLine.novembre! += personnelLine.novembre || 0;
            fonctionLine.decembre! += personnelLine.decembre || 0;
            fonctionLine.total! += personnelLine.total || 0;
          }
          
          // Mettre à jour les totaux de l'entité
          entiteLine.janvier! += fonctionLine.janvier || 0;
          entiteLine.fevrier! += fonctionLine.fevrier || 0;
          entiteLine.mars! += fonctionLine.mars || 0;
          entiteLine.avril! += fonctionLine.avril || 0;
          entiteLine.mai! += fonctionLine.mai || 0;
          entiteLine.juin! += fonctionLine.juin || 0;
          entiteLine.juillet! += fonctionLine.juillet || 0;
          entiteLine.aout! += fonctionLine.aout || 0;
          entiteLine.septembre! += fonctionLine.septembre || 0;
          entiteLine.octobre! += fonctionLine.octobre || 0;
          entiteLine.novembre! += fonctionLine.novembre || 0;
          entiteLine.decembre! += fonctionLine.decembre || 0;
          entiteLine.total! += fonctionLine.total || 0;
        }
      }
      
      // Mettre à jour les données de budget
      setBudgetData(budgetResults);
      
    } catch (error) {
      console.error('Erreur lors du calcul du budget:', error);
      setError('Erreur lors du calcul du budget. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [profil?.com_contrat_client_id]);

  return {
    budgetData,
    loading,
    error,
    calculateBudget
  };
}
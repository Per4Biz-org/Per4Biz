import { BrowserRouter, Routes, Route } from 'react-router-dom'
import React from 'react'
import Layout from './components/Layout'
import { MenuProvider } from './context/MenuContext'
import { AuthProvider } from './context/AuthContext'
import { ProfilProvider } from './context/ProfilContext'
import { PrivateRoute } from './components/PrivateRoute'
import { FEATURES } from '@/config/features'

// 🏠 Pages principales
import Accueil from './pages/Accueil'
import Login from './pages/Login'
import Profil from './pages/Profil'
import TestUI from './pages/TestUI'

// ⚙️ Paramètres Globaux
import ParametresGlobal from './pages/ParametreGlobal/index'
import Entites from './pages/ParametreGlobal/Entites'
import Tiers from './pages/ParametreGlobal/Tiers'
import TypeTiers from './pages/ParametreGlobal/TypeTiers'
import TypeFacture from './pages/ParametreGlobal/TypeFacture'
import ImportCADetail from './pages/ParametreGlobal/Import/ImportCADetail'
import ImportFacture from './pages/ParametreGlobal/Import/ImportFacture'
import ImportTiers from './pages/ParametreGlobal/Import/ImportTiers'
import ImportGlobal from './pages/ParametreGlobal/Import/index'

// 🏦 Module Banques
import Banques from './pages/banques/index'
import ParametresBanque from './pages/banques/ParametresBanque/index'
import ComptesBancaire from './pages/banques/ParametresBanque/ComptesBancaire'
import ModePaiement from './pages/banques/ParametresBanque/ModePaiement'
import ImportFormat from './pages/banques/ParametresBanque/ImportFormat'
import ImportRelevesBrut from './pages/banques/Releves/ImportRelevesBrut'
import EcritureBancaire from './pages/banques/Releves/EcritureBancaire'

// 👥 Module Employés
import Employes from './pages/employes/index'
import ParametresEmployes from './pages/employes/ParametresEmployes/index'
import BudgetRh from './pages/employes/BudgetRh'
import FichePersonnel from './pages/employes/FichePersonnel'
import MesEmployes from './pages/employes/MesEmployes'
import ParamGeneraux from './pages/employes/ParametresEmployes/ParamGeneraux'
import ParamSousCategoriesRH from './pages/employes/ParametresEmployes/ParamSousCategoriesRH'
import TypeContrat from './pages/employes/ParametresEmployes/TypeContrat'
import TypeFonction from './pages/employes/ParametresEmployes/TypeFonction'

// 💰 Module Finances
import Finances from './pages/finances/index'
import ParametresFinances from './pages/finances/parametresFinances/index'
import SaisieBudgetAnnuel from './pages/finances/Budget/SaisieBudgetAnnuel'
import SuiviCAReel from './pages/finances/CA/SuiviCAReel'
import SuiviCABudget from './pages/finances/CA/SuiviCABudget'
import TestDataTableFull from './pages/finances/CA/TestDataTableFull'
import EditFactureAchat from './pages/finances/factures/EditFactureAchat'
import FermetureCaisse from './pages/finances/caisse/FermetureCaisse'
import CATypeService from './pages/finances/parametresFinances/CATypeService'
import SousCategorieFlux from './pages/finances/parametresFinances/SousCategorieFlux'
import NatureFlux from './pages/finances/parametresFinances/NatureFlux'
import ParamJours from './pages/finances/parametresFinances/ParamJours'
import CategorieFlux from './pages/finances/parametresFinances/CategorieFlux'

// Lazy loading du composant MesFactures
const MesFacturesLazy = React.lazy(() => import('./pages/finances/factures/MesFactures'))

function App() {
  return (
    <AuthProvider>
      <ProfilProvider>
        <MenuProvider>
          <BrowserRouter>
          <Routes>
            {/* 🔓 Login sempre disponível */}
            <Route path="/login" element={<Login />} />
            
            {/* 🏠 Pages principales */}
            {FEATURES.ENABLE_ACCUEIL && (
              <Route path="/" element={<PrivateRoute><Layout><Accueil /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_PROFIL && (
              <Route path="/profil" element={<PrivateRoute><Layout><Profil /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_TEST_UI && (
              <Route path="/test-ui" element={<PrivateRoute><Layout><TestUI /></Layout></PrivateRoute>} />
            )}
            
            {/* ⚙️ Paramètres Globaux */}
            {FEATURES.ENABLE_PARAMETRES_GLOBAL && (
              <Route path="/parametres-global" element={<PrivateRoute><Layout><ParametresGlobal /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_ENTITES && (
              <Route path="/parametres-global/entites" element={<PrivateRoute><Layout><Entites /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_TIERS && (
              <Route path="/parametres-global/tiers" element={<PrivateRoute><Layout><Tiers /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_TYPE_TIERS && (
              <Route path="/parametres-global/type-tiers" element={<PrivateRoute><Layout><TypeTiers /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_TYPE_FACTURE && (
              <Route path="/parametres-global/type-facture" element={<PrivateRoute><Layout><TypeFacture /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_IMPORT_CA_DETAIL && (
              <Route path="/parametres-global/import/ca-detail" element={<PrivateRoute><Layout><ImportCADetail /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_IMPORT_FACTURE && (
              <Route path="/parametres-global/import/facture" element={<PrivateRoute><Layout><ImportFacture /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_IMPORT_TIERS && (
              <Route path="/parametres-global/import/tiers" element={<PrivateRoute><Layout><ImportTiers /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_IMPORT_GLOBAL && (
              <Route path="/parametres-global/import" element={<PrivateRoute><Layout><ImportGlobal /></Layout></PrivateRoute>} />
            )}
            
            {/* 🏦 Module Banques */}
            {FEATURES.ENABLE_BANQUES && (
              <Route path="/banques" element={<PrivateRoute><Layout><Banques /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_PARAMETRES_BANQUE && (
              <Route path="/banques/parametres-banque" element={<PrivateRoute><Layout><ParametresBanque /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_COMPTES_BANCAIRE && (
              <Route path="/banques/comptes-bancaire" element={<PrivateRoute><Layout><ComptesBancaire /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_MODE_PAIEMENT && (
              <Route path="/banques/mode-paiement" element={<PrivateRoute><Layout><ModePaiement /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_IMPORT_FORMAT && (
              <Route path="/banques/import-format" element={<PrivateRoute><Layout><ImportFormat /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_IMPORT_RELEVES_BRUT && (
              <Route path="/banques/import-releves-brut" element={<PrivateRoute><Layout><ImportRelevesBrut /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_ECRITURE_BANCAIRE && (
              <Route path="/banques/ecriture-bancaire" element={<PrivateRoute><Layout><EcritureBancaire /></Layout></PrivateRoute>} />
            )}
            
            {/* 👥 Module Employés */}
            {FEATURES.ENABLE_EMPLOYES && (
              <Route path="/employes" element={<PrivateRoute><Layout><Employes /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_PARAMETRES_EMPLOYES && (
              <Route path="/employes/parametres-employes" element={<PrivateRoute><Layout><ParametresEmployes /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_BUDGET_RH && (
              <Route path="/employes/budget-rh" element={<PrivateRoute><Layout><BudgetRh /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_FICHE_PERSONNEL && (
              <Route path="/employes/fiche-personnel" element={<PrivateRoute><Layout><FichePersonnel /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_MES_EMPLOYES && (
              <Route path="/employes/mes-employes" element={<PrivateRoute><Layout><MesEmployes /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_PARAM_GENERAUX && (
              <Route path="/employes/param-generaux" element={<PrivateRoute><Layout><ParamGeneraux /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_PARAM_SOUS_CATEGORIES_RH && (
              <Route path="/employes/param-sous-categories-rh" element={<PrivateRoute><Layout><ParamSousCategoriesRH /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_TYPE_CONTRAT && (
              <Route path="/employes/type-contrat" element={<PrivateRoute><Layout><TypeContrat /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_TYPE_FONCTION && (
              <Route path="/employes/type-fonction" element={<PrivateRoute><Layout><TypeFonction /></Layout></PrivateRoute>} />
            )}
            
            {/* 💰 Module Finances */}
            {FEATURES.ENABLE_FINANCES && (
              <Route path="/finances" element={<PrivateRoute><Layout><Finances /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_PARAMETRES_FINANCES && (
              <Route path="/finances/parametres-finances" element={<PrivateRoute><Layout><ParametresFinances /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_SAISIE_BUDGET_ANNUEL && (
              <Route path="/finances/saisie-budget-annuel" element={<PrivateRoute><Layout><SaisieBudgetAnnuel /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_SUIVI_CA_REEL && (
              <Route path="/finances/suivi-ca-reel" element={<PrivateRoute><Layout><SuiviCAReel /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_SUIVI_CA_BUDGET && (
              <Route path="/finances/suivi-ca-budget" element={<PrivateRoute><Layout><SuiviCABudget /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_TEST_DATA_TABLE_FULL && (
              <Route path="/finances/test-data-table-full" element={<PrivateRoute><Layout><TestDataTableFull /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_EDIT_FACTURE_ACHAT && (
              <Route path="/finances/edit-facture-achat" element={<PrivateRoute><Layout><EditFactureAchat /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_MES_FACTURES && (
              <Route path="/finances/mes-factures" element={
                <PrivateRoute>
                  <Layout>
                    <React.Suspense fallback={<div>Chargement...</div>}>
                      <MesFacturesLazy />
                    </React.Suspense>
                  </Layout>
                </PrivateRoute>
              } />
            )}
            {FEATURES.ENABLE_FERMETURE_CAISSE && (
              <Route path="/finances/fermeture-caisse" element={<PrivateRoute><Layout><FermetureCaisse /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_CA_TYPE_SERVICE && (
              <Route path="/finances/ca-type-service" element={<PrivateRoute><Layout><CATypeService /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_SOUS_CATEGORIE_FLUX && (
              <Route path="/finances/sous-categorie-flux" element={<PrivateRoute><Layout><SousCategorieFlux /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_NATURE_FLUX && (
              <Route path="/finances/nature-flux" element={<PrivateRoute><Layout><NatureFlux /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_PARAM_JOURS && (
              <Route path="/finances/param-jours" element={<PrivateRoute><Layout><ParamJours /></Layout></PrivateRoute>} />
            )}
            {FEATURES.ENABLE_CATEGORIE_FLUX && (
              <Route path="/finances/categorie-flux" element={<PrivateRoute><Layout><CategorieFlux /></Layout></PrivateRoute>} />
            )}
          </Routes>
        </BrowserRouter>
        </MenuProvider>
      </ProfilProvider>
    </AuthProvider>
  )
}

export default App
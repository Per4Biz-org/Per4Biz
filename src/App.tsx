import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Accueil from './pages/Accueil'
import TestUI from './pages/TestUI'
import ParametreGlobal from './pages/ParametreGlobal/'
import Entites from './pages/ParametreGlobal/Entites'
import TypeTiers from './pages/ParametreGlobal/TypeTiers'
import Tiers from './pages/ParametreGlobal/Tiers'
import Import from './pages/ParametreGlobal/Import'
import Finances from './pages/finances'
import ParametresFinances from './pages/finances/parametresFinances'
import NatureFlux from './pages/finances/parametresFinances/NatureFlux'
import CategorieFlux from './pages/finances/parametresFinances/CategorieFlux'
import SousCategorieFlux from './pages/finances/parametresFinances/SousCategorieFlux'
import ParamJours from './pages/finances/parametresFinances/ParamJours'
import MesFactures from './pages/finances/MesFactures'
import CATypeService from './pages/finances/parametresFinances/CATypeService'
import Banques from './pages/banques'
import ParametresBanque from './pages/banques/ParametresBanque'
import ComptesBancaire from './pages/banques/ParametresBanque/ComptesBancaire'
import ModePaiement from './pages/banques/ParametresBanque/ModePaiement'
import ImportTiers from './pages/ParametreGlobal/Import/ImportTiers'
import ImportFacture from './pages/ParametreGlobal/Import/ImportFacture'
import Profil from './pages/Profil'
import SuiviCABudget from './pages/finances/CA/SuiviCABudget'
import Layout from './components/Layout'
import { MenuProvider } from './context/MenuContext'
import { AuthProvider } from './context/AuthContext'
import { ProfilProvider } from './context/ProfilContext'
import { PrivateRoute } from './components/PrivateRoute'
import Login from './pages/Login'

function App() {
  return (
    <AuthProvider>
      <ProfilProvider>
        <MenuProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <PrivateRoute>
                <Layout>
                  <Accueil />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/testui" element={
              <PrivateRoute>
                <Layout>
                  <TestUI />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/parametres-global/entites" element={
              <PrivateRoute>
                <Layout>
                  <Entites />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/parametres-global/type-tiers" element={
              <PrivateRoute>
                <Layout>
                  <TypeTiers />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/parametres-global/tiers" element={
              <PrivateRoute>
                <Layout>
                  <Tiers />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/parametres-global/import" element={
              <PrivateRoute>
                <Layout>
                  <Import />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/parametres-global/import/tiers" element={
              <PrivateRoute>
                <Layout>
                  <ImportTiers />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/parametres-global/import/factures" element={
              <PrivateRoute>
                <Layout>
                  <ImportFacture />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/finances" element={
              <PrivateRoute>
                <Layout>
                  <Finances />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/finances/mes-factures" element={
              <PrivateRoute>
                <Layout>
                  <MesFactures />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/finances/suivi-ca-budget" element={
              <PrivateRoute>
                <Layout>
                  <SuiviCABudget />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/finances/parametres-finances" element={
              <PrivateRoute>
                <Layout>
                  <ParametresFinances />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/finances/parametres-finances/nature-flux" element={
              <PrivateRoute>
                <Layout>
                  <NatureFlux />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/finances/parametres-finances/categorie-flux" element={
              <PrivateRoute>
                <Layout>
                  <CategorieFlux />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/finances/parametres-finances/sous-categorie-flux" element={
              <PrivateRoute>
                <Layout>
                  <SousCategorieFlux />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/finances/parametres-finances/param-jours" element={
              <PrivateRoute>
                <Layout>
                  <ParamJours />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/finances/parametres-finances/ca-type-service" element={
              <PrivateRoute>
                <Layout>
                  <CATypeService />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/parametres-global" element={
              <PrivateRoute>
                <Layout>
                  <ParametreGlobal />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/banques" element={
              <PrivateRoute>
                <Layout>
                  <Banques />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/banques/parametres-bancaire" element={
              <PrivateRoute>
                <Layout>
                  <ParametresBanque />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/banques/parametres-bancaire/comptes-bancaire" element={
              <PrivateRoute>
                <Layout>
                  <ComptesBancaire />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/banques/parametres-bancaire/mode-paiement" element={
              <PrivateRoute>
                <Layout>
                  <ModePaiement />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/profil" element={
              <PrivateRoute>
                <Layout>
                  <Profil />
                </Layout>
              </PrivateRoute>
            } />
          </Routes>
        </BrowserRouter>
        </MenuProvider>
      </ProfilProvider>
    </AuthProvider>
  )
}

export default App
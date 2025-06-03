import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Accueil from './pages/Accueil'
import TestUI from './pages/TestUI'
import ParametreGlobal from './pages/ParametreGlobal/'
import Entites from './pages/ParametreGlobal/Entites'
import Finances from './pages/finances'
import ParametresFinances from './pages/finances/parametresFinances'
import Banques from './pages/banques'
import ParametresBanque from './pages/banques/ParametresBanque'
import ComptesBancaire from './pages/banques/ParametresBanque/ComptesBancaire'
import Profil from './pages/Profil'
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
            <Route path="/finances" element={
              <PrivateRoute>
                <Layout>
                  <Finances />
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
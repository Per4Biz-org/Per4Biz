import { BrowserRouter, Routes, Route } from 'react-router-dom'
import React from 'react'
import Accueil from './pages/Accueil'
import FermetureCaisse from './pages/finances/caisse/FermetureCaisse'
import Layout from './components/Layout'
import { MenuProvider } from './context/MenuContext'
import { AuthProvider } from './context/AuthContext'
import { ProfilProvider } from './context/ProfilContext'
import { PrivateRoute } from './components/PrivateRoute'
import Login from './pages/Login'
import Profil from './pages/Profil'

// Lazy loading du composant MesFactures
const MesFacturesLazy = React.lazy(() => import('./pages/finances/factures/MesFactures'))

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
            <Route path="/finances/mes-factures" element={
              <PrivateRoute>
                <Layout>
                  <React.Suspense fallback={<div>Chargement...</div>}>
                    <MesFacturesLazy />
                  </React.Suspense>
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/finances/fermeture-caisse" element={
              <PrivateRoute>
                <Layout>
                  <FermetureCaisse />
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
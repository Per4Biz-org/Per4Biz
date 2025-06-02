import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Accueil from './pages/Accueil'
import Layout from './components/Layout'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Accueil />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
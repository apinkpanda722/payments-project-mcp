import { Route, Routes } from 'react-router-dom'
import './App.css'
import { Header } from './components/Header'
import { ShopPage } from './pages/ShopPage'

function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<ShopPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

import { Route, Routes } from 'react-router-dom'
import './App.css'
import { Header } from './components/Header'
import { ShopPage } from './pages/ShopPage'
import { OrderPage } from './pages/OrderPage'

function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<ShopPage />} />
          <Route path="/order" element={<OrderPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export function Header() {
  const { totalCount } = useCart()
  const location = useLocation()

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="brand">
          <span className="brand__mark">◎</span>
          ORBIT STORE
        </Link>
        <nav className="site-nav">
          <Link to="/" className={location.pathname === '/' ? 'is-active' : ''}>
            쇼핑하기
          </Link>
          <Link to="/order" className={`cart-link ${location.pathname === '/order' ? 'is-active' : ''}`}>
            🛒 장바구니
            {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
          </Link>
        </nav>
      </div>
    </header>
  )
}

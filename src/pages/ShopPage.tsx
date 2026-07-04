import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { products } from '../data/products'
import { useCart } from '../context/CartContext'

function formatKrw(value: number): string {
  return `₩${value.toLocaleString('ko-KR')}`
}

export function ShopPage() {
  const { addItem, totalCount, totalPrice } = useCart()
  const navigate = useNavigate()
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  function getQuantity(productId: string): number {
    return quantities[productId] ?? 1
  }

  function changeQuantity(productId: string, delta: number) {
    setQuantities((prev) => {
      const next = Math.min(10, Math.max(1, getQuantity(productId) + delta))
      return { ...prev, [productId]: next }
    })
  }

  function handleAddToCart(productId: string) {
    addItem(productId, getQuantity(productId))
    setQuantities((prev) => ({ ...prev, [productId]: 1 }))
  }

  return (
    <div className="page">
      <section className="shop-hero">
        <span className="shop-hero__eyebrow">New Season</span>
        <h1 className="shop-hero__title">일상을 채우는 오브젝트, ORBIT</h1>
        <p className="shop-hero__subtitle">
          엄선한 라이프스타일 아이템을 만나보세요. 장바구니에 담고 토스페이먼츠로 간편하게 결제할 수 있어요.
        </p>
      </section>

      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-card__thumb" style={{ background: product.gradient }}>
              {product.emoji}
            </div>
            <div className="product-card__body">
              <span className="product-card__category">{product.category}</span>
              <h3 className="product-card__name">{product.name}</h3>
              <p className="product-card__desc">{product.description}</p>
              <div className="product-card__footer">
                <span className="product-card__price">{formatKrw(product.price)}</span>
                <div className="qty-stepper">
                  <button type="button" onClick={() => changeQuantity(product.id, -1)} aria-label="수량 감소">
                    −
                  </button>
                  <span>{getQuantity(product.id)}</span>
                  <button type="button" onClick={() => changeQuantity(product.id, 1)} aria-label="수량 증가">
                    +
                  </button>
                </div>
              </div>
              <button type="button" className="btn btn-secondary add-to-cart-btn" onClick={() => handleAddToCart(product.id)}>
                장바구니 담기
              </button>
            </div>
          </article>
        ))}
      </div>

      {totalCount > 0 && (
        <div className="cart-bar">
          <div className="cart-bar__info">
            <span className="cart-bar__count">{totalCount}개 상품</span>
            <span className="cart-bar__total">{formatKrw(totalPrice)}</span>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/order')}>
            주문하기
          </button>
        </div>
      )}
    </div>
  )
}

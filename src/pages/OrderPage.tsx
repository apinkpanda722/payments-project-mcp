import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ANONYMOUS, loadTossPayments } from '@tosspayments/tosspayments-sdk'
import type { TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk'
import { useCart } from '../context/CartContext'

const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY as string

function formatKrw(value: number): string {
  return `₩${value.toLocaleString('ko-KR')}`
}

interface CreatedOrder {
  orderId: string
  orderName: string
  amount: number
}

export function OrderPage() {
  const { items, totalPrice } = useCart()
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerMobilePhone, setCustomerMobilePhone] = useState('')
  const [order, setOrder] = useState<CreatedOrder | null>(null)
  const [widgetsReady, setWidgetsReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null)
  const orderRequested = useRef(false)

  const hasItems = items.length > 0

  useEffect(() => {
    if (!hasItems || orderRequested.current) return
    orderRequested.current = true

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).message ?? '주문 생성에 실패했습니다.')
        return res.json() as Promise<CreatedOrder>
      })
      .then(setOrder)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '주문 생성에 실패했습니다.')
      })
  }, [hasItems, items])

  useEffect(() => {
    if (!order) return
    let destroyed = false

    async function renderWidgets() {
      if (!order) return
      try {
        const tossPayments = await loadTossPayments(clientKey)
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS })
        widgetsRef.current = widgets

        await widgets.setAmount({ currency: 'KRW', value: order.amount })

        await Promise.all([
          widgets.renderPaymentMethods({ selector: '#toss-payment-method', variantKey: 'DEFAULT' }),
          widgets.renderAgreement({ selector: '#toss-agreement', variantKey: 'AGREEMENT' }),
        ])

        if (!destroyed) setWidgetsReady(true)
      } catch (err) {
        if (!destroyed) {
          setError(err instanceof Error ? err.message : '결제위젯을 불러오지 못했습니다.')
        }
      }
    }

    renderWidgets()

    return () => {
      destroyed = true
    }
  }, [order])

  async function handlePayment() {
    if (!order || !widgetsRef.current) return
    setSubmitting(true)
    setError(null)

    try {
      await widgetsRef.current.requestPayment({
        orderId: order.orderId,
        orderName: order.orderName,
        successUrl: `${window.location.origin}${import.meta.env.BASE_URL}success`,
        failUrl: `${window.location.origin}${import.meta.env.BASE_URL}fail`,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        customerMobilePhone: customerMobilePhone || undefined,
      })
    } catch (err) {
      setSubmitting(false)
      setError(err instanceof Error ? err.message : '결제 요청 중 오류가 발생했습니다.')
    }
  }

  if (!hasItems) {
    return (
      <div className="order-empty">
        <h2>장바구니가 비어 있어요</h2>
        <p style={{ margin: '12px 0 20px' }}>상품을 담고 다시 주문해주세요.</p>
        <Link to="/" className="btn btn-primary">
          쇼핑하러 가기
        </Link>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="shop-hero__title" style={{ marginBottom: 24 }}>
        주문서
      </h1>

      <div className="order-grid">
        <div>
          <div className="panel">
            <h2 className="panel__title">주문 상품</h2>
            {items.map((item) => (
              <div className="order-item" key={item.productId}>
                <div className="order-item__thumb" style={{ background: item.gradient }}>
                  {item.emoji}
                </div>
                <div className="order-item__info">
                  <div className="order-item__name">{item.name}</div>
                  <div className="order-item__qty">
                    {formatKrw(item.price)} · {item.quantity}개
                  </div>
                </div>
                <div className="order-item__price">{formatKrw(item.price * item.quantity)}</div>
              </div>
            ))}
            <div className="order-total-row">
              <span className="order-total-row__label">총 결제금액</span>
              <span className="order-total-row__value">{formatKrw(totalPrice)}</span>
            </div>
          </div>

          <div className="panel">
            <h2 className="panel__title">주문자 정보</h2>
            <div className="form-field">
              <label htmlFor="customerName">이름</label>
              <input
                id="customerName"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="김토스"
              />
            </div>
            <div className="form-field">
              <label htmlFor="customerEmail">이메일</label>
              <input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="customer@example.com"
              />
            </div>
            <div className="form-field">
              <label htmlFor="customerMobilePhone">휴대폰 번호</label>
              <input
                id="customerMobilePhone"
                value={customerMobilePhone}
                onChange={(event) => setCustomerMobilePhone(event.target.value)}
                placeholder="01012341234"
              />
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel__title">결제 수단</h2>
          <div className="payment-widgets">
            {!widgetsReady && !error && <div className="payment-widgets__loading">결제위젯을 불러오는 중...</div>}
            <div id="toss-payment-method" />
            <div id="toss-agreement" />
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            style={{ marginTop: 16 }}
            disabled={!widgetsReady || submitting}
            onClick={handlePayment}
          >
            {submitting ? '결제 요청 중...' : `${formatKrw(totalPrice)} 결제하기`}
          </button>
          {error && <div className="order-error">{error}</div>}
        </div>
      </div>
    </div>
  )
}

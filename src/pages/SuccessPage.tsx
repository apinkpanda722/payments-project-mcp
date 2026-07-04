import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'

interface ConfirmedPayment {
  orderId: string
  orderName?: string
  totalAmount?: number
  method?: string
  approvedAt?: string
}

type Status = 'confirming' | 'done' | 'error'

function formatKrw(value: number): string {
  return `₩${value.toLocaleString('ko-KR')}`
}

export function SuccessPage() {
  const [searchParams] = useSearchParams()
  const { clear } = useCart()
  const [status, setStatus] = useState<Status>('confirming')
  const [payment, setPayment] = useState<ConfirmedPayment | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const confirmRequested = useRef(false)

  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')

  useEffect(() => {
    if (confirmRequested.current) return
    confirmRequested.current = true

    if (!paymentKey || !orderId || !amount) {
      setStatus('error')
      setErrorMessage('결제 정보가 올바르지 않습니다.')
      return
    }

    fetch('/api/payments/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.message ?? '결제 승인에 실패했습니다.')
        return data as ConfirmedPayment
      })
      .then((data) => {
        setPayment(data)
        setStatus('done')
        clear()
      })
      .catch((err: unknown) => {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : '결제 승인에 실패했습니다.')
      })
  }, [paymentKey, orderId, amount, clear])

  if (status === 'confirming') {
    return (
      <div className="result-page">
        <div className="result-card">
          <p className="result-desc">결제를 승인하는 중입니다...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="result-page">
        <div className="result-card">
          <div className="result-icon result-icon--fail">✕</div>
          <h2 className="result-title">결제 승인에 실패했어요</h2>
          <p className="result-desc">{errorMessage}</p>
          <div className="result-actions">
            <Link to="/" className="btn btn-primary">
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="result-page">
      <div className="result-card">
        <div className="result-icon result-icon--success">✓</div>
        <h2 className="result-title">결제가 완료됐어요</h2>
        <p className="result-desc">주문해주셔서 감사합니다.</p>
        <div className="result-details">
          <div className="result-details__row">
            <span>주문번호</span>
            <span>{payment?.orderId}</span>
          </div>
          {payment?.orderName && (
            <div className="result-details__row">
              <span>주문상품</span>
              <span>{payment.orderName}</span>
            </div>
          )}
          {typeof payment?.totalAmount === 'number' && (
            <div className="result-details__row">
              <span>결제금액</span>
              <span>{formatKrw(payment.totalAmount)}</span>
            </div>
          )}
          {payment?.method && (
            <div className="result-details__row">
              <span>결제수단</span>
              <span>{payment.method}</span>
            </div>
          )}
        </div>
        <div className="result-actions">
          <Link to="/" className="btn btn-primary">
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    </div>
  )
}

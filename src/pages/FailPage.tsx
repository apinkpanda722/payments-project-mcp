import { Link, useSearchParams } from 'react-router-dom'

export function FailPage() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const message = searchParams.get('message')
  const orderId = searchParams.get('orderId')

  return (
    <div className="result-page">
      <div className="result-card">
        <div className="result-icon result-icon--fail">✕</div>
        <h2 className="result-title">결제가 취소됐어요</h2>
        <p className="result-desc">{message ?? '결제 진행 중 문제가 발생했습니다.'}</p>
        <div className="result-details">
          {code && (
            <div className="result-details__row">
              <span>에러 코드</span>
              <span>{code}</span>
            </div>
          )}
          {orderId && (
            <div className="result-details__row">
              <span>주문번호</span>
              <span>{orderId}</span>
            </div>
          )}
        </div>
        <div className="result-actions">
          <Link to="/order" className="btn btn-secondary">
            다시 결제하기
          </Link>
          <Link to="/" className="btn btn-primary">
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    </div>
  )
}

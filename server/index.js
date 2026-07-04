import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import { config } from 'dotenv'
import express from 'express'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '.env') })

const products = JSON.parse(readFileSync(join(__dirname, '../shared/products.json'), 'utf-8'))

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY
if (!TOSS_SECRET_KEY) {
  console.warn('[server] TOSS_SECRET_KEY is not set. Add it to server/.env before confirming real payments.')
}

const PORT = process.env.PORT || 4242

// orderId -> { amount, orderName, items, customerName, customerEmail, status }
const orders = new Map()

const app = express()
app.use(cors())
app.use(express.json())

function findProduct(id) {
  return products.find((product) => product.id === id)
}

app.post('/api/orders', (req, res) => {
  const { items, customerName, customerEmail } = req.body ?? {}

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: '주문할 상품이 없습니다.' })
  }

  let amount = 0
  const orderItems = []
  for (const { productId, quantity } of items) {
    const product = findProduct(productId)
    if (!product || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: `유효하지 않은 상품 정보입니다: ${productId}` })
    }
    amount += product.price * quantity
    orderItems.push({ productId, name: product.name, price: product.price, quantity })
  }

  const orderId = randomUUID().replace(/-/g, '').slice(0, 32)
  const orderName =
    orderItems.length > 1 ? `${orderItems[0].name} 외 ${orderItems.length - 1}건` : orderItems[0].name

  orders.set(orderId, {
    amount,
    orderName,
    items: orderItems,
    customerName,
    customerEmail,
    status: 'CREATED',
  })

  res.json({ orderId, orderName, amount })
})

app.post('/api/payments/confirm', async (req, res) => {
  const { paymentKey, orderId, amount } = req.body ?? {}

  if (!paymentKey || !orderId || typeof amount !== 'number') {
    return res.status(400).json({ message: 'paymentKey, orderId, amount는 필수입니다.' })
  }

  const order = orders.get(orderId)
  if (!order) {
    return res.status(404).json({ message: '존재하지 않는 주문입니다.' })
  }

  // 클라이언트에서 전달된 금액이 아니라, 주문 생성 시 서버에 저장해둔 금액과 비교합니다.
  if (order.amount !== amount) {
    return res.status(400).json({ message: '주문 금액이 일치하지 않습니다. 결제가 거부되었습니다.' })
  }

  try {
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })

    const payment = await response.json()

    if (!response.ok) {
      order.status = 'ABORTED'
      return res.status(response.status).json(payment)
    }

    order.status = 'DONE'
    order.payment = payment
    res.json(payment)
  } catch (error) {
    console.error('[server] confirm API 호출 실패', error)
    res.status(500).json({ message: '결제 승인 처리 중 오류가 발생했습니다.' })
  }
})

app.get('/api/orders/:orderId', (req, res) => {
  const order = orders.get(req.params.orderId)
  if (!order) return res.status(404).json({ message: '존재하지 않는 주문입니다.' })
  res.json(order)
})

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`)
})

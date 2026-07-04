import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { findProduct } from '../data/products'

interface CartLine {
  productId: string
  quantity: number
}

export interface CartItem {
  productId: string
  name: string
  price: number
  emoji: string
  gradient: string
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  totalCount: number
  totalPrice: number
  addItem: (productId: string, quantity?: number) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clear: () => void
}

const STORAGE_KEY = 'shop.cart'

const CartContext = createContext<CartContextValue | null>(null)

function loadInitialLines(): CartLine[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartLine[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadInitialLines)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines])

  function addItem(productId: string, quantity = 1) {
    setLines((prev) => {
      const existing = prev.find((line) => line.productId === productId)
      if (existing) {
        return prev.map((line) =>
          line.productId === productId ? { ...line, quantity: line.quantity + quantity } : line,
        )
      }
      return [...prev, { productId, quantity }]
    })
  }

  function removeItem(productId: string) {
    setLines((prev) => prev.filter((line) => line.productId !== productId))
  }

  function setQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setLines((prev) => prev.map((line) => (line.productId === productId ? { ...line, quantity } : line)))
  }

  function clear() {
    setLines([])
  }

  const items = useMemo<CartItem[]>(() => {
    return lines
      .map((line) => {
        const product = findProduct(line.productId)
        if (!product) return null
        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          emoji: product.emoji,
          gradient: product.gradient,
          quantity: line.quantity,
        }
      })
      .filter((item): item is CartItem => item !== null)
  }, [lines])

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const value: CartContextValue = {
    items,
    totalCount,
    totalPrice,
    addItem,
    removeItem,
    setQuantity,
    clear,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}

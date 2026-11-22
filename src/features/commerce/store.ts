import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  ProductCategory,
  CommerceProduct,
  CommerceSupplier,
  CommerceCustomer,
  InventoryPurchase,
  CommerceSale,
  StockAdjustment,
  CommerceExpenseCategory,
  CommerceOperatingExpense,
  CommerceReceivablePayment,
  CommercePayablePayment,
  CommerceCapitalMovement,
} from './types'

type CommerceData = {
  categories: ProductCategory[]
  products: CommerceProduct[]
  suppliers: CommerceSupplier[]
  customers: CommerceCustomer[]
  purchases: InventoryPurchase[]
  sales: CommerceSale[]
  stockAdjustments: StockAdjustment[]
  expenseCategories: CommerceExpenseCategory[]
  operatingExpenses: CommerceOperatingExpense[]
  receivablePayments: CommerceReceivablePayment[]
  payablePayments: CommercePayablePayment[]
  capitalMovements: CommerceCapitalMovement[]
}

type CollectionName = keyof CommerceData

type CommerceState = CommerceData & {
  addItem: <K extends CollectionName>(
    collection: K,
    item: CommerceData[K][number],
  ) => void

  updateItem: <K extends CollectionName>(
    collection: K,
    id: string,
    updates: Partial<CommerceData[K][number]>,
  ) => void

  deleteItem: <K extends CollectionName>(
    collection: K,
    id: string,
  ) => void
}

const emptyData: CommerceData = {
  categories: [],
  products: [],
  suppliers: [],
  customers: [],
  purchases: [],
  sales: [],
  stockAdjustments: [],
  expenseCategories: [],
  operatingExpenses: [],
  receivablePayments: [],
  payablePayments: [],
  capitalMovements: [],
}

export const useCommerceStore = create<CommerceState>()(
  persist(
    (set) => ({
      ...emptyData,

      addItem: (collection, item) =>
        set((state) => ({
          [collection]: [...state[collection], item],
        }) as Partial<CommerceData>),

      updateItem: (collection, id, updates) =>
        set((state) => ({
          [collection]: state[collection].map((item) =>
            item.id === id ? { ...item, ...updates, id } : item,
          ),
        }) as Partial<CommerceData>),

      deleteItem: (collection, id) =>
        set((state) => ({
          [collection]: state[collection].filter(
            (item) => item.id !== id,
          ),
        }) as Partial<CommerceData>),
    }),
    {
      name: 'tadbiri-commerce-v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)

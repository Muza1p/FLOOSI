export type CommerceMoney = {
  amountMinor: number
  currencyCode: string
}

export type CommerceUnit =
  | 'piece'
  | 'carton'
  | 'box'
  | 'pack'
  | 'kg'
  | 'gram'
  | 'liter'
  | 'meter'
  | 'custom'

export type CommercePaymentMethod =
  | 'cash'
  | 'bank'
  | 'deferred'
  | 'other'

export type CommercePartyStatus = 'active' | 'archived'

export type ProductCategory = {
  id: string
  name: string
  parentId?: string
  color?: string
  note?: string
  createdAt: string
}

export type CommerceProduct = {
  id: string
  name: string
  sku?: string
  barcode?: string
  categoryId?: string
  unit: CommerceUnit
  customUnitName?: string
  purchasePriceMinor: number
  retailPriceMinor: number
  wholesalePriceMinor?: number
  minStockQuantity?: number
  isActive: boolean
  note?: string
  createdAt: string
  updatedAt: string
}

export type CommerceSupplier = {
  id: string
  name: string
  phone?: string
  address?: string
  note?: string
  status: CommercePartyStatus
  createdAt: string
}

export type CommerceCustomer = {
  id: string
  name: string
  phone?: string
  address?: string
  note?: string
  status: CommercePartyStatus
  createdAt: string
}

export type InventoryPurchaseLine = {
  id: string
  productId: string
  productName: string
  quantity: number
  unitCostMinor: number
  totalCostMinor: number
}

export type InventoryPurchase = {
  id: string
  reference?: string
  supplierId?: string
  supplierName?: string
  lines: InventoryPurchaseLine[]
  subtotalMinor: number
  discountMinor: number
  additionalCostMinor: number
  totalMinor: number
  paidMinor: number
  outstandingMinor: number
  paymentMethod: CommercePaymentMethod
  purchasedAt: string
  note?: string
  createdAt: string
}

export type SaleType = 'retail' | 'wholesale'

export type SaleLine = {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPriceMinor: number
  unitCostMinorAtSale: number
  totalMinor: number
  costTotalMinor: number
  profitMinor: number
}

export type CommerceSale = {
  id: string
  invoiceNumber: string
  type: SaleType
  customerId?: string
  customerName?: string
  lines: SaleLine[]
  subtotalMinor: number
  discountMinor: number
  totalMinor: number
  paidMinor: number
  outstandingMinor: number
  costOfGoodsMinor: number
  grossProfitMinor: number
  paymentMethod: CommercePaymentMethod
  soldAt: string
  note?: string
  createdAt: string
}

export type StockAdjustmentReason =
  | 'damaged'
  | 'lost'
  | 'found'
  | 'correction'
  | 'returned'

export type StockAdjustment = {
  id: string
  productId: string
  productName: string
  quantityChange: number
  reason: StockAdjustmentReason
  occurredAt: string
  note?: string
  createdAt: string
}

export type CommerceExpenseCategory = {
  id: string
  name: string
  isCustom: boolean
}

export type CommerceOperatingExpense = {
  id: string
  title: string
  categoryId?: string
  amountMinor: number
  currencyCode: string
  paidAt: string
  paymentMethod: CommercePaymentMethod
  note?: string
  createdAt: string
}

export type CommerceReceivablePayment = {
  id: string
  saleId: string
  customerId?: string
  amountMinor: number
  paidAt: string
  paymentMethod: CommercePaymentMethod
  note?: string
}

export type CommercePayablePayment = {
  id: string
  purchaseId: string
  supplierId?: string
  amountMinor: number
  paidAt: string
  paymentMethod: CommercePaymentMethod
  note?: string
}

export type CapitalMovementType =
  | 'owner_investment'
  | 'owner_withdrawal'

export type CommerceCapitalMovement = {
  id: string
  type: CapitalMovementType
  amountMinor: number
  currencyCode: string
  occurredAt: string
  note?: string
}

export type CommerceStockBalance = {
  productId: string
  quantity: number
  averageCostMinor: number
  stockValueMinor: number
}

export type CommerceSummary = {
  currencyCode: string
  totalSalesMinor: number
  totalCostOfGoodsMinor: number
  grossProfitMinor: number
  operatingExpensesMinor: number
  netProfitMinor: number
  inventoryValueMinor: number
  customerReceivablesMinor: number
  supplierPayablesMinor: number
  capitalInvestedMinor: number
  ownerWithdrawalsMinor: number
}

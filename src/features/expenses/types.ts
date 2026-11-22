export type CurrencyCode = string

export type ExpenseFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'

export type ExpenseStatus =
  | 'planned'
  | 'recorded'
  | 'skipped'

export type ExpenseCategory = {
  id: string
  name: string
  parentId?: string
  icon?: string
  isCustom: boolean
}

export type PurchaseItem = {
  id: string
  name: string
  quantity: number
  unitPriceMinor: number
  totalMinor: number
}

export type ExpenseEntry = {
  id: string
  title: string
  categoryId: string
  amountMinor: number
  currencyCode: CurrencyCode
  occurredAt: string
  note?: string
  items?: PurchaseItem[]
  recurringPlanId?: string
}

export type RecurrenceRule = {
  frequency: ExpenseFrequency
  interval: number
  weekdays?: number[]
  dayOfMonth?: number
}

export type RecurringExpensePlan = {
  id: string
  title: string
  categoryId: string
  expectedAmountMinor: number
  currencyCode: CurrencyCode
  schedule: RecurrenceRule
  startsOn: string
  endsOn?: string
  isActive: boolean
  note?: string
}

export type ExpenseOccurrence = {
  id: string
  planId: string
  scheduledFor: string
  status: ExpenseStatus
  actualExpenseId?: string
  actualAmountMinor?: number
  note?: string
}

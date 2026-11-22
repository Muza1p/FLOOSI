import type { PurchaseItem } from '../expenses/types'

export type CurrencyCode = string

export type IncomeSource =
  | 'salary'
  | 'daily_work'
  | 'freelance'
  | 'other'

export type FinanceScope = 'personal' | 'work'

export type MovementKind =
  | 'income'
  | 'expense'
  | 'refund'
  | 'owner_withdrawal'

export type ExpenseNature =
  | 'personal'
  | 'work_cost'

export type FinanceMovement = {
  id: string
  title: string
  kind: MovementKind
  scope: FinanceScope
  amountMinor: number
  currencyCode: CurrencyCode
  occurredAt: string
  incomeSource?: IncomeSource
  expenseNature?: ExpenseNature
  categoryId?: string
  note?: string
  relatedMovementId?: string
  items?: PurchaseItem[]
}

export type FinanceSummary = {
  currencyCode: CurrencyCode
  totalIncomeMinor: number
  totalPersonalExpensesMinor: number
  totalWorkCostsMinor: number
  totalRefundsMinor: number
  totalOwnerWithdrawalsMinor: number
  personalRemainingMinor: number
  workNetMinor: number
  overallRemainingMinor: number
}

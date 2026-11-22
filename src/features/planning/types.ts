export type MoneyValue = {
  amountMinor: number
  currencyCode: string
}

export type SavingsGoal = {
  id: string
  name: string
  target: MoneyValue
  saved: MoneyValue
  targetDate?: string
  createdAt: string
  note?: string
  isCompleted: boolean
}

export type SavingsContribution = {
  id: string
  goalId: string
  amount: MoneyValue
  date: string
  note?: string
}

export type InstallmentPlan = {
  id: string
  title: string
  total: MoneyValue
  paid: MoneyValue
  installmentAmount: MoneyValue
  frequency: 'weekly' | 'monthly'
  nextDueDate: string
  startDate: string
  endDate?: string
  note?: string
  isActive: boolean
}

export type InstallmentPayment = {
  id: string
  planId: string
  amount: MoneyValue
  paidAt: string
  note?: string
}

export type DebtDirection = 'i_owe' | 'owed_to_me'

export type DebtRecord = {
  id: string
  title: string
  personName?: string
  direction: DebtDirection
  total: MoneyValue
  settled: MoneyValue
  dueDate?: string
  createdAt: string
  note?: string
  isSettled: boolean
}

export type DebtPayment = {
  id: string
  debtId: string
  amount: MoneyValue
  paidAt: string
  note?: string
}

export type FinancialObligation = {
  id: string
  title: string
  amount: MoneyValue
  frequency: 'once' | 'weekly' | 'monthly' | 'yearly'
  nextDueDate: string
  isActive: boolean
  note?: string
}

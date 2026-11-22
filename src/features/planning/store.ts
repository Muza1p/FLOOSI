import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  SavingsGoal,
  SavingsContribution,
  InstallmentPlan,
  InstallmentPayment,
  DebtRecord,
  DebtPayment,
  FinancialObligation,
} from './types'

type PlanningState = {
  savingsGoals: SavingsGoal[]
  savingsContributions: SavingsContribution[]
  installmentPlans: InstallmentPlan[]
  installmentPayments: InstallmentPayment[]
  debts: DebtRecord[]
  debtPayments: DebtPayment[]
  obligations: FinancialObligation[]

  addSavingsGoal: (item: SavingsGoal) => void
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void
  deleteSavingsGoal: (id: string) => void
  addSavingsContribution: (item: SavingsContribution) => void

  addInstallmentPlan: (item: InstallmentPlan) => void
  updateInstallmentPlan: (id: string, updates: Partial<InstallmentPlan>) => void
  deleteInstallmentPlan: (id: string) => void
  addInstallmentPayment: (item: InstallmentPayment) => void

  addDebt: (item: DebtRecord) => void
  updateDebt: (id: string, updates: Partial<DebtRecord>) => void
  deleteDebt: (id: string) => void
  addDebtPayment: (item: DebtPayment) => void

  addObligation: (item: FinancialObligation) => void
  updateObligation: (id: string, updates: Partial<FinancialObligation>) => void
  deleteObligation: (id: string) => void
}

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set) => ({
      savingsGoals: [],
      savingsContributions: [],
      installmentPlans: [],
      installmentPayments: [],
      debts: [],
      debtPayments: [],
      obligations: [],

      addSavingsGoal: (item) =>
        set((state) => ({ savingsGoals: [...state.savingsGoals, item] })),
      updateSavingsGoal: (id, updates) =>
        set((state) => ({
          savingsGoals: state.savingsGoals.map((item) =>
            item.id === id ? { ...item, ...updates, id } : item,
          ),
        })),
      deleteSavingsGoal: (id) =>
        set((state) => ({
          savingsGoals: state.savingsGoals.filter((item) => item.id !== id),
          savingsContributions: state.savingsContributions.filter(
            (item) => item.goalId !== id,
          ),
        })),
      addSavingsContribution: (item) =>
        set((state) => ({
          savingsContributions: [...state.savingsContributions, item],
        })),

      addInstallmentPlan: (item) =>
        set((state) => ({ installmentPlans: [...state.installmentPlans, item] })),
      updateInstallmentPlan: (id, updates) =>
        set((state) => ({
          installmentPlans: state.installmentPlans.map((item) =>
            item.id === id ? { ...item, ...updates, id } : item,
          ),
        })),
      deleteInstallmentPlan: (id) =>
        set((state) => ({
          installmentPlans: state.installmentPlans.filter((item) => item.id !== id),
          installmentPayments: state.installmentPayments.filter(
            (item) => item.planId !== id,
          ),
        })),
      addInstallmentPayment: (item) =>
        set((state) => ({
          installmentPayments: [...state.installmentPayments, item],
        })),

      addDebt: (item) =>
        set((state) => ({ debts: [...state.debts, item] })),
      updateDebt: (id, updates) =>
        set((state) => ({
          debts: state.debts.map((item) =>
            item.id === id ? { ...item, ...updates, id } : item,
          ),
        })),
      deleteDebt: (id) =>
        set((state) => ({
          debts: state.debts.filter((item) => item.id !== id),
          debtPayments: state.debtPayments.filter((item) => item.debtId !== id),
        })),
      addDebtPayment: (item) =>
        set((state) => ({
          debtPayments: [...state.debtPayments, item],
        })),

      addObligation: (item) =>
        set((state) => ({ obligations: [...state.obligations, item] })),
      updateObligation: (id, updates) =>
        set((state) => ({
          obligations: state.obligations.map((item) =>
            item.id === id ? { ...item, ...updates, id } : item,
          ),
        })),
      deleteObligation: (id) =>
        set((state) => ({
          obligations: state.obligations.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'tadbiri-planning-v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

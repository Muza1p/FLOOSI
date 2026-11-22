import type {
  FinanceMovement,
  FinanceSummary,
} from './types'

export function calculateFinancialSummary(
  movements: FinanceMovement[],
): FinanceSummary[] {
  const currencies = [
    ...new Set(movements.map((movement) => movement.currencyCode)),
  ]

  return currencies.map((currencyCode) => {
    const current = movements.filter(
      (movement) => movement.currencyCode === currencyCode,
    )

    const sum = (
      items: FinanceMovement[],
    ) =>
      items.reduce(
        (total, movement) => total + movement.amountMinor,
        0,
      )

    const personalIncome = sum(
      current.filter(
        (movement) =>
          movement.kind === 'income' &&
          movement.scope === 'personal',
      ),
    )

    const workIncome = sum(
      current.filter(
        (movement) =>
          movement.kind === 'income' &&
          movement.scope === 'work',
      ),
    )

    const personalExpenses = sum(
      current.filter(
        (movement) =>
          movement.kind === 'expense' &&
          movement.expenseNature === 'personal',
      ),
    )

    const workCosts = sum(
      current.filter(
        (movement) =>
          movement.kind === 'expense' &&
          movement.expenseNature === 'work_cost',
      ),
    )

    const personalRefunds = sum(
      current.filter(
        (movement) =>
          movement.kind === 'refund' &&
          movement.scope === 'personal',
      ),
    )

    const workRefunds = sum(
      current.filter(
        (movement) =>
          movement.kind === 'refund' &&
          movement.scope === 'work',
      ),
    )

    const ownerWithdrawals = sum(
      current.filter(
        (movement) =>
          movement.kind === 'owner_withdrawal' &&
          movement.scope === 'work',
      ),
    )

    const totalIncomeMinor = personalIncome + workIncome
    const totalRefundsMinor = personalRefunds + workRefunds

    const personalRemainingMinor =
      personalIncome +
      personalRefunds +
      ownerWithdrawals -
      personalExpenses

    const workNetMinor =
      workIncome +
      workRefunds -
      workCosts -
      ownerWithdrawals

    return {
      currencyCode,
      totalIncomeMinor,
      totalPersonalExpensesMinor: personalExpenses,
      totalWorkCostsMinor: workCosts,
      totalRefundsMinor,
      totalOwnerWithdrawalsMinor: ownerWithdrawals,
      personalRemainingMinor,
      workNetMinor,
      overallRemainingMinor:
        personalRemainingMinor + workNetMinor,
    }
  })
}

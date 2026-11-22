import { create } from 'zustand'
import {
  persist,
  createJSONStorage,
} from 'zustand/middleware'

import type { FinanceMovement } from './types'

type FinanceState = {
  deletedMovements: { movement: FinanceMovement; deletedAt: string }[]
  movements: FinanceMovement[]

  addMovement: (movement: FinanceMovement) => void

  updateMovement: (
    id: string,
    updates: Partial<FinanceMovement>,
  ) => void

  deleteMovement: (id: string) => void
  restoreMovement: (id: string) => void
  permanentlyDeleteMovement: (id: string) => void
  emptyTrash: () => void

  getMovementsByScope: (
    scope: FinanceMovement['scope'],
  ) => FinanceMovement[]
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      movements: [],
        deletedMovements: [],

      addMovement: (movement) =>
        set((state) => ({
          movements: [...state.movements, movement],
        })),

      updateMovement: (id, updates) =>
        set((state) => ({
          movements: state.movements.map((movement) =>
            movement.id === id
              ? { ...movement, ...updates, id }
              : movement,
          ),
        })),

        deleteMovement: (id) =>
          set((state) => {
            const movement = state.movements.find((item) => item.id === id)
            if (!movement) return state
            return {
              movements: state.movements.filter((item) => item.id !== id),
              deletedMovements: [
                ...(state.deletedMovements ?? []),
                { movement, deletedAt: new Date().toISOString() },
              ],
            }
          }),

        restoreMovement: (id) =>
          set((state) => {
            const deleted = (state.deletedMovements ?? []).find(
              (item) => item.movement.id === id,
            )
            if (!deleted) return state
            return {
              movements: [...state.movements, deleted.movement],
              deletedMovements: state.deletedMovements.filter(
                (item) => item.movement.id !== id,
              ),
            }
          }),

        permanentlyDeleteMovement: (id) =>
          set((state) => ({
            deletedMovements: (state.deletedMovements ?? []).filter(
              (item) => item.movement.id !== id,
            ),
          })),

        emptyTrash: () => set({ deletedMovements: [] }),

      getMovementsByScope: (scope) =>
        get().movements.filter(
          (movement) => movement.scope === scope,
        ),
    }),
    {
      name: 'tadbiri-finance-v2',
      storage: createJSONStorage(() => localStorage),
      version: 2,
    },
  ),
)


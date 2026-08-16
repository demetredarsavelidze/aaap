import { STORAGE_KEY } from '../constants'
import type { AppState } from '../types'
import { createDemoState } from './demoData'
import { parseAppState } from './importExport'

export const storageService = {
  load(): AppState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return createDemoState()
      const parsed: unknown = JSON.parse(raw)
      const state = parseAppState(parsed)
      if (!state) return createDemoState()
      return { ...state, activeFocus: state.activeFocus }
    } catch {
      return createDemoState()
    }
  },

  save(state: AppState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage quota or private mode — keep the in-memory state usable.
    }
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  },

  exportJson(state: AppState): string {
    const { activeFocus: _activeFocus, ...rest } = state
    return JSON.stringify(rest, null, 2)
  },
}

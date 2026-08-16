import { createContext } from 'react'
import type { AppState } from '../types'

export interface ToastMessage {
  id: string
  text: string
  tone: 'success' | 'error' | 'info'
}

export interface AppContextValue {
  state: AppState
  patch: (updater: (current: AppState) => AppState) => void
  toasts: ToastMessage[]
  toast: (text: string, tone?: ToastMessage['tone']) => void
  dismissToast: (id: string) => void
  resetAll: () => void
  loadDemo: () => void
  importState: (raw: unknown) => string | null
}

export const AppContext = createContext<AppContextValue | null>(null)

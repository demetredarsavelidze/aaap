import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { completeExpiredFocus } from '../services/focusService'
import { createDemoState } from '../services/demoData'
import { createEmptyState } from '../services/emptyState'
import { validateImport } from '../services/importExport'
import { storageService } from '../services/storageService'
import type { AppState } from '../types'
import { AppContext, type ToastMessage } from './context'

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => storageService.load())
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const hydrated = useRef(false)

  const patch = useCallback((updater: (current: AppState) => AppState) => {
    setState((current) => updater(current))
  }, [])

  const toast = useCallback((text: string, tone: ToastMessage['tone'] = 'success') => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, text, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3200)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const resetAll = useCallback(() => {
    setState(createEmptyState())
    toast('All application data was reset.', 'info')
  }, [toast])

  const loadDemo = useCallback(() => {
    setState(createDemoState())
    toast('Demo data restored.')
  }, [toast])

  const importState = useCallback(
    (raw: unknown) => {
      const result = validateImport(raw)
      if (!result.ok) return result.error
      setState(result.state)
      toast('Data imported.')
      return null
    },
    [toast],
  )

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      setState((current) => completeExpiredFocus(current))
      return
    }
    storageService.save(state)
  }, [state])

  const value = useMemo(
    () => ({ state, patch, toasts, toast, dismissToast, resetAll, loadDemo, importState }),
    [state, patch, toasts, toast, dismissToast, resetAll, loadDemo, importState],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

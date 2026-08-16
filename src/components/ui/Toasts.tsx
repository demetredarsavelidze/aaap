import { useApp } from '../../store/useApp'

export function Toasts() {
  const { toasts, dismissToast } = useApp()
  if (toasts.length === 0) return null
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((toast) => (
        <button key={toast.id} className={`toast ${toast.tone}`} onClick={() => dismissToast(toast.id)}>
          {toast.text}
        </button>
      ))}
    </div>
  )
}

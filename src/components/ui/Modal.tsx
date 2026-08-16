import type { ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ open, title, children, onClose }: Props) {
  if (!open) return null
  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="spread" style={{ marginBottom: 12 }}>
          <h2 id="modal-title">{title}</h2>
          <Button variant="ghost" size="small" onClick={onClose} aria-label="Close">
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

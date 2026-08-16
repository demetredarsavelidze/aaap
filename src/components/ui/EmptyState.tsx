import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <Inbox size={22} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{body}</p>
      {action ? <div style={{ marginTop: 12 }}>{action}</div> : null}
    </div>
  )
}

import type { ReactNode } from 'react'

export function Badge({
  children,
  tone,
}: {
  children: ReactNode
  tone?: 'high' | 'medium' | 'low' | 'success' | 'warn'
}) {
  return <span className={`badge ${tone ?? ''}`.trim()}>{children}</span>
}

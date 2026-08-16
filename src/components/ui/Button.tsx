import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  size?: 'default' | 'small' | 'icon'
  children: ReactNode
}

export function Button({ variant = 'default', size = 'default', className = '', children, ...props }: Props) {
  const classes = ['btn', variant !== 'default' ? variant : '', size !== 'default' ? size : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={props.type ?? 'button'} className={classes} {...props}>
      {children}
    </button>
  )
}

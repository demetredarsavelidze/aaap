import {
  BookOpen,
  Calendar,
  ChartNoAxesColumn,
  ClipboardCheck,
  Flag,
  GraduationCap,
  LayoutDashboard,
  Medal,
  Menu,
  Repeat,
  Settings,
  Timer,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { NAV_ITEMS } from '../constants'
import { useApp } from '../store/useApp'
import { Toasts } from '../components/ui/Toasts'

const ICONS = {
  'layout-dashboard': LayoutDashboard,
  calendar: Calendar,
  flag: Flag,
  repeat: Repeat,
  timer: Timer,
  'graduation-cap': GraduationCap,
  'chart-no-axes-column': ChartNoAxesColumn,
  'clipboard-check': ClipboardCheck,
  'book-open': BookOpen,
  medal: Medal,
  settings: Settings,
} as const

export function AppLayout({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="shell" data-theme={state.settings.theme}>
      <header className="mobile-bar">
        <strong className="brand-mark">ASCENSION</strong>
        <button className="btn icon ghost" aria-label="Open navigation" onClick={() => setOpen(true)}>
          <Menu size={18} />
        </button>
      </header>
      {open ? <div className="backdrop" onClick={() => setOpen(false)} /> : null}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="spread">
          <div className="brand">
            <div className="brand-mark">ASCENSION</div>
            <div className="brand-sub">Personal operating system</div>
          </div>
          <button className="btn icon ghost mobile-close" aria-label="Close navigation" onClick={() => setOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <nav className="nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.icon]
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-footer">{state.user.name || 'Unnamed operator'}</div>
      </aside>
      <main className="main">
        <div className="page" key={location.pathname}>
          {children}
        </div>
      </main>
      <Toasts />
    </div>
  )
}

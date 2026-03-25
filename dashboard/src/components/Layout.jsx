import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: '~' },
  { to: '/sofia', label: 'Sofia', icon: 'S' },
  { to: '/conversations', label: 'Conversas', icon: 'C' },
  { to: '/rag', label: 'RAG', icon: 'R' },
  { to: '/insights', label: 'Insights', icon: 'I' },
  { to: '/blog', label: 'Blog', icon: 'B' },
]

export default function Layout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <nav className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold text-brand-500">Doctor Auto AI</h1>
          <p className="text-xs text-gray-500">Sistema Multi-Agente</p>
        </div>
        <div className="flex-1 py-2">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-500 border-r-2 border-brand-500'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`
              }
            >
              <span className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-xs font-bold">
                {icon}
              </span>
              {label}
            </NavLink>
          ))}
        </div>
        <div className="p-4 border-t border-gray-800 text-xs text-gray-600">
          v0.1.0 — Fase 6
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

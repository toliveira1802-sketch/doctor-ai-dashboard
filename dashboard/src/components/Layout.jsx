import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'

const sections = [
  {
    title: 'Principal',
    links: [
      { to: '/', label: 'Dashboard', icon: 'D', color: 'brand' },
    ],
  },
  {
    title: 'Inteligência',
    links: [
      { to: '/ia-agents', label: 'IA Agents', icon: 'IA', color: 'purple' },
      { to: '/hub', label: 'Sophia Hub', icon: 'S', color: 'amber' },
    ],
  },
  {
    title: 'Automação',
    links: [
      { to: '/agents', label: 'Agents', icon: 'AG', color: 'blue' },
      { to: '/agent-builder', label: 'Agent Builder', icon: 'AB', color: 'cyan' },
      { to: '/skill-builder', label: 'Skill Builder', icon: 'SK', color: 'pink' },
    ],
  },
]

const colorMap = {
  brand: 'bg-brand-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  cyan: 'bg-cyan-500',
  pink: 'bg-pink-500',
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <nav className={`${collapsed ? 'w-16' : 'w-60'} bg-gray-900/80 backdrop-blur border-r border-gray-800/50 flex flex-col transition-all duration-200`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold text-brand-500 tracking-tight">Doctor Auto AI</h1>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest">Command Center</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-500 text-xs transition"
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 py-3 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.title} className="mb-3">
              {!collapsed && (
                <p className="px-4 py-1 text-[10px] text-gray-600 uppercase tracking-widest font-medium">
                  {section.title}
                </p>
              )}
              {section.links.map(({ to, label, icon, color }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-gray-800 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold tracking-tight ${
                        isActive ? `${colorMap[color]} text-white shadow-lg shadow-${color}-500/20` : 'bg-gray-800 text-gray-500'
                      }`}>
                        {icon}
                      </span>
                      {!collapsed && <span className="font-medium">{label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800/50">
          {!collapsed ? (
            <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-[10px] text-gray-600">v0.2.0 — Sophia Hub</span>
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse mx-auto" />
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

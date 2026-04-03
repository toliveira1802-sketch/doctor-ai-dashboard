import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'

const sections = [
  {
    title: 'Management',
    links: [
      { to: '/', label: 'Dashboard', icon: 'D', color: 'brand' },
    ],
  },
  {
    title: 'Inteligência',
    links: [
      { to: '/ia-agents', label: 'IA Agents', icon: 'IA', color: 'purple' },
      { to: '/hub', label: 'Sophia Hub', icon: 'S', color: 'amber' },
      { to: '/brain', label: 'Digital Brain', icon: 'DB', color: 'emerald' },
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
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <nav
        className={`${collapsed ? 'w-16' : 'w-64'} shrink-0 flex flex-col transition-all duration-300 border-r border-slate-200 bg-white shadow-sm z-10`}
      >
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white text-xs font-bold leading-none">AI</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-semibold tracking-wide text-slate-800 leading-tight">
                  Doctor Auto
                </h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
                  Workspace
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 py-4 overflow-y-auto px-3 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="px-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.links.map(({ to, label, icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 font-semibold'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`w-6 flex justify-center text-lg ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {icon}
                        </span>
                        {!collapsed && <span>{label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {!collapsed ? (
            <div className="flex items-center gap-3 px-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-xs text-slate-600 font-medium tracking-wide">System Online</span>
            </div>
          ) : (
            <div className="relative flex h-2 w-2 mx-auto">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.03),transparent_40%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.03),transparent_40%)] pointer-events-none" />
        <div className="relative h-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

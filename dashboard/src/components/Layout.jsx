import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'

const sections = [
  {
    title: 'Core',
    links: [
      { to: '/', label: 'Neural Dashboard', icon: 'N', color: '#00ffff' },
      { to: '/leads', label: 'CRM Leads', icon: 'CL', color: '#ef4444' },
      { to: '/logs', label: 'System Logs', icon: 'LG', color: '#f59e0b' },
    ],
  },
  {
    title: 'Intelligence',
    links: [
      { to: '/ia-agents', label: 'IA Agents', icon: 'IA', color: '#a855f7' },
      { to: '/hub', label: 'Sophia Hub', icon: 'S', color: '#f59e0b' },
      { to: '/rag', label: 'RAG Explorer', icon: 'RE', color: '#22c55e' },
      { to: '/blog', label: 'Blog Generator', icon: 'BG', color: '#06b6d4' },
      { to: '/ingestion', label: 'Ingestion', icon: 'IN', color: '#10b981' },
      { to: '/brain', label: 'Second Brain', icon: 'TH', color: '#a855f7' },
    ],
  },
  {
    title: 'Automation',
    links: [
      { to: '/agents', label: 'Agents', icon: 'AG', color: '#3b82f6' },
      { to: '/agent-builder', label: 'Agent Builder', icon: 'AB', color: '#06b6d4' },
      { to: '/skill-builder', label: 'Skill Builder', icon: 'SK', color: '#ec4899' },
    ],
  },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <nav
        className={`${collapsed ? 'w-16' : 'w-60'} flex flex-col transition-all duration-200`}
        style={{
          background: 'linear-gradient(180deg, rgba(0,10,20,0.95) 0%, rgba(0,5,15,0.98) 100%)',
          borderRight: '1px solid rgba(0,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,255,255,0.08)' }}>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold font-mono tracking-wider" style={{ color: '#00ffff' }}>
                DOCTOR AI
              </h1>
              <p className="text-[9px] font-mono uppercase tracking-[0.25em]" style={{ color: '#00ffff40' }}>
                Command Center
              </p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded flex items-center justify-center text-xs font-mono transition hover:bg-white/5"
            style={{ color: '#00ffff60', border: '1px solid rgba(0,255,255,0.1)' }}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 py-3 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.title} className="mb-3">
              {!collapsed && (
                <p className="px-4 py-1 text-[9px] font-mono uppercase tracking-[0.3em]" style={{ color: '#00ffff30' }}>
                  {section.title}
                </p>
              )}
              {section.links.map(({ to, label, icon, color }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm font-mono transition-all duration-150 ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold tracking-tight transition-all"
                        style={isActive ? {
                          background: `${color}20`,
                          border: `1px solid ${color}50`,
                          color: color,
                          boxShadow: `0 0 12px ${color}20`,
                        } : {
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: '#6b7280',
                        }}
                      >
                        {icon}
                      </span>
                      {!collapsed && (
                        <span className="font-medium text-xs" style={isActive ? { color } : {}}>
                          {label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(0,255,255,0.08)' }}>
          {!collapsed ? (
            <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#00ffff', boxShadow: '0 0 6px #00ffff60' }} />
              <span className="text-[9px] font-mono tracking-wider" style={{ color: '#00ffff40' }}>v2.0 — JARVIS</span>
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full animate-pulse mx-auto" style={{ background: '#00ffff', boxShadow: '0 0 6px #00ffff60' }} />
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto" style={{ background: 'linear-gradient(135deg, #030812 0%, #0a0f1a 50%, #030812 100%)' }}>
        <Outlet />
      </main>
    </div>
  )
}

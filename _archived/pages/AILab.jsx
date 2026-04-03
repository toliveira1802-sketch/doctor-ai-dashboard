import { useState } from 'react'
import SophiaHub from './SophiaHub'
import IAAgents from './IAAgents'
import Agents from './Agents'
import AgentBuilder from './AgentBuilder'

const TABS = [
  { id: 'chat', label: 'Playground', icon: '◎' },
  { id: 'config', label: 'IA Agents', icon: '✧' },
  { id: 'builder', label: 'Builder', icon: '⌗' },
  { id: 'agents', label: 'Manage', icon: '⚡' },
]

export default function AILab() {
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900">
      {/* Tab Header */}
      <div className="flex items-center px-6 py-2 bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-md">
        <div className="flex items-center gap-2 mr-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <span className="text-indigo-400 text-lg">✧</span>
          </div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">AI Lab</h2>
        </div>
        
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'chat' && <SophiaHub />}
        {activeTab === 'config' && <IAAgents />}
        {activeTab === 'builder' && <AgentBuilder />}
        {activeTab === 'agents' && <Agents />}
      </div>
    </div>
  )
}

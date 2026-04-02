import { useState } from 'react'
import Leads from './Leads'
import WhatsApp from './WhatsApp'

const TABS = [
  { id: 'leads', label: 'CRM Leads', icon: '≡' },
  { id: 'channels', label: 'WhatsApp Channels', icon: '💬' },
]

export default function Communications() {
  const [activeTab, setActiveTab] = useState('leads')

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Tab Header */}
      <div className="flex items-center px-6 py-2 bg-white border-b border-slate-200 shadow-sm backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2 mr-8">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
            <span className="text-pink-600 text-lg font-bold">💬</span>
          </div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-mono">Communications</h2>
        </div>
        
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-pink-50 text-pink-600 border border-pink-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg opacity-70 group-hover:opacity-100">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-slate-50/50">
        <div className="h-full">
          {activeTab === 'leads' && <Leads />}
          {activeTab === 'channels' && <WhatsApp />}
        </div>
      </div>
    </div>
  )
}

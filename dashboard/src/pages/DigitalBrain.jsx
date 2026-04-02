import { useState } from 'react'
import RagExplorer from './RagExplorer'
import Ingestion from './Ingestion'
import SecondBrain from './SecondBrain'
import BlogGenerator from './BlogGenerator'

const TABS = [
  { id: 'library', label: 'Library', icon: '◂' },
  { id: 'ingestion', label: 'Add Data', icon: '⇡' },
  { id: 'sync', label: 'Obsidian Sync', icon: '⌥' },
  { id: 'creator', label: 'Blog Creator', icon: '▤' },
]

export default function DigitalBrain() {
  const [activeTab, setActiveTab] = useState('library')

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Tab Header */}
      <div className="flex items-center px-6 py-2 bg-white border-b border-slate-200 shadow-sm backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2 mr-8">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <span className="text-emerald-600 text-lg font-bold font-mono">⌥</span>
          </div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-mono">Digital Brain</h2>
        </div>
        
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
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
          {activeTab === 'library' && <RagExplorer />}
          {activeTab === 'ingestion' && <Ingestion />}
          {activeTab === 'sync' && <SecondBrain />}
          {activeTab === 'creator' && <BlogGenerator />}
        </div>
      </div>
    </div>
  )
}

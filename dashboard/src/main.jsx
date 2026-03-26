import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import IAAgents from './pages/IAAgents'
import Agents from './pages/Agents'
import AgentBuilder from './pages/AgentBuilder'
import SkillBuilder from './pages/SkillBuilder'
import SophiaHub from './pages/SophiaHub'
import Ingestion from './pages/Ingestion'
import Leads from './pages/Leads'
import BlogGenerator from './pages/BlogGenerator'
import RagExplorer from './pages/RagExplorer'
import Logs from './pages/Logs'
import SecondBrain from './pages/SecondBrain'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/ia-agents" element={<IAAgents />} />
          <Route path="/hub" element={<SophiaHub />} />
          <Route path="/rag" element={<RagExplorer />} />
          <Route path="/blog" element={<BlogGenerator />} />
          <Route path="/ingestion" element={<Ingestion />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agent-builder" element={<AgentBuilder />} />
          <Route path="/skill-builder" element={<SkillBuilder />} />
          <Route path="/brain" element={<SecondBrain />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ia-agents" element={<IAAgents />} />
          <Route path="/hub" element={<SophiaHub />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agent-builder" element={<AgentBuilder />} />
          <Route path="/skill-builder" element={<SkillBuilder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

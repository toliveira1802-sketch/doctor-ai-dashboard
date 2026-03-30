import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AILab from './pages/AILab'
import DigitalBrain from './pages/DigitalBrain'
import Communications from './pages/Communications'
import Logs from './pages/Logs'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ai-lab" element={<AILab />} />
          <Route path="/brain" element={<DigitalBrain />} />
          <Route path="/comm" element={<Communications />} />
          <Route path="/logs" element={<Logs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import Home from './pages/Home'
import SofiaChat from './pages/SofiaChat'
import Conversations from './pages/Conversations'
import RAGManager from './pages/RAGManager'
import Insights from './pages/Insights'
import BlogGenerator from './pages/BlogGenerator'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/sofia" element={<SofiaChat />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/rag" element={<RAGManager />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/blog" element={<BlogGenerator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

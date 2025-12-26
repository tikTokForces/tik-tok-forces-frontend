import React, { useState, useEffect } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import JobsList from './components/JobsList'
import CreateJobAdvanced from './components/CreateJobAdvanced'
import JobDetail from './components/JobDetail'
import MusicManager from './components/MusicManager'
import WatermarkManager from './components/WatermarkManager'
import FootageManager from './components/FootageManager'
import ProxyManager from './components/ProxyManager'
import UserManager from './components/UserManager'

// API URL - use environment variable in production, fallback to relative /api path
// This avoids CORS issues by using same-origin requests
const API_URL = import.meta.env.VITE_API_URL || 
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                  ? 'http://localhost:8000' 
                  : '/api')

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [apiStatus, setApiStatus] = useState(null)
  const [selectedJobId, setSelectedJobId] = useState(null)

  useEffect(() => {
    // Check API status
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setApiStatus(data))
      .catch(err => console.error('API not available:', err))
  }, [])

  const handleJobClick = (jobId) => {
    setSelectedJobId(jobId)
    setActiveTab('job-detail')
  }

  const handleBackFromJobDetail = () => {
    setSelectedJobId(null)
    setActiveTab('dashboard')
  }

  const tabs = [
    { id: 'dashboard', name: '📊 Dashboard', component: Dashboard },
    { id: 'jobs', name: '⚙️ Jobs', component: JobsList },
    { id: 'create', name: '➕ Create Job', component: CreateJobAdvanced },
    { id: 'musics', name: '🎵 Musics', component: MusicManager },
    { id: 'watermarks', name: '💧 Watermarks', component: WatermarkManager },
    { id: 'footages', name: '🎥 Footages', component: FootageManager },
    { id: 'proxies', name: '🔒 Proxies', component: ProxyManager },
    { id: 'users', name: '👥 Users', component: UserManager },
  ]

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || Dashboard

  // Show job detail if a job is selected
  if (selectedJobId) {
    return (
      <div className="app">
        <header className="header">
          <div className="container">
            <h1>🎬 TikTok Forces API Dashboard</h1>
            <div className="api-status">
              {apiStatus ? (
                <span className="status-connected">
                  ✅ Connected - {apiStatus.version}
                </span>
              ) : (
                <span className="status-disconnected">
                  ❌ API Disconnected
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="main">
          <div className="container">
            <JobDetail 
              apiUrl={API_URL} 
              jobId={selectedJobId} 
              onBack={handleBackFromJobDetail}
            />
          </div>
        </main>

        <footer className="footer">
          <div className="container">
            <p>TikTok Forces API © 2025 | Database: PostgreSQL | API: FastAPI</p>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1>🎬 TikTok Forces API Dashboard</h1>
          <div className="api-status">
            {apiStatus ? (
              <span className="status-connected">
                ✅ Connected - {apiStatus.version}
              </span>
            ) : (
              <span className="status-disconnected">
                ❌ API Disconnected
              </span>
            )}
          </div>
        </div>
      </header>

      <nav className="nav">
        <div className="container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="main">
        <div className="container">
          <ActiveComponent apiUrl={API_URL} onJobClick={handleJobClick} />
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>TikTok Forces API © 2025 | Database: PostgreSQL | API: FastAPI</p>
        </div>
      </footer>
    </div>
  )
}

export default App


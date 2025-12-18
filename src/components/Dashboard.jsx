import React, { useState, useEffect } from 'react'

export default function Dashboard({ apiUrl, onJobClick }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const [jobsRes, videosRes, assetsRes] = await Promise.all([
        fetch(`${apiUrl}/jobs`),
        fetch(`${apiUrl}/jobs`), // Using jobs endpoint, adjust if you have separate endpoints
        fetch(`${apiUrl}/jobs`)
      ])

      const jobs = await jobsRes.json()
      
      // Calculate stats from jobs
      const jobStats = {
        total: jobs.count || 0,
        completed: jobs.jobs?.filter(j => j.status === 'completed').length || 0,
        processing: jobs.jobs?.filter(j => j.status === 'processing').length || 0,
        pending: jobs.jobs?.filter(j => j.status === 'pending').length || 0,
        failed: jobs.jobs?.filter(j => j.status === 'failed').length || 0
      }

      setStats({
        jobs: jobStats,
        recentJobs: jobs.jobs?.slice(0, 5) || []
      })
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Dashboard Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.jobs?.total || 0}</div>
          <div className="stat-label">Total Jobs</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <div className="stat-value">{stats?.jobs?.completed || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
          <div className="stat-value">{stats?.jobs?.processing || 0}</div>
          <div className="stat-label">Processing</div>
        </div>
        
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }}>
          <div className="stat-value">{stats?.jobs?.pending || 0}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      <div className="card">
        <h3>Recent Jobs</h3>
        {stats?.recentJobs?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Job Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentJobs.map(job => (
                  <tr 
                    key={job.id}
                    onClick={() => onJobClick && onJobClick(job.id)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ fontWeight: '600', color: '#a5b4fc' }}>{job.job_type}</td>
                    <td>
                      <span className={`badge badge-${job.status}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>{new Date(job.created_at).toLocaleString()}</td>
                    <td>{job.processing_time_seconds ? `${job.processing_time_seconds}s` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No jobs yet</div>
            <p>Create your first job to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}


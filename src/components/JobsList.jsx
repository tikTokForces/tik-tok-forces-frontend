import React, { useState, useEffect } from 'react'

export default function JobsList({ apiUrl, onJobClick }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 3000)
    return () => clearInterval(interval)
  }, [filter])

  const fetchJobs = async () => {
    try {
      const url = filter === 'all' 
        ? `${apiUrl}/jobs` 
        : `${apiUrl}/jobs?status=${filter}`
      const res = await fetch(url)
      const data = await res.json()
      setJobs(data.jobs || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
      setLoading(false)
    }
  }

  const handleViewDetails = (jobId) => {
    if (onJobClick) {
      onJobClick(jobId)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading jobs...</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Jobs List</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'completed', 'processing', 'pending', 'failed'].map(status => (
            <button
              key={status}
              className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(status)}
              style={{ padding: '8px 16px' }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {jobs.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Started</th>
                  <th>Completed</th>
                  <th>Time (s)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr 
                    key={job.id}
                    onClick={() => handleViewDetails(job.id)}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {job.id.substring(0, 8)}...
                    </td>
                    <td style={{ fontWeight: '600', color: '#a5b4fc' }}>{job.job_type}</td>
                    <td>
                      <span className={`badge badge-${job.status}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>{job.created_at ? new Date(job.created_at).toLocaleString() : '-'}</td>
                    <td>{job.started_at ? new Date(job.started_at).toLocaleString() : '-'}</td>
                    <td>{job.completed_at ? new Date(job.completed_at).toLocaleString() : '-'}</td>
                    <td>{job.processing_time_seconds || '-'}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetails(job.id)
                        }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">⚙️</div>
            <div className="empty-state-text">No jobs found</div>
            <p>Try changing the filter or create a new job</p>
          </div>
        )}
      </div>
    </div>
  )
}


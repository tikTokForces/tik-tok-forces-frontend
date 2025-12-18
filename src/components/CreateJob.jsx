import React, { useState } from 'react'
import FileBrowser from './FileBrowser'

export default function CreateJob({ apiUrl }) {
  const [formData, setFormData] = useState({
    mode: 'video',
    count: 3,
    fps: '30',
    saturation: '1.0',
    gamma: '1.0',
    contrast: '1.0',
    video_path: '',
    output_path: ''
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [browserMode, setBrowserMode] = useState('file') // 'file' or 'directory'
  const [browserTarget, setBrowserTarget] = useState(null) // 'video_path' or 'output_path'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch(`${apiUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: formData.mode,
          count: parseInt(formData.count),
          fps: formData.fps,
          saturation: formData.saturation,
          gamma: formData.gamma,
          contrast: formData.contrast,
          video_path: formData.video_path || undefined,
          output_path: formData.output_path || undefined
        })
      })

      const data = await res.json()
      setResult({
        success: true,
        data: data
      })
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const openFileBrowser = (target, mode) => {
    setBrowserTarget(target)
    setBrowserMode(mode)
    setShowFileBrowser(true)
  }

  const handlePathSelect = (path) => {
    if (browserTarget) {
      setFormData({
        ...formData,
        [browserTarget]: path
      })
    }
    setShowFileBrowser(false)
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Create New Processing Job</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3>Job Configuration</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="video_path">Video Input Path</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  id="video_path"
                  name="video_path"
                  value={formData.video_path}
                  onChange={handleChange}
                  placeholder="/path/to/input/video.mp4"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => openFileBrowser('video_path', 'file')}
                  className="btn btn-secondary"
                  style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}
                >
                  📁 Browse
                </button>
              </div>
              <small style={{ color: '#64748b', fontSize: '12px' }}>Full path to input video file (optional)</small>
            </div>

            <div className="form-group">
              <label htmlFor="output_path">Output Path</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  id="output_path"
                  name="output_path"
                  value={formData.output_path}
                  onChange={handleChange}
                  placeholder="/path/to/output/"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => openFileBrowser('output_path', 'directory')}
                  className="btn btn-secondary"
                  style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}
                >
                  📂 Browse
                </button>
              </div>
              <small style={{ color: '#64748b', fontSize: '12px' }}>Full path to output directory (optional)</small>
            </div>

            <div className="form-group">
              <label htmlFor="mode">Processing Mode</label>
              <select
                id="mode"
                name="mode"
                value={formData.mode}
                onChange={handleChange}
              >
                <option value="video">Video</option>
                <option value="image">Image</option>
                <option value="test_mode">Test Mode</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="count">Count</label>
              <input
                type="number"
                id="count"
                name="count"
                value={formData.count}
                onChange={handleChange}
                min="1"
                max="100"
              />
              <small style={{ color: '#64748b', fontSize: '12px' }}>Number of variations to generate (1-100)</small>
            </div>

            <div className="form-group">
              <label htmlFor="fps">FPS (Frames Per Second)</label>
              <input
                type="text"
                id="fps"
                name="fps"
                value={formData.fps}
                onChange={handleChange}
                placeholder="30"
              />
            </div>

            <div className="form-group">
              <label htmlFor="saturation">Saturation</label>
              <input
                type="text"
                id="saturation"
                name="saturation"
                value={formData.saturation}
                onChange={handleChange}
                placeholder="1.0"
              />
              <small style={{ color: '#64748b', fontSize: '12px' }}>1.0 = normal, &gt;1 = more saturated, &lt;1 = less saturated</small>
            </div>

            <div className="form-group">
              <label htmlFor="gamma">Gamma</label>
              <input
                type="text"
                id="gamma"
                name="gamma"
                value={formData.gamma}
                onChange={handleChange}
                placeholder="1.0"
              />
              <small style={{ color: '#64748b', fontSize: '12px' }}>1.0 = normal, &gt;1 = lighter, &lt;1 = darker</small>
            </div>

            <div className="form-group">
              <label htmlFor="contrast">Contrast</label>
              <input
                type="text"
                id="contrast"
                name="contrast"
                value={formData.contrast}
                onChange={handleChange}
                placeholder="1.0"
              />
              <small style={{ color: '#64748b', fontSize: '12px' }}>1.0 = normal, &gt;1 = more contrast, &lt;1 = less contrast</small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Creating Job...' : '🚀 Create Job'}
            </button>
          </form>
        </div>

        <div>
          <div className="card">
            <h3>Result</h3>
            {result ? (
              <div>
                {result.success ? (
                  <div style={{ padding: '16px', background: '#10b981', borderRadius: '8px', color: 'white' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>Job Created Successfully!</div>
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
                      <div><strong>Job ID:</strong> {result.data.job_id}</div>
                      <div><strong>Status:</strong> {result.data.status}</div>
                      <div><strong>Mode:</strong> {result.data.mode}</div>
                      <div><strong>Count:</strong> {result.data.count}</div>
                      {formData.video_path && <div><strong>Video Path:</strong> {formData.video_path}</div>}
                      {formData.output_path && <div><strong>Output Path:</strong> {formData.output_path}</div>}
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '14px' }}>
                      Check the Jobs tab to view status
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px', background: '#ef4444', borderRadius: '8px', color: 'white' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>❌</div>
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>Error Creating Job</div>
                    <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '14px' }}>
                      {result.error}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <div className="empty-state-text">Fill out the form and click Create Job</div>
                <p>The result will appear here</p>
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: '24px' }}>
            <h3>About Processing Jobs</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '14px' }}>
              Processing jobs run in the background and are tracked in the database. You can:
            </p>
            <ul style={{ marginTop: '12px', marginLeft: '20px', color: '#94a3b8', lineHeight: '1.8', fontSize: '14px' }}>
              <li>Monitor progress in real-time</li>
              <li>View detailed parameters used</li>
              <li>Check processing time and status</li>
              <li>See complete history</li>
            </ul>
          </div>
        </div>
      </div>

      {/* File Browser Modal */}
      <FileBrowser
        apiUrl={apiUrl}
        isOpen={showFileBrowser}
        onClose={() => setShowFileBrowser(false)}
        onSelect={handlePathSelect}
        mode={browserMode}
      />
    </div>
  )
}


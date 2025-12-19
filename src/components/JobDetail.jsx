import React, { useState, useEffect } from 'react'

export default function JobDetail({ apiUrl, jobId, onBack }) {
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewingVideo, setViewingVideo] = useState(null)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [videoUserMap, setVideoUserMap] = useState({}) // Map video index to user
  const [videoPasswordMap, setVideoPasswordMap] = useState({}) // Map video index to user password
  const [publishing, setPublishing] = useState(false)
  const [publishMessage, setPublishMessage] = useState(null)

  useEffect(() => {
    if (jobId) {
      fetchJobDetails()
    }
  }, [jobId])

  useEffect(() => {
    if (job && job.status === 'completed') {
      loadUsers()
    }
  }, [job])

  const fetchJobDetails = async () => {
    try {
      const res = await fetch(`${apiUrl}/job/${jobId}`)
      const data = await res.json()
      console.log('Job data:', data)
      console.log('output_result:', data.output_result)
      console.log('final_videos:', data.output_result?.final_videos)
      console.log('videos:', data.output_result?.videos)
      setJob(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch job details:', error)
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch(`${apiUrl}/users?limit=1000`)
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleUserSelect = (videoIndex, userId) => {
    setVideoUserMap(prev => ({
      ...prev,
      [videoIndex]: userId
    }))
    // Clear password when user changes
    setVideoPasswordMap(prev => {
      const newMap = { ...prev }
      delete newMap[videoIndex]
      return newMap
    })
  }

  const handlePasswordChange = (videoIndex, password) => {
    setVideoPasswordMap(prev => ({
      ...prev,
      [videoIndex]: password
    }))
  }

  const handlePublish = async () => {
    if (!job || job.status !== 'completed') {
      return
    }

    const output = job.output_result || {}
    const videos = (output.final_videos && output.final_videos.length > 0) ? output.final_videos : (output.videos || [])
    
    if (videos.length === 0) {
      setPublishMessage({ type: 'error', text: 'No videos to publish' })
      return
    }

    // Check if all videos have users selected
    const missingUsers = videos.filter((_, idx) => !videoUserMap[idx])
    if (missingUsers.length > 0) {
      setPublishMessage({ type: 'error', text: `Please select users for all ${missingUsers.length} video(s)` })
      return
    }

    // Check if all videos have passwords entered
    const missingPasswords = videos.filter((_, idx) => !videoPasswordMap[idx] || videoPasswordMap[idx].trim() === '')
    if (missingPasswords.length > 0) {
      setPublishMessage({ type: 'error', text: `Please enter passwords for all ${missingPasswords.length} video(s)` })
      return
    }

    setPublishing(true)
    setPublishMessage(null)

    try {
      // Prepare video-user-proxy pairs with full data
      const videoPostItems = await Promise.all(
        videos.map(async (videoPath, idx) => {
          const userId = videoUserMap[idx]
          const userPassword = videoPasswordMap[idx]
          const user = users.find(u => u.id === userId)
          if (!user) {
            throw new Error(`User not found for video ${idx + 1}`)
          }

          // Get proxy data for this user
          let proxyData = null
          try {
            const proxyRes = await fetch(`${apiUrl}/proxies/${user.proxy_id}`)
            if (proxyRes.ok) {
              proxyData = await proxyRes.json()
            } else {
              // Fallback: get all proxies and find the one we need
              const allProxiesRes = await fetch(`${apiUrl}/proxies`)
              const allProxiesData = await allProxiesRes.json()
              proxyData = allProxiesData.proxies?.find(p => p.id === user.proxy_id) || {}
            }
          } catch (err) {
            console.error('Failed to load proxy:', err)
            proxyData = {}
          }

          return {
            final_output_video: videoPath,
            user_email: user.email,
            user_password: userPassword,
            user_username: user.username,
            proxy_login: proxyData.login || '',
            proxy_password: proxyData.password || '',
            proxy_ip: proxyData.ip || '',
            proxy_port: proxyData.port || 0
          }
        })
      )

      // Prepare request - new format with array of video-user-proxy pairs
      const requestData = {
        videos: videoPostItems
      }

      const res = await fetch(`${apiUrl}/job/${jobId}/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const data = await res.json()

      if (res.ok) {
        setPublishMessage({ type: 'success', text: `Successfully logged publish request for ${videos.length} video(s)` })
        // Clear selections after successful publish
        setVideoUserMap({})
        setVideoPasswordMap({})
      } else {
        setPublishMessage({ type: 'error', text: data.detail || 'Failed to publish videos' })
      }
    } catch (error) {
      console.error('Failed to publish videos:', error)
      setPublishMessage({ type: 'error', text: error.message || 'Failed to publish videos' })
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading job details...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <div className="empty-state-text">Job not found</div>
        <button onClick={onBack} className="btn btn-primary" style={{ marginTop: '16px' }}>
          ← Back to Jobs
        </button>
      </div>
    )
  }

  const getStatusColor = (status) => {
    const colors = {
      completed: '#10b981',
      processing: '#f59e0b',
      pending: '#6b7280',
      failed: '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  const renderParameterValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      if (value.from !== undefined && value.to !== undefined) {
        return (
          <span style={{ 
            background: 'rgba(102, 126, 234, 0.2)', 
            padding: '2px 8px', 
            borderRadius: '4px',
            fontWeight: '600'
          }}>
            {value.from} → {value.to} (range)
          </span>
        )
      }
      return JSON.stringify(value)
    }
    return String(value)
  }

  const params = job.input_params || {}
  const output = job.output_result || {}
  
  // Debug logging
  if (job && job.status === 'completed') {
    console.log('Completed job output:', output)
    console.log('final_videos:', output.final_videos)
    console.log('videos:', output.videos)
    console.log('Has final_videos:', !!(output.final_videos && output.final_videos.length > 0))
    console.log('Has videos:', !!(output.videos && output.videos.length > 0))
  }

  return (
    <div>
      {/* Video Player Modal */}
      {viewingVideo && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setViewingVideo(null)}
        >
          <div 
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: '100%',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingVideo(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                zIndex: 10000
              }}
            >
              ✕ Close
            </button>
            <video
              controls
              autoPlay
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '90vh',
                borderRadius: '8px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
              }}
              src={`${apiUrl}/serve_video?video_path=${encodeURIComponent(viewingVideo)}`}
            >
              Your browser does not support the video tag.
            </video>
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#e2e8f0',
              wordBreak: 'break-all'
            }}>
              {viewingVideo}
            </div>
          </div>
        </div>
      )}
      
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onBack} className="btn btn-secondary">
          ← Back
        </button>
        <h2 style={{ margin: 0 }}>Job Details</h2>
      </div>

      {/* Job Header Card */}
      <div className="card" style={{ 
        background: `linear-gradient(135deg, ${getStatusColor(job.status)} 0%, ${getStatusColor(job.status)}dd 100%)`,
        marginBottom: '24px'
      }}>
        <div style={{ color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
            <div>
              <h2 style={{ color: 'white', margin: '0 0 8px 0' }}>{job.job_type}</h2>
              <div style={{ fontSize: '12px', opacity: 0.9, fontFamily: 'monospace' }}>
                ID: {job.id}
              </div>
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700',
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 16px',
              borderRadius: '8px'
            }}>
              {job.status.toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Created</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                {job.created_at ? new Date(job.created_at).toLocaleString() : '-'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Started</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                {job.started_at ? new Date(job.started_at).toLocaleString() : '-'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Completed</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                {job.completed_at ? new Date(job.completed_at).toLocaleString() : '-'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Processing Time</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                {job.processing_time_seconds ? `${job.processing_time_seconds}s` : '-'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Progress</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                {job.progress_percentage}%
              </div>
            </div>
          </div>

          {job.error_message && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              <strong>Error:</strong> {job.error_message}
            </div>
          )}
        </div>
      </div>

      <div className="job-detail-columns">
        {/* Input Parameters */}
        <div className="card">
          <h3>📥 Input Parameters</h3>
          {Object.keys(params).length > 0 ? (
            <div style={{ marginTop: '16px' }}>
              {/* Video Path */}
              {params.video_path && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>📹 Input Video</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>
                    {params.video_path}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {params.video_path.split('/').pop()}
                  </div>
                </div>
              )}

              {/* Output Path */}
              {params.output_path && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>📤 Output Path</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>
                    {params.output_path}
                  </div>
                </div>
              )}

              {params.music_group && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#0f172a', borderRadius: '8px', border: `1px solid ${params.music_group.color || '#334155'}` }}>
                  <div style={{ fontSize: '12px', color: params.music_group.color || '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                    🎵 Music Group Applied
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: params.music_group.color || '#cbd5e1' }}>
                    {params.music_group.name}
                  </div>
                  {params.music_group.description && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      {params.music_group.description}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    {params.music_group.member_count} track{params.music_group.member_count === 1 ? '' : 's'} in group
                  </div>
                  {params.music_group.members && params.music_group.members.length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                      <div style={{ marginBottom: '4px' }}>Tracks:</div>
                      <ul style={{ margin: 0, paddingLeft: '16px', maxHeight: '120px', overflow: 'auto' }}>
                        {params.music_group.members.map(member => (
                          <li key={member.filename}>
                            {member.filename}
                            {!member.exists && <span style={{ color: '#f87171' }}> (missing)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {params.watermark_group && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#0f172a', borderRadius: '8px', border: `1px solid ${params.watermark_group.color || '#334155'}` }}>
                  <div style={{ fontSize: '12px', color: params.watermark_group.color || '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                    💧 Watermark Group Applied
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: params.watermark_group.color || '#cbd5e1' }}>
                    {params.watermark_group.name}
                  </div>
                  {params.watermark_group.description && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      {params.watermark_group.description}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    {params.watermark_group.member_count} asset{params.watermark_group.member_count === 1 ? '' : 's'} in group
                  </div>
                  {params.watermark_group.members && params.watermark_group.members.length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                      <div style={{ marginBottom: '4px' }}>Assets:</div>
                      <ul style={{ margin: 0, paddingLeft: '16px', maxHeight: '120px', overflow: 'auto' }}>
                        {params.watermark_group.members.map(member => (
                          <li key={member.watermark_filename}>
                            {member.watermark_filename}
                            {member.exists === false && <span style={{ color: '#f87171' }}> (missing)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {params.footage_group && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#0f172a', borderRadius: '8px', border: `1px solid ${params.footage_group.color || '#334155'}` }}>
                  <div style={{ fontSize: '12px', color: params.footage_group.color || '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                    🎬 Footage Group Applied
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: params.footage_group.color || '#cbd5e1' }}>
                    {params.footage_group.name}
                  </div>
                  {params.footage_group.description && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      {params.footage_group.description}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    {params.footage_group.member_count} asset{params.footage_group.member_count === 1 ? '' : 's'} in group
                  </div>
                  {params.footage_group.members && params.footage_group.members.length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                      <div style={{ marginBottom: '4px' }}>Assets:</div>
                      <ul style={{ margin: 0, paddingLeft: '16px', maxHeight: '120px', overflow: 'auto' }}>
                        {params.footage_group.members.map(member => (
                          <li key={member.footage_filename}>
                            {member.footage_filename}
                            {member.exists === false && <span style={{ color: '#f87171' }}> (missing)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {output.music_group && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#0f172a', borderRadius: '8px', border: `1px solid ${output.music_group.color || '#334155'}` }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: output.music_group.color || '#cbd5e1', marginBottom: '8px' }}>
                    🎵 Music Group Applied
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{output.music_group.name}</div>
                  {output.music_group.description && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      {output.music_group.description}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    {output.music_group.member_count} track{output.music_group.member_count === 1 ? '' : 's'} in group
                  </div>
                </div>
              )}

              {output.music_group_outputs && output.music_group_outputs.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '12px' }}>
                    🎧 Music Variants ({output.music_group_outputs.length})
                  </div>
                  <div style={{ maxHeight: '300px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {output.music_group_outputs.map((item, idx) => (
                      <div key={idx} style={{ padding: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Variant #{idx + 1}
                          </div>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => setViewingVideo(item.output_video)}
                          >
                            ▶️ Preview
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                          Music: {item.music_file?.split('/').pop()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>
                          Output: {item.output_video || 'Unknown'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {output.music_group_error && (
                <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '12px' }}>
                  ⚠️ Music Group Error: {output.music_group_error}
                </div>
              )}

              {output.watermark_group && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#0f172a', borderRadius: '8px', border: `1px solid ${output.watermark_group.color || '#334155'}` }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: output.watermark_group.color || '#cbd5e1', marginBottom: '8px' }}>
                    💧 Watermark Group Applied
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{output.watermark_group.name}</div>
                  {output.watermark_group.description && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      {output.watermark_group.description}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    {output.watermark_group.member_count} asset{output.watermark_group.member_count === 1 ? '' : 's'} in group
                  </div>
                </div>
              )}

              {output.watermark_group_outputs && output.watermark_group_outputs.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '12px' }}>
                    💧 Watermark Variants ({output.watermark_group_outputs.length})
                  </div>
                  <div style={{ maxHeight: '300px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {output.watermark_group_outputs.map((item, idx) => (
                      <div key={idx} style={{ padding: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Variant #{idx + 1}
                          </div>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => setViewingVideo(item.output_video)}
                          >
                            ▶️ Preview
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                          Watermark: {item.watermark_file?.split('/').pop()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>
                          Output: {item.output_video || 'Unknown'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {output.watermark_group_error && (
                <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '12px' }}>
                  ⚠️ Watermark Group Error: {output.watermark_group_error}
                </div>
              )}

              {output.footage_group && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#0f172a', borderRadius: '8px', border: `1px solid ${output.footage_group.color || '#334155'}` }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: output.footage_group.color || '#cbd5e1', marginBottom: '8px' }}>
                    🎬 Footage Group Applied
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{output.footage_group.name}</div>
                  {output.footage_group.description && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      {output.footage_group.description}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    {output.footage_group.member_count} asset{output.footage_group.member_count === 1 ? '' : 's'} in group
                  </div>
                </div>
              )}

              {output.footage_group_outputs && output.footage_group_outputs.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '12px' }}>
                    🎥 Footage Variants ({output.footage_group_outputs.length})
                  </div>
                  <div style={{ maxHeight: '300px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {output.footage_group_outputs.map((item, idx) => (
                      <div key={idx} style={{ padding: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Variant #{idx + 1}
                          </div>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => setViewingVideo(item.output_video)}
                          >
                            ▶️ Preview
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                          Footage: {item.footage_file?.split('/').pop()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>
                          Output: {item.output_video || 'Unknown'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {output.footage_group_error && (
                <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '12px' }}>
                  ⚠️ Footage Group Error: {output.footage_group_error}
                </div>
              )}

              {(() => {
                const finalVideos = output.final_videos || []
                const videos = output.videos || []
                const allVideos = finalVideos.length > 0 ? finalVideos : videos
                return allVideos.length > 0
              })() ? (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>✅ Final Output Videos ({(() => {
                      const finalVideos = output.final_videos || []
                      const videos = output.videos || []
                      return (finalVideos.length > 0 ? finalVideos : videos).length
                    })()})</span>
                    {job.status === 'completed' && (() => {
                      const output = job.output_result || {}
                      const videos = output.final_videos || output.videos || []
                      const allVideosHaveUsers = videos.length > 0 && videos.every((_, idx) => videoUserMap[idx] && videoPasswordMap[idx] && videoPasswordMap[idx].trim() !== '')
                      const isDisabled = publishing || loadingUsers || !allVideosHaveUsers
                      
                      return (
                        <button
                          onClick={handlePublish}
                          disabled={isDisabled}
                          className="btn btn-primary"
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            background: isDisabled ? '#64748b' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.6 : 1
                          }}
                          title={!allVideosHaveUsers ? 'Please select users and enter passwords for all videos' : ''}
                        >
                          {publishing ? '⏳ Publishing...' : '📤 Publish Videos'}
                        </button>
                      )
                    })()}
                  </div>
                  {publishMessage && (
                    <div style={{
                      marginBottom: '12px',
                      padding: '12px',
                      background: publishMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${publishMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: '6px',
                      color: publishMessage.type === 'success' ? '#10b981' : '#ef4444',
                      fontSize: '13px'
                    }}>
                      {publishMessage.text}
                    </div>
                  )}
                  <div style={{ maxHeight: '400px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(() => {
                      const finalVideos = output.final_videos || []
                      const videos = output.videos || []
                      return (finalVideos.length > 0 ? finalVideos : videos)
                    })().map((videoPath, idx) => (
                      <div key={idx} style={{ padding: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Final #{idx + 1}
                          </div>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => setViewingVideo(videoPath)}
                          >
                            ▶️ Preview
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', wordBreak: 'break-all', marginBottom: '12px' }}>
                          {videoPath}
                        </div>
                        {job.status === 'completed' && (
                          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #334155' }}>
                            <label style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                              👤 Select User for this video:
                            </label>
                            {loadingUsers ? (
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Loading users...</div>
                            ) : (
                              <select
                                value={videoUserMap[idx] || ''}
                                onChange={(e) => handleUserSelect(idx, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  background: '#1e293b',
                                  border: '1px solid #334155',
                                  borderRadius: '6px',
                                  color: '#e2e8f0',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  marginBottom: '12px'
                                }}
                              >
                                <option value="">-- Select User --</option>
                                {users.filter(u => u.is_active).map(user => (
                                  <option key={user.id} value={user.id}>
                                    {user.username} ({user.email})
                                  </option>
                                ))}
                              </select>
                            )}
                            {videoUserMap[idx] && (
                              <>
                                <label style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                                  🔒 Enter User Password:
                                </label>
                                <input
                                  type="password"
                                  value={videoPasswordMap[idx] || ''}
                                  onChange={(e) => handlePasswordChange(idx, e.target.value)}
                                  placeholder="Enter user password"
                                  style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '6px',
                                    color: '#e2e8f0',
                                    fontSize: '13px',
                                    marginBottom: '6px'
                                  }}
                                />
                                {videoPasswordMap[idx] && videoPasswordMap[idx].trim() !== '' && (
                                  <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
                                    ✓ Password entered
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Parameters Table */}
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '12px' }}>Processing Parameters</h4>
                <div className="table-container" style={{ maxHeight: '400px', overflow: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(params)
                        .filter(([key]) => key !== 'video_path' && key !== 'output_path')
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([key, value]) => (
                          <tr key={key}>
                            <td style={{ fontWeight: '600', color: '#cbd5e1' }}>{key}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                              {renderParameterValue(value)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-text">No input parameters</div>
            </div>
          )}
        </div>

        {/* Output Results */}
        <div className="card">
          <h3>📤 Output Results</h3>
          {output && Object.keys(output).length > 0 ? (
            <div style={{ marginTop: '16px' }}>
              {/* Generated Videos List */}
              {(output.videos || output.output || (output.reports && output.reports.length > 0)) && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '12px' }}>
                    🎬 Generated Videos ({output.videos?.length || output.reports?.length || 1})
                  </div>
                  
                  {/* If we have a videos array */}
                  {output.videos && output.videos.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                      {output.videos.map((videoPath, idx) => {
                        // Calculate parameter values for this variation
                        const getRangeValue = (param) => {
                          if (!param || typeof param !== 'object' || !param.from || !param.to) return null
                          
                          // Extract numeric values from strings like "128k", "5000k", etc.
                          const extractNumber = (val) => {
                            if (typeof val === 'number') return val
                            if (typeof val === 'string') {
                              // Remove non-numeric characters except decimal point and minus sign
                              const numStr = val.replace(/[^0-9.-]/g, '')
                              return parseFloat(numStr) || 0
                            }
                            return 0
                          }
                          
                          const fromNum = extractNumber(param.from)
                          const toNum = extractNumber(param.to)
                          const total = output.videos.length
                          const step = total > 1 ? (toNum - fromNum) / (total - 1) : 0
                          const value = fromNum + (step * idx)
                          
                          // Format based on whether original had units
                          if (typeof param.from === 'string' && param.from.includes('k')) {
                            return `${Math.round(value)}k`
                          }
                          return value.toFixed(2)
                        }
                        
                        return (
                          <div key={idx} style={{ 
                            marginBottom: '12px', 
                            padding: '12px', 
                            background: '#0f172a', 
                            borderRadius: '6px',
                            border: '1px solid #334155'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ 
                                  fontSize: '16px',
                                  fontWeight: '700',
                                  color: '#a5b4fc',
                                  background: 'rgba(165, 180, 252, 0.1)',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  minWidth: '40px',
                                  textAlign: 'center'
                                }}>
                                  #{idx + 1}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Video {idx + 1} of {output.videos.length}
                                </div>
                              </div>
                              
                              {/* Show parameter values for this variation */}
                              {Object.keys(params).some(key => params[key] && typeof params[key] === 'object' && params[key].from) && (
                                <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {Object.entries(params).map(([key, value]) => {
                                    const rangeVal = getRangeValue(value)
                                    if (rangeVal) {
                                      return (
                                        <span key={key} style={{ 
                                          background: 'rgba(102, 126, 234, 0.2)', 
                                          padding: '2px 6px', 
                                          borderRadius: '3px',
                                          fontWeight: '600'
                                        }}>
                                          {key}: {rangeVal}
                                        </span>
                                      )
                                    }
                                    return null
                                  })}
                                </div>
                              )}
                            </div>
                            
                            <div style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', color: '#e2e8f0' }}>
                              {videoPath}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                              📁 {videoPath.split('/').pop()}
                            </div>
                            <button
                              onClick={() => setViewingVideo(videoPath)}
                              style={{
                                marginTop: '8px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              ▶️ See Video
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : output.reports && output.reports.length > 0 ? (
                    /* Extract paths from reports if available */
                    <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                      {output.reports.map((report, idx) => (
                        <div key={idx} style={{ 
                          marginBottom: '12px', 
                          padding: '12px', 
                          background: '#0f172a', 
                          borderRadius: '6px',
                          border: '1px solid #334155'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <div style={{ 
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#a5b4fc',
                              background: 'rgba(165, 180, 252, 0.1)',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              minWidth: '40px',
                              textAlign: 'center'
                            }}>
                              #{idx + 1}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Video {idx + 1} of {output.reports.length}
                            </div>
                          </div>
                          {report.output && (
                            <>
                              <div style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', color: '#e2e8f0' }}>
                                {report.output}
                              </div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                📁 {report.output.split('/').pop()}
                              </div>
                              <button
                                onClick={() => setViewingVideo(report.output)}
                                style={{
                                  marginTop: '8px',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                ▶️ See Video
                              </button>
                            </>
                          )}
                          {report.input && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                              Input: {report.input.split('/').pop()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : output.output ? (
                    /* Single output video */
                    <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ 
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#a5b4fc',
                          background: 'rgba(165, 180, 252, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '4px'
                        }}>
                          #1
                        </div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all', color: '#e2e8f0' }}>
                        {output.output}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        📁 {output.output.split('/').pop()}
                      </div>
                      <button
                        onClick={() => setViewingVideo(output.output)}
                        style={{
                          marginTop: '8px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        ▶️ See Video
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Reports */}
              {output.reports && output.reports.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '12px' }}>
                    Processing Reports ({output.reports.length})
                  </h4>
                  <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                    {output.reports.map((report, idx) => (
                      <div key={idx} style={{ 
                        marginBottom: '12px', 
                        padding: '12px', 
                        background: '#0f172a', 
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px', color: '#a5b4fc' }}>
                          Report #{idx + 1}
                        </div>
                        <pre style={{ 
                          margin: 0, 
                          fontSize: '11px', 
                          color: '#94a3b8',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {JSON.stringify(report, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Output Data */}
              <div>
                <h4 style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '12px' }}>Complete Output Data</h4>
                <div style={{ 
                  padding: '12px', 
                  background: '#0f172a', 
                  borderRadius: '6px',
                  fontSize: '12px',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
                  <pre style={{ 
                    margin: 0, 
                    color: '#94a3b8',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {JSON.stringify(output, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-text">No output data yet</div>
              <p>Output will appear when job completes</p>
            </div>
          )}
        </div>
      </div>

      {/* Parameter Breakdown by Category */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h3>🔍 Parameter Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {/* Video Properties */}
          {(params.fps || params.bit_m_video || params.bit_m_audio || params.width_height) && (
            <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', color: '#a5b4fc', marginBottom: '12px' }}>📹 Video Properties</h4>
              {params.fps && <ParamItem label="FPS" value={params.fps} />}
              {params.bit_m_video && <ParamItem label="Video Bitrate" value={params.bit_m_video} />}
              {params.bit_m_audio && <ParamItem label="Audio Bitrate" value={params.bit_m_audio} />}
              {params.width_height && <ParamItem label="Resolution" value={params.width_height} />}
            </div>
          )}

          {/* Color Adjustments */}
          {(params.saturation || params.contrast || params.gamma || params.vibrance) && (
            <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', color: '#f9a8d4', marginBottom: '12px' }}>🎨 Color</h4>
              {params.saturation && <ParamItem label="Saturation" value={params.saturation} />}
              {params.contrast && <ParamItem label="Contrast" value={params.contrast} />}
              {params.gamma && <ParamItem label="Gamma" value={params.gamma} />}
              {params.gamma_r && <ParamItem label="Gamma R" value={params.gamma_r} />}
              {params.gamma_g && <ParamItem label="Gamma G" value={params.gamma_g} />}
              {params.gamma_b && <ParamItem label="Gamma B" value={params.gamma_b} />}
              {params.vibrance && <ParamItem label="Vibrance" value={params.vibrance} />}
              {params.eq && <ParamItem label="EQ" value={params.eq} />}
            </div>
          )}

          {/* Effects */}
          {(params.gblur || params.noise || params.tmix_frames || params.fade) && (
            <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', color: '#fde047', marginBottom: '12px' }}>✨ Effects</h4>
              {params.gblur && <ParamItem label="Gaussian Blur" value={params.gblur} />}
              {params.noise && <ParamItem label="Noise" value={params.noise} />}
              {params.tmix_frames && <ParamItem label="TMix Frames" value={params.tmix_frames} />}
              {params.fade && <ParamItem label="Fade" value={params.fade} />}
            </div>
          )}

          {/* Geometric */}
          {(params.scale || params.crop || params.rotate || params.crop_width || params.crop_height) && (
            <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', color: '#86efac', marginBottom: '12px' }}>📐 Geometric</h4>
              {params.scale && <ParamItem label="Scale" value={params.scale} />}
              {params.crop && <ParamItem label="Crop" value={params.crop} />}
              {params.crop_width && <ParamItem label="Crop Width" value={params.crop_width} />}
              {params.crop_height && <ParamItem label="Crop Height" value={params.crop_height} />}
              {params.rotate && <ParamItem label="Rotate" value={params.rotate} />}
              {params.mirror_horizontally && <ParamItem label="Mirror H" value="Yes" />}
              {params.mirror_vertically && <ParamItem label="Mirror V" value="Yes" />}
            </div>
          )}

          {/* Speed */}
          {(params.speed_video || params.speed_audio) && (
            <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', color: '#fbbf24', marginBottom: '12px' }}>⚡ Speed</h4>
              {params.speed_video && <ParamItem label="Video Speed" value={params.speed_video} />}
              {params.speed_audio && <ParamItem label="Audio Speed" value={params.speed_audio} />}
            </div>
          )}
        </div>
      </div>

      {/* Raw JSON Data */}
      <div className="card">
        <h3>📋 Complete Job Data (JSON)</h3>
        <div style={{ 
          marginTop: '16px',
          padding: '16px',
          background: '#0f172a',
          borderRadius: '8px',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          <pre style={{ 
            margin: 0,
            fontSize: '12px',
            color: '#94a3b8',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: '1.6'
          }}>
            {JSON.stringify(job, null, 2)}
          </pre>
        </div>
      </div>
    </div>
    </div>
  )
}

// Helper component for parameter items
function ParamItem({ label, value }) {
  const renderValue = (val) => {
    if (typeof val === 'object' && val !== null) {
      if (val.from !== undefined && val.to !== undefined) {
        return (
          <span style={{ 
            background: 'rgba(102, 126, 234, 0.3)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontWeight: '600'
          }}>
            {val.from} → {val.to}
          </span>
        )
      }
      return JSON.stringify(val)
    }
    return String(val)
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: '8px 0',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      fontSize: '13px'
    }}>
      <span style={{ color: '#94a3b8' }}>{label}:</span>
      <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>
        {renderValue(value)}
      </span>
    </div>
  )
}


import React, { useState, useEffect } from 'react'

export default function FootageManager({ apiUrl }) {
  const [footages, setFootages] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState(null)
  const [showGroups, setShowGroups] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [newGroupColor, setNewGroupColor] = useState('#f97316')

  useEffect(() => {
    loadFootages()
    loadGroups()
  }, [])

  const loadFootages = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/assets/footages`)
      const data = await response.json()
      setFootages(data.footages || [])
    } catch (error) {
      console.error('Failed to load footages:', error)
      setMessage({ type: 'error', text: 'Failed to load footages' })
    } finally {
      setLoading(false)
}
  }

  const loadGroups = async () => {
    setGroupsLoading(true)
    try {
      const response = await fetch(`${apiUrl}/assets/footages/groups`)
      const data = await response.json()
      setGroups(data.groups || [])
    } catch (error) {
      console.error('Failed to load footage groups:', error)
    } finally {
      setGroupsLoading(false)
    }
  }

  const handleUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${apiUrl}/assets/footages/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: `Uploaded: ${data.name}` })
        await loadFootages()
        await loadGroups()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Upload failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Upload failed: ' + error.message })
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleDelete = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return

    try {
      const response = await fetch(`${apiUrl}/assets/footages/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Deleted: ${filename}` })
        await loadFootages()
        await loadGroups()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Delete failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Delete failed: ' + error.message })
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a group name' })
      return
    }

    try {
      const response = await fetch(`${apiUrl}/assets/footages/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
          color: newGroupColor
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: `Group "${data.name}" created` })
        setShowCreateGroup(false)
        setNewGroupName('')
        setNewGroupDescription('')
        setNewGroupColor('#f97316')
        await loadGroups()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to create group' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create group: ' + error.message })
    }
  }

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!confirm(`Delete group "${groupName}"? This will remove all footages from the group.`)) return

    try {
      const response = await fetch(`${apiUrl}/assets/footages/groups/${groupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Group "${groupName}" deleted` })
        await loadGroups()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to delete group' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete group: ' + error.message })
    }
  }

  const handleAddToGroup = async (footageFilename, groupId) => {
    try {
      const response = await fetch(`${apiUrl}/assets/footages/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ footage_filename: footageFilename })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Added "${footageFilename}" to group` })
        await loadGroups()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to add to group' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add to group: ' + error.message })
    }
  }

  const handleRemoveFromGroup = async (footageFilename, groupId) => {
    try {
      const response = await fetch(`${apiUrl}/assets/footages/groups/${groupId}/members/${encodeURIComponent(footageFilename)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Removed "${footageFilename}" from group` })
        await loadGroups()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to remove from group' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove from group: ' + error.message })
    }
  }

  const getGroupsForFootage = (filename) =>
    groups.filter(group => group.members?.some(m => m.footage_filename === filename))

  const formatDate = (timestamp) => new Date(timestamp * 1000).toLocaleString()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>🎬 Footage Library</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${showGroups ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowGroups(!showGroups)}
          >
            📁 {showGroups ? 'Hide' : 'Show'} Groups
          </button>
          <label className="btn btn-primary" style={{ cursor: 'pointer', position: 'relative' }}>
            {uploading ? 'Uploading...' : '📤 Upload Footage'}
            <input
              type="file"
              accept=".mp4,.mov,.avi,.mkv,.webm"
              onChange={handleUpload}
              disabled={uploading}
              style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
            />
          </label>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '16px' }}>
          {message.text}
        </div>
      )}

      {showGroups && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>🎯 Footage Groups</h3>
            <button className="btn btn-primary" onClick={() => setShowCreateGroup(true)}>
              ➕ Create Group
            </button>
          </div>

          {showCreateGroup && (
            <div style={{ padding: '16px', background: '#1e293b', borderRadius: '8px', marginBottom: '16px' }}>
              <h4 style={{ marginBottom: '12px' }}>Create New Group</h4>
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Optional description"
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="color"
                  value={newGroupColor}
                  onChange={(e) => setNewGroupColor(e.target.value)}
                  style={{ width: '100px', height: '40px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" onClick={handleCreateGroup}>
                  ✅ Create
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateGroup(false)
                    setNewGroupName('')
                    setNewGroupDescription('')
                    setNewGroupColor('#f97316')
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}

          {groupsLoading ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <div className="empty-state-text">Loading groups...</div>
            </div>
          ) : groups.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {groups.map(group => (
                <div
                  key={group.id}
                  style={{
                    padding: '16px',
                    background: '#1e293b',
                    borderRadius: '8px',
                    border: `2px solid ${group.color || '#f97316'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: group.color || '#f97316' }}>{group.name}</h4>
                      {group.description && (
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>{group.description}</p>
                      )}
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                        {group.member_count} file{group.member_count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      🗑️
                    </button>
                  </div>
                  {group.members?.length > 0 && (
                    <div style={{ marginTop: '12px', fontSize: '12px' }}>
                      <strong style={{ color: '#cbd5e1' }}>Files:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px', color: '#94a3b8' }}>
                        {group.members.map((member, idx) => (
                          <li key={idx}>
                            {member.footage_filename}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '20px' }}>
              <div className="empty-state-text">No groups yet</div>
              <p>Create a group to organize your footage overlays</p>
            </div>
          )}
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
          <div className="stat-value">{footages.length}</div>
          <div className="stat-label">Total Footage Files</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
          <div className="stat-value">
            {footages.reduce((sum, f) => sum + f.size_mb, 0).toFixed(2)} MB
          </div>
          <div className="stat-label">Total Size</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-text">Loading...</div>
          </div>
        ) : footages.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Modified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {footages.map((footage, index) => {
                  const assignedGroups = getGroupsForFootage(footage.name)
                  return (
                    <tr key={index}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>🎬</span>
                          {footage.name}
                        </div>
                      </td>
                      <td>{footage.size_mb} MB</td>
                      <td>{formatDate(footage.modified)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {groups.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAddToGroup(footage.name, e.target.value)
                                  e.target.value = ''
                                }
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#334155',
                                border: '1px solid #475569',
                                borderRadius: '6px',
                                color: '#e2e8f0',
                                fontSize: '14px',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">➕ Add to Group</option>
                              {groups.map(group => (
                                <option key={group.id} value={group.id}>
                                  {group.name} {assignedGroups.some(g => g.id === group.id) ? '✓' : ''}
                                </option>
                              ))}
                            </select>
                          )}

                          {assignedGroups.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {assignedGroups.map(group => (
                                <span
                                  key={group.id}
                                  style={{
                                    padding: '4px 8px',
                                    background: group.color || '#f97316',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  {group.name}
                                  <button
                                    onClick={() => handleRemoveFromGroup(footage.name, group.id)}
                                    style={{
                                      background: 'rgba(0,0,0,0.2)',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: '16px',
                                      height: '16px',
                                      color: 'white',
                                      cursor: 'pointer',
                                      fontSize: '10px',
                                      padding: 0
                                    }}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(footage.name)}
                            style={{ padding: '6px 12px', fontSize: '14px' }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🎬</div>
            <div className="empty-state-text">No footage files</div>
            <p>Upload footage videos to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

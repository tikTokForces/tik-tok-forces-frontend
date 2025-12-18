import React, { useState, useEffect } from 'react'

export default function ProxyManager({ apiUrl }) {
  const [proxies, setProxies] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [showCreateProxy, setShowCreateProxy] = useState(false)
  const [editingProxy, setEditingProxy] = useState(null)
  
  // Proxy form state
  const [proxyForm, setProxyForm] = useState({
    login: '',
    password: '',
    ip: '',
    port: ''
  })

  useEffect(() => {
    loadProxies()
  }, [])

  const loadProxies = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/proxies`)
      const data = await response.json()
      setProxies(data.proxies || [])
    } catch (error) {
      console.error('Failed to load proxies:', error)
      setMessage({ type: 'error', text: 'Failed to load proxies' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProxy = async () => {
    if (!proxyForm.login.trim() || !proxyForm.password.trim() || !proxyForm.ip.trim() || !proxyForm.port.trim()) {
      setMessage({ type: 'error', text: 'All fields are required' })
      return
    }

    const port = parseInt(proxyForm.port)
    if (isNaN(port) || port < 1 || port > 65535) {
      setMessage({ type: 'error', text: 'Port must be a number between 1 and 65535' })
      return
    }

    try {
      const response = await fetch(`${apiUrl}/proxies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login: proxyForm.login.trim(),
          password: proxyForm.password.trim(),
          ip: proxyForm.ip.trim(),
          port: port
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: `Proxy "${data.ip}:${data.port}" created` })
        setShowCreateProxy(false)
        resetProxyForm()
        await loadProxies()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to create proxy' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create proxy: ' + error.message })
    }
  }

  const handleUpdateProxy = async (proxyId) => {
    const updateData = {}
    if (proxyForm.login.trim()) updateData.login = proxyForm.login.trim()
    if (proxyForm.password.trim()) updateData.password = proxyForm.password.trim()
    if (proxyForm.ip.trim()) updateData.ip = proxyForm.ip.trim()
    if (proxyForm.port.trim()) {
      const port = parseInt(proxyForm.port)
      if (isNaN(port) || port < 1 || port > 65535) {
        setMessage({ type: 'error', text: 'Port must be a number between 1 and 65535' })
        return
      }
      updateData.port = port
    }

    if (Object.keys(updateData).length === 0) {
      setMessage({ type: 'error', text: 'Please fill at least one field to update' })
      return
    }

    try {
      const response = await fetch(`${apiUrl}/proxies/${proxyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Proxy updated' })
        setEditingProxy(null)
        resetProxyForm()
        await loadProxies()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to update proxy' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update proxy: ' + error.message })
    }
  }

  const handleDeleteProxy = async (proxyId, ip, port) => {
    if (!confirm(`Delete proxy "${ip}:${port}"? This will fail if any users are using this proxy.`)) return

    try {
      const response = await fetch(`${apiUrl}/proxies/${proxyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Proxy "${ip}:${port}" deleted` })
        await loadProxies()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to delete proxy' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete proxy: ' + error.message })
    }
  }

  const handleEditProxy = (proxy) => {
    setEditingProxy(proxy.id)
    setProxyForm({
      login: proxy.login || '',
      password: '',
      ip: proxy.ip || '',
      port: proxy.port?.toString() || ''
    })
    setShowCreateProxy(true)
  }

  const resetProxyForm = () => {
    setProxyForm({
      login: '',
      password: '',
      ip: '',
      port: ''
    })
    setEditingProxy(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>🔒 Proxy Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetProxyForm()
            setShowCreateProxy(true)
          }}
        >
          ➕ Create Proxy
        </button>
      </div>

      {showCreateProxy && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>{editingProxy ? '✏️ Edit Proxy' : '➕ Create Proxy'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label>Login *</label>
              <input
                type="text"
                value={proxyForm.login}
                onChange={(e) => setProxyForm({ ...proxyForm, login: e.target.value })}
                placeholder="Enter proxy login"
              />
            </div>
            <div className="form-group">
              <label>Password {editingProxy ? '(leave empty to keep current)' : '*'}</label>
              <input
                type="password"
                value={proxyForm.password}
                onChange={(e) => setProxyForm({ ...proxyForm, password: e.target.value })}
                placeholder={editingProxy ? "Leave empty to keep current" : "Enter proxy password"}
              />
            </div>
            <div className="form-group">
              <label>IP Address *</label>
              <input
                type="text"
                value={proxyForm.ip}
                onChange={(e) => setProxyForm({ ...proxyForm, ip: e.target.value })}
                placeholder="192.168.1.1"
              />
            </div>
            <div className="form-group">
              <label>Port *</label>
              <input
                type="number"
                value={proxyForm.port}
                onChange={(e) => setProxyForm({ ...proxyForm, port: e.target.value })}
                placeholder="8080"
                min="1"
                max="65535"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              className="btn btn-primary"
              onClick={() => editingProxy ? handleUpdateProxy(editingProxy) : handleCreateProxy()}
            >
              ✅ {editingProxy ? 'Update' : 'Create'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowCreateProxy(false)
                resetProxyForm()
              }}
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '16px' }}>
          {message.text}
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="stat-value">{proxies.length}</div>
          <div className="stat-label">Total Proxies</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-text">Loading...</div>
          </div>
        ) : proxies.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Login</th>
                  <th>IP Address</th>
                  <th>Port</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {proxies.map((proxy) => (
                  <tr key={proxy.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🔒</span>
                        <strong>{proxy.login}</strong>
                      </div>
                    </td>
                    <td>
                      <code style={{ 
                        padding: '4px 8px', 
                        background: '#1e293b', 
                        borderRadius: '4px',
                        color: '#60a5fa'
                      }}>
                        {proxy.ip}
                      </code>
                    </td>
                    <td>
                      <code style={{ 
                        padding: '4px 8px', 
                        background: '#1e293b', 
                        borderRadius: '4px',
                        color: '#60a5fa'
                      }}>
                        {proxy.port}
                      </code>
                    </td>
                    <td>{formatDate(proxy.created_at)}</td>
                    <td>{formatDate(proxy.updated_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEditProxy(proxy)}
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteProxy(proxy.id, proxy.ip, proxy.port)}
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🔒</div>
            <div className="empty-state-text">No proxies</div>
            <p>Create a proxy to get started. Users require a proxy to be created.</p>
          </div>
        )}
      </div>
    </div>
  )
}



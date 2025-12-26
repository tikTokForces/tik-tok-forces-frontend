import React, { useState, useEffect } from 'react'

export default function UserManager({ apiUrl }) {
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [proxies, setProxies] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [showGroups, setShowGroups] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  
  // User form state
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    email: '',
    proxy_id: '',
    full_name: '',
    is_active: true,
    is_admin: false,
    priority: 50
  })
  
  // Group form state
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    color: '#667eea'
  })

  useEffect(() => {
    loadUsers()
    loadGroups()
    loadProxies()
  }, [])

  const loadProxies = async () => {
    try {
      const response = await fetch(`${apiUrl}/proxies`)
      const data = await response.json()
      setProxies(data.proxies || [])
    } catch (error) {
      console.error('Failed to load proxies:', error)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/users`)
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
      setMessage({ type: 'error', text: 'Failed to load users' })
    } finally {
      setLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      const response = await fetch(`${apiUrl}/users/groups`)
      const data = await response.json()
      setGroups(data.groups || [])
    } catch (error) {
      console.error('Failed to load groups:', error)
    }
  }

  const handleCreateUser = async () => {
    if (!userForm.username.trim() || !userForm.password.trim() || !userForm.email.trim() || !userForm.proxy_id) {
      setMessage({ type: 'error', text: 'Username, password, email, and proxy are required' })
      return
    }

    try {
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: `User "${data.username}" created` })
        setShowCreateUser(false)
        resetUserForm()
        await loadUsers()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to create user' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create user: ' + error.message })
    }
  }

  const handleUpdateUser = async (userId) => {
    try {
      const updateData = { ...userForm }
      // Don't send password if it's empty
      if (!updateData.password) {
        delete updateData.password
      }
      // Don't send proxy_id if it's empty (keep current)
      if (!updateData.proxy_id) {
        delete updateData.proxy_id
      }

      const response = await fetch(`${apiUrl}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'User updated' })
        setEditingUser(null)
        resetUserForm()
        await loadUsers()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to update user' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update user: ' + error.message })
    }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Delete user "${username}"?`)) return

    try {
      const response = await fetch(`${apiUrl}/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `User "${username}" deleted` })
        await loadUsers()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to delete user' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete user: ' + error.message })
    }
  }

  const handleEditUser = (user) => {
    setEditingUser(user.id)
    setUserForm({
      username: user.username,
      password: '',
      email: user.email || '',
      proxy_id: user.proxy_id || '',
      full_name: user.full_name || '',
      is_active: user.is_active,
      is_admin: user.is_admin,
      priority: user.priority || 50
    })
    setShowCreateUser(true)
  }

  const resetUserForm = () => {
    setUserForm({
      username: '',
      password: '',
      email: '',
      proxy_id: '',
      full_name: '',
      is_active: true,
      is_admin: false,
      priority: 50
    })
    setEditingUser(null)
  }

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a group name' })
      return
    }

    try {
      const response = await fetch(`${apiUrl}/users/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: groupForm.name.trim(),
          description: groupForm.description.trim() || null,
          color: groupForm.color
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: `Group "${data.name}" created` })
        setShowCreateGroup(false)
        setGroupForm({ name: '', description: '', color: '#667eea' })
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
    if (!confirm(`Delete group "${groupName}"? This will remove all users from the group.`)) return

    try {
      const response = await fetch(`${apiUrl}/users/groups/${groupId}`, {
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

  const handleAddUserToGroup = async (userId, groupId) => {
    try {
      const response = await fetch(`${apiUrl}/users/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'User added to group' })
        await loadGroups()
        await loadUsers()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to add user to group' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add user to group: ' + error.message })
    }
  }

  const handleRemoveUserFromGroup = async (userId, groupId) => {
    try {
      const response = await fetch(`${apiUrl}/users/groups/${groupId}/members/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'User removed from group' })
        await loadGroups()
        await loadUsers()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to remove user from group' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove user from group: ' + error.message })
    }
  }

  const getUserGroups = (userId) => {
    return groups.filter(group => 
      group.members.some(m => m.user_id === userId)
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>👥 User Management</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${showGroups ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowGroups(!showGroups)}
          >
            📁 {showGroups ? 'Hide' : 'Show'} Groups
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetUserForm()
              setShowCreateUser(true)
            }}
          >
            ➕ Create User
          </button>
        </div>
      </div>

      {showGroups && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>🎯 User Groups</h3>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateGroup(true)}
            >
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
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="Enter group name"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="Optional description"
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="color"
                  value={groupForm.color}
                  onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })}
                  style={{ width: '100px', height: '40px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" onClick={handleCreateGroup}>
                  ✅ Create
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  setShowCreateGroup(false)
                  setGroupForm({ name: '', description: '', color: '#667eea' })
                }}>
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}

          {groups.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {groups.map((group) => (
                <div
                  key={group.id}
                  style={{
                    padding: '16px',
                    background: '#1e293b',
                    borderRadius: '8px',
                    border: `2px solid ${group.color || '#667eea'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: group.color || '#667eea' }}>{group.name}</h4>
                      {group.description && (
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>{group.description}</p>
                      )}
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                        {group.member_count} {group.member_count === 1 ? 'user' : 'users'}
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
                  {group.members.length > 0 && (
                    <div style={{ marginTop: '12px', fontSize: '12px' }}>
                      <strong style={{ color: '#cbd5e1' }}>Users:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px', color: '#94a3b8' }}>
                        {group.members.map((member, idx) => (
                          <li key={idx}>
                            {member.username || member.user_id} {member.role && `(${member.role})`}
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
              <p>Create a group to organize your users</p>
            </div>
          )}
        </div>
      )}

      {showCreateUser && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>{editingUser ? '✏️ Edit User' : '➕ Create User'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                placeholder="Enter username"
                disabled={!!editingUser}
              />
            </div>
            <div className="form-group">
              <label>Password {editingUser ? '(leave empty to keep current)' : '*'}</label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder={editingUser ? "Leave empty to keep current" : "Enter password"}
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Proxy {editingUser ? '' : '*'}</label>
              <select
                value={userForm.proxy_id}
                onChange={(e) => setUserForm({ ...userForm, proxy_id: e.target.value })}
                required={!editingUser}
                style={{
                  padding: '12px',
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  width: '100%'
                }}
              >
                <option value="">{editingUser ? 'Keep current proxy' : 'Select a proxy...'}</option>
                {proxies.map(proxy => (
                  <option key={proxy.id} value={proxy.id}>
                    {proxy.ip}:{proxy.port} ({proxy.login})
                  </option>
                ))}
              </select>
              {proxies.length === 0 && (
                <small style={{ color: '#f59e0b', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  ⚠️ No proxies available. Please create a proxy first.
                </small>
              )}
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={userForm.is_active}
                  onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Active
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={userForm.is_admin}
                  onChange={(e) => setUserForm({ ...userForm, is_admin: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Admin
              </label>
            </div>
            <div className="form-group">
              <label>Priority (1-100, 1 = highest) *</label>
              <input
                type="number"
                min="1"
                max="100"
                value={userForm.priority}
                onChange={(e) => setUserForm({ ...userForm, priority: parseInt(e.target.value) || 50 })}
                placeholder="50"
                required
              />
              <small style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                1 = highest priority (assigned first), 100 = lowest priority
              </small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              className="btn btn-primary"
              onClick={() => editingUser ? handleUpdateUser(editingUser) : handleCreateUser()}
            >
              ✅ {editingUser ? 'Update' : 'Create'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowCreateUser(false)
                resetUserForm()
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
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <div className="stat-value">{users.filter(u => u.is_active).length}</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <div className="stat-value">{groups.length}</div>
          <div className="stat-label">User Groups</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-text">Loading...</div>
          </div>
        ) : users.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Priority</th>
                  <th>Proxy</th>
                  <th>Status</th>
                  <th>Groups</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>👤</span>
                        <strong>{user.username}</strong>
                        {user.is_admin && (
                          <span style={{ 
                            padding: '2px 6px', 
                            background: '#f59e0b', 
                            borderRadius: '4px', 
                            fontSize: '10px',
                            color: 'white'
                          }}>
                            ADMIN
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{user.email || '-'}</td>
                    <td>{user.full_name || '-'}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: user.priority <= 20 ? '#10b981' : user.priority <= 50 ? '#f59e0b' : '#64748b',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        {user.priority || 50}
                      </span>
                    </td>
                    <td>
                      {user.proxy_id ? (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          background: '#1e293b',
                          color: '#60a5fa',
                          fontFamily: 'monospace'
                        }}>
                          {proxies.find(p => p.id === user.proxy_id) 
                            ? `${proxies.find(p => p.id === user.proxy_id).ip}:${proxies.find(p => p.id === user.proxy_id).port}`
                            : user.proxy_id.substring(0, 8) + '...'}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: user.is_active ? '#10b981' : '#ef4444',
                        color: 'white'
                      }}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {getUserGroups(user.id).map(group => (
                          <span
                            key={group.id}
                            style={{
                              padding: '4px 8px',
                              background: group.color || '#667eea',
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
                              onClick={() => handleRemoveUserFromGroup(user.id, group.id)}
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
                        {groups.length > 0 && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddUserToGroup(user.id, e.target.value)
                                e.target.value = ''
                              }
                            }}
                            style={{
                              padding: '4px 8px',
                              background: '#334155',
                              border: '1px solid #475569',
                              borderRadius: '4px',
                              color: '#e2e8f0',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="">➕ Add to Group</option>
                            {groups.filter(g => !getUserGroups(user.id).some(ug => ug.id === g.id)).map(group => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEditUser(user)}
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteUser(user.id, user.username)}
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
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-text">No users</div>
            <p>Create a user to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}


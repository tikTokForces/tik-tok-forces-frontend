import React, { useState, useEffect } from 'react'

export default function FileBrowser({ apiUrl, isOpen, onClose, onSelect, mode = 'file' }) {
  const [currentPath, setCurrentPath] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [quickPaths, setQuickPaths] = useState([])

  useEffect(() => {
    if (isOpen) {
      fetchQuickPaths()
      browse(null) // Browse project root by default
    }
  }, [isOpen])

  const fetchQuickPaths = async () => {
    try {
      const res = await fetch(`${apiUrl}/quickpaths`)
      const data = await res.json()
      setQuickPaths(data.quick_paths || [])
    } catch (error) {
      console.error('Failed to fetch quick paths:', error)
    }
  }

  const browse = async (path) => {
    setLoading(true)
    try {
      const url = path 
        ? `${apiUrl}/browse?path=${encodeURIComponent(path)}`
        : `${apiUrl}/browse`
      
      const res = await fetch(url)
      const data = await res.json()
      
      setCurrentPath(data.current_path)
      setItems(data.items || [])
    } catch (error) {
      console.error('Failed to browse:', error)
      alert('Failed to browse path: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = (item) => {
    if (item.type === 'directory' || item.is_parent) {
      browse(item.path)
    } else if (mode === 'file') {
      // Select file
      onSelect(item.path)
      onClose()
    }
  }

  const handleSelectFolder = () => {
    if (mode === 'directory') {
      onSelect(currentPath)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>
            {mode === 'file' ? '📁 Select Video File' : '📂 Select Output Folder'}
          </h3>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {/* Quick Paths */}
        <div style={styles.quickPaths}>
          <strong>Quick Access:</strong>
          <div style={styles.quickPathsGrid}>
            {quickPaths.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => browse(qp.path)}
                style={styles.quickPathButton}
                onMouseEnter={(e) => e.currentTarget.style.background = '#475569'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#334155'}
              >
                {qp.name}
              </button>
            ))}
          </div>
        </div>

        {/* Current Path */}
        <div style={styles.currentPath}>
          <strong>Current Path:</strong>
          <div style={styles.pathDisplay}>{currentPath || 'Loading...'}</div>
          {mode === 'directory' && currentPath && (
            <button onClick={handleSelectFolder} style={styles.selectButton}>
              ✅ Select This Folder
            </button>
          )}
        </div>

        {/* File List */}
        <div style={styles.fileList}>
          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Size</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={idx}
                    onClick={() => handleItemClick(item)}
                    style={styles.row}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={styles.td}>
                      <span style={{ marginRight: '8px' }}>
                        {item.is_parent ? '⬆️' : item.type === 'directory' ? '📁' : 
                         item.extension === '.mp4' || item.extension === '.mov' || item.extension === '.avi' ? '🎬' :
                         item.extension === '.mp3' ? '🎵' : '📄'}
                      </span>
                      {item.name}
                    </td>
                    <td style={styles.td}>
                      {item.is_parent ? 'Parent' : item.type === 'directory' ? 'Folder' : 
                       item.extension || 'File'}
                    </td>
                    <td style={styles.td}>
                      {item.size ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelButton}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#1e293b',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #334155',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #334155',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0 8px',
  },
  quickPaths: {
    padding: '16px 20px',
    borderBottom: '1px solid #334155',
    background: '#0f172a',
  },
  quickPathsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '8px',
    marginTop: '8px',
  },
  quickPathButton: {
    padding: '8px 12px',
    background: '#334155',
    border: 'none',
    borderRadius: '6px',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: '12px',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  currentPath: {
    padding: '16px 20px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  pathDisplay: {
    flex: 1,
    padding: '8px 12px',
    background: '#0f172a',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#94a3b8',
  },
  selectButton: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '600',
  },
  fileList: {
    flex: 1,
    overflow: 'auto',
    padding: '0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 20px',
    background: '#0f172a',
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: '12px',
    textTransform: 'uppercase',
    position: 'sticky',
    top: 0,
  },
  td: {
    padding: '12px 20px',
    borderBottom: '1px solid #334155',
    color: '#e2e8f0',
  },
  row: {
    cursor: 'pointer',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8',
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid #334155',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '8px 24px',
    background: '#334155',
    border: 'none',
    borderRadius: '6px',
    color: '#e2e8f0',
    cursor: 'pointer',
  },
}


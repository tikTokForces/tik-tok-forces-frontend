import React, { useState } from 'react'

export default function AssetsList({ apiUrl }) {
  const [assets] = useState([])
  const [filter, setFilter] = useState('all')

  const assetTypes = ['all', 'footage', 'music', 'watermark', 'subtitle', 'transition']

  const filteredAssets = filter === 'all' 
    ? assets 
    : assets.filter(a => a.asset_type === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Assets Library</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {assetTypes.map(type => (
            <button
              key={type}
              className={`btn ${filter === type ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(type)}
              style={{ padding: '8px 16px' }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
          <div className="stat-value">0</div>
          <div className="stat-label">Total Assets</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
          <div className="stat-value">0</div>
          <div className="stat-label">Footages</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
          <div className="stat-value">0</div>
          <div className="stat-label">Music Tracks</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
          <div className="stat-value">0</div>
          <div className="stat-label">Watermarks</div>
        </div>
      </div>

      <div className="card">
        {filteredAssets.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Duration</th>
                  <th>Tags</th>
                  <th>Public</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => (
                  <tr key={asset.id}>
                    <td>{asset.name}</td>
                    <td>
                      <span className={`badge badge-completed`}>
                        {asset.asset_type}
                      </span>
                    </td>
                    <td>{(asset.file_size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                    <td>{asset.duration_seconds ? `${asset.duration_seconds}s` : '-'}</td>
                    <td>{asset.tags?.join(', ') || '-'}</td>
                    <td>{asset.is_public ? '✅' : '❌'}</td>
                    <td>{new Date(asset.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-text">No assets found</div>
            <p>Assets will be automatically logged when using processing steps with database integration</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3>About Assets</h3>
        <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '12px' }}>
          The Assets library stores reusable content for your video processing:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎬</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Footages</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Overlay videos and effects</div>
          </div>
          <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎵</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Music</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Background music tracks</div>
          </div>
          <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💧</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Watermarks</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Logo and branding overlays</div>
          </div>
          <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Subtitles</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Subtitle templates</div>
          </div>
        </div>
      </div>
    </div>
  )
}


import React, { useState } from 'react'

export default function VideosList({ apiUrl }) {
  const [videos] = useState([])

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Videos Library</h2>
      
      <div className="card">
        <p style={{ marginBottom: '16px', color: '#94a3b8' }}>
          Video library shows all videos that have been processed through the system.
        </p>
        
        {videos.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Size</th>
                  <th>Duration</th>
                  <th>Dimensions</th>
                  <th>FPS</th>
                  <th>Codec</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {videos.map(video => (
                  <tr key={video.id}>
                    <td>{video.original_filename}</td>
                    <td>{(video.file_size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                    <td>{video.duration_seconds}s</td>
                    <td>{video.width}x{video.height}</td>
                    <td>{video.fps}</td>
                    <td>{video.codec}</td>
                    <td>{new Date(video.uploaded_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🎬</div>
            <div className="empty-state-text">No videos yet</div>
            <p>Videos will appear here after processing with database logging enabled</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3>About Video Tracking</h3>
        <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
          When you process videos with database logging enabled (see STEP19-SubtitlesOverlays example),
          all video metadata is automatically saved here including:
        </p>
        <ul style={{ marginTop: '12px', marginLeft: '20px', color: '#94a3b8', lineHeight: '1.8' }}>
          <li>File information (name, size, path)</li>
          <li>Video properties (dimensions, duration, FPS, codec)</li>
          <li>Audio presence</li>
          <li>Custom metadata</li>
        </ul>
      </div>
    </div>
  )
}


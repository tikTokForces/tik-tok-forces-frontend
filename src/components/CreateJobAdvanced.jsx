import React, { useState, useEffect } from 'react'
import FileBrowser from './FileBrowser'
import RangeInput from './RangeInput'

export default function CreateJobAdvanced({ apiUrl }) {
  const [formData, setFormData] = useState({
    // Paths
    video_path: '',
    output_path: '',
    mode: 'editVideoMassUniqFromOneVideo',  // Mode for creating variations
    count: 3,
    
    // Video Properties
    fps: 30,
    width_height: '',
    bit_m_video: 5000,
    bit_m_audio: 128,
    codec: 'h264',
    
    // Color Adjustments
    saturation: 1.0,
    contrast: 1.0,
    gamma: 1.0,
    gamma_r: 1.0,
    gamma_g: 1.0,
    gamma_b: 1.0,
    gamma_weight: 0.4,
    vibrance: 0.0,
    eq: 0.0,
    
    // Geometric Transforms
    scale: '',
    crop: '',
    crop_width: 0,
    crop_height: 0,
    rotate: 0,
    mirror_horizontally: false,
    mirror_vertically: false,
    
    // Effects
    gblur: 0,
    tmix_frames: 0,
    noise: 0,
    fade: '',
    
    // Speed
    speed_video: 1.0,
    speed_audio: 1.0,
    
    // Options
    delete_input: false,
    random_config: false,
    output: '.mp4',
    music_group_id: '',
    watermark_group_id: '',
    footage_group_id: '',

    // Group Controls
    music_volume: 1.0,
    watermark_size: 1.0,
    watermark_opacity: 1.0,
    footage_opacity: 1.0,
    music_delete_video_audio: true
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [browserMode, setBrowserMode] = useState('file')
  const [browserTarget, setBrowserTarget] = useState(null)
  const [videoMetadata, setVideoMetadata] = useState(null)
  const [activeSection, setActiveSection] = useState('basic')
  const [musicGroups, setMusicGroups] = useState([])
  const [musicGroupsLoading, setMusicGroupsLoading] = useState(false)
  const [musicGroupsError, setMusicGroupsError] = useState(null)
  const [watermarkGroups, setWatermarkGroups] = useState([])
  const [watermarkGroupsLoading, setWatermarkGroupsLoading] = useState(false)
  const [watermarkGroupsError, setWatermarkGroupsError] = useState(null)
  const [footageGroups, setFootageGroups] = useState([])
  const [footageGroupsLoading, setFootageGroupsLoading] = useState(false)
  const [footageGroupsError, setFootageGroupsError] = useState(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  // Load video metadata when path changes
  useEffect(() => {
    if (formData.video_path) {
      loadVideoMetadata(formData.video_path)
    }
  }, [formData.video_path])

  useEffect(() => {
    const fetchMusicGroups = async () => {
      setMusicGroupsLoading(true)
      setMusicGroupsError(null)
      try {
        const res = await fetch(`${apiUrl}/assets/musics/groups`)
        if (!res.ok) {
          throw new Error(`Status ${res.status}`)
        }
        const data = await res.json()
        setMusicGroups(data.groups || [])
      } catch (error) {
        console.error('Failed to load music groups:', error)
        setMusicGroupsError('Failed to load music groups')
      } finally {
        setMusicGroupsLoading(false)
      }
    }

    const fetchWatermarkGroups = async () => {
      setWatermarkGroupsLoading(true)
      setWatermarkGroupsError(null)
      try {
        const res = await fetch(`${apiUrl}/assets/watermarks/groups`)
        if (!res.ok) {
          throw new Error(`Status ${res.status}`)
        }
        const data = await res.json()
        setWatermarkGroups(data.groups || [])
      } catch (error) {
        console.error('Failed to load watermark groups:', error)
        setWatermarkGroupsError('Failed to load watermark groups')
      } finally {
        setWatermarkGroupsLoading(false)
      }
    }

    const fetchFootageGroups = async () => {
      setFootageGroupsLoading(true)
      setFootageGroupsError(null)
      try {
        const res = await fetch(`${apiUrl}/assets/footages/groups`)
        if (!res.ok) {
          throw new Error(`Status ${res.status}`)
        }
        const data = await res.json()
        setFootageGroups(data.groups || [])
      } catch (error) {
        console.error('Failed to load footage groups:', error)
        setFootageGroupsError('Failed to load footage groups')
      } finally {
        setFootageGroupsLoading(false)
      }
    }

    fetchMusicGroups()
    fetchWatermarkGroups()
    fetchFootageGroups()
  }, [apiUrl])

  const handleVideoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingVideo(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${apiUrl}/assets/videos/upload`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'Upload failed')
      }

      const data = await res.json()
      setFormData(prev => ({ ...prev, video_path: data.path }))
    } catch (error) {
      setUploadError(error.message)
      console.error('Video upload error:', error)
    } finally {
      setUploadingVideo(false)
      // Reset input
      event.target.value = ''
    }
  }

  const loadVideoMetadata = async (videoPath) => {
    try {
      // Use the new /video_params endpoint to get complete parameter set
      const res = await fetch(`${apiUrl}/video_params?video_path=${encodeURIComponent(videoPath)}`)
      if (res.ok) {
        const data = await res.json()
        setVideoMetadata(data.metadata)
        
        // Extract parameter values from the params object
        const params = data.params
        
        // Set all parameters from video
        setFormData(prev => ({
          ...prev,
          // Video Properties - extract numeric values from strings
          fps: parseInt(params.fps) || 30,
          bit_m_video: parseInt(params.bit_m_video.replace('k', '')) || 5000,
          bit_m_audio: parseInt(params.bit_m_audio.replace('k', '')) || 128,
          width_height: params.width_height || '',
          
          // Use video defaults for color/adjustments if available
          saturation: parseFloat(params.saturation) || 1.0,
          contrast: parseFloat(params.contrast) || 1.0,
          gamma: parseFloat(params.gamma) || 1.0,
          gamma_r: parseFloat(params.gamma_r) || 1.0,
          gamma_g: parseFloat(params.gamma_g) || 1.0,
          gamma_b: parseFloat(params.gamma_b) || 1.0,
          gamma_weight: parseFloat(params.gamma_weight) || 0.4,
          vibrance: parseFloat(params.vibrance) || 0.0,
          eq: parseFloat(params.eq) || 0.0,
          
          // Geometric transforms
          scale: params.scale || '',
          crop: params.crop || '',
          crop_width: parseInt(params.crop_width) || 0,
          crop_height: parseInt(params.crop_height) || 0,
          rotate: parseFloat(params.rotate) || 0,
          mirror_horizontally: params.mirror_horizontally === 'True' || params.mirror_horizontally === true,
          mirror_vertically: params.mirror_vertically === 'True' || params.mirror_vertically === true,
          
          // Effects
          gblur: parseFloat(params.gblur) || 0,
          tmix_frames: parseFloat(params.tmix_frames) || 0,
          noise: parseFloat(params.noise) || 0,
          fade: params.fade || '',
          
          // Speed
          speed_video: parseFloat(params.speed_video.replace('*PTS', '')) || 1.0,
          speed_audio: parseFloat(params.speed_audio) || 1.0,
          
          // Options
          delete_input: params.delete_input === 'True' || params.delete_input === true,
          random_config: params.random_config === 'True' || params.random_config === true,
          output: params.output || '.mp4'
        }))
      }
    } catch (error) {
      console.error('Failed to load video metadata:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      // Helper function to convert value (can be number or range object)
      const formatValue = (value, defaultVal) => {
        if (value === null || value === undefined) return undefined
        if (typeof value === 'object' && value.mode === 'range') {
          // Range mode: send as object
          return { from: value.from, to: value.to }
        }
        // Single value mode
        if (typeof value === 'number') {
          return value === defaultVal ? undefined : String(value)
        }
        return String(value)
      }

      // Build request body
      const requestData = {
        mode: formData.mode,
        count: parseInt(formData.count),
        video_path: formData.video_path || undefined,
        output_path: formData.output_path || undefined,
        music_group_id: formData.music_group_id || undefined,
        watermark_group_id: formData.watermark_group_id || undefined,
        footage_group_id: formData.footage_group_id || undefined,
        music_volume: formData.music_group_id ? Number(formData.music_volume) : undefined,
        music_delete_video_audio: formData.music_group_id ? Boolean(formData.music_delete_video_audio) : undefined,
        watermark_size: formData.watermark_group_id ? Number(formData.watermark_size) : undefined,
        watermark_opacity: formData.watermark_group_id ? Number(formData.watermark_opacity) : undefined,
        footage_opacity: formData.footage_group_id ? Number(formData.footage_opacity) : undefined,
        
        // Video properties (supports ranges!)
        fps: formData.fps && typeof formData.fps === 'object' && formData.fps.mode === 'range' 
          ? { from: formData.fps.from, to: formData.fps.to }
          : formData.fps ? String(formData.fps) : undefined,
        width_height: formData.width_height || undefined,
        bit_m_video: formData.bit_m_video && typeof formData.bit_m_video === 'object' && formData.bit_m_video.mode === 'range'
          ? { from: `${formData.bit_m_video.from}k`, to: `${formData.bit_m_video.to}k` }
          : formData.bit_m_video ? `${formData.bit_m_video}k` : undefined,
        bit_m_audio: formData.bit_m_audio && typeof formData.bit_m_audio === 'object' && formData.bit_m_audio.mode === 'range'
          ? { from: `${formData.bit_m_audio.from}k`, to: `${formData.bit_m_audio.to}k` }
          : formData.bit_m_audio ? `${formData.bit_m_audio}k` : undefined,
        output: formData.output || undefined,
        
        // Color adjustments (supports ranges!)
        saturation: formatValue(formData.saturation, 1.0),
        contrast: formatValue(formData.contrast, 1.0),
        gamma: formatValue(formData.gamma, 1.0),
        gamma_r: formatValue(formData.gamma_r, 1.0),
        gamma_g: formatValue(formData.gamma_g, 1.0),
        gamma_b: formatValue(formData.gamma_b, 1.0),
        gamma_weight: formatValue(formData.gamma_weight, 0.4),
        vibrance: formatValue(formData.vibrance, 0.0),
        eq: formatValue(formData.eq, 0.0),
        
        // Geometric (supports ranges!)
        scale: formData.scale || undefined,
        crop: formData.crop || undefined,
        crop_width: formatValue(formData.crop_width, 0),
        crop_height: formatValue(formData.crop_height, 0),
        rotate: formatValue(formData.rotate, 0),
        mirror_horizontally: formData.mirror_horizontally ? 'hflip' : undefined,
        mirror_vertically: formData.mirror_vertically ? 'vflip' : undefined,
        
        // Effects (supports ranges!)
        gblur: formatValue(formData.gblur, 0),
        tmix_frames: formatValue(formData.tmix_frames, 0),
        noise: formatValue(formData.noise, 0),
        fade: formData.fade || undefined,
        
        // Speed (supports ranges!)
        speed_video: formatValue(formData.speed_video, 1.0),
        speed_audio: formatValue(formData.speed_audio, 1.0),
        
        // Options
        delete_input: formData.delete_input || undefined,
        random_config: formData.random_config || undefined,
      }

      const res = await fetch(`${apiUrl}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const data = await res.json()
      setResult({ success: true, data })
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    // Handle range values (object with from/to)
    if (value && typeof value === 'object' && value.mode === 'range') {
      setFormData({
        ...formData,
        [name]: value // Store the whole object { from, to, mode: 'range' }
      })
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : type === 'number' || type === 'range' ? parseFloat(value) : value
      })
    }
  }

  const openFileBrowser = (target, mode) => {
    setBrowserTarget(target)
    setBrowserMode(mode)
    setShowFileBrowser(true)
  }

  const handlePathSelect = (path) => {
    if (browserTarget) {
      setFormData({ ...formData, [browserTarget]: path })
    }
    setShowFileBrowser(false)
  }

  const resetToDefaults = () => {
    if (videoMetadata) {
      setFormData(prev => ({
        ...prev,
        fps: videoMetadata.fps || 30,
        bit_m_video: Math.round((videoMetadata.video_bitrate || 5000000) / 1000),
        bit_m_audio: Math.round((videoMetadata.audio_bitrate || 128000) / 1000),
        saturation: 1.0,
        contrast: 1.0,
        gamma: 1.0,
        gamma_r: 1.0,
        gamma_g: 1.0,
        gamma_b: 1.0,
      }))
    }
  }

  const selectedMusicGroup = musicGroups.find(group => group.id === formData.music_group_id)
  const selectedWatermarkGroup = watermarkGroups.find(group => group.id === formData.watermark_group_id)
  const selectedFootageGroup = footageGroups.find(group => group.id === formData.footage_group_id)

  const sections = {
    basic: '🎬 Basic Settings',
    video: '📹 Video Properties',
    color: '🎨 Color Adjustments',
    geometry: '📐 Geometric Transforms',
    effects: '✨ Effects',
    speed: '⚡ Speed Controls',
    options: '⚙️ Options'
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Create New Processing Job (Advanced)</h2>
      
      {/* Video Info Card */}
      {videoMetadata && (
        <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <h3 style={{ color: 'white', marginBottom: '12px' }}>📹 Original Video Info</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', color: 'white' }}>
            <div><strong>Size:</strong> {(videoMetadata.file_size / 1024 / 1024).toFixed(2)} MB</div>
            <div><strong>Duration:</strong> {videoMetadata.duration.toFixed(2)}s</div>
            <div><strong>Resolution:</strong> {videoMetadata.width}x{videoMetadata.height}</div>
            <div><strong>FPS:</strong> {videoMetadata.fps}</div>
            <div><strong>Codec:</strong> {videoMetadata.codec}</div>
            <div><strong>Has Audio:</strong> {videoMetadata.has_audio ? 'Yes' : 'No'}</div>
          </div>
          <button
            type="button"
            onClick={resetToDefaults}
            className="btn btn-secondary"
            style={{ marginTop: '12px' }}
          >
            🔄 Reset to Original Values
          </button>
        </div>
      )}

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {Object.entries(sections).map(([key, label]) => (
          <button
            key={key}
            className={`btn ${activeSection === key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSection(key)}
            style={{ padding: '8px 16px' }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3>{sections[activeSection]}</h3>
          <form onSubmit={handleSubmit}>
            
            {/* Basic Settings */}
            {activeSection === 'basic' && (
              <>
                <FormGroup label="Video Input Path" helpText="Upload from your computer or select from server">
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      name="video_path"
                      value={formData.video_path}
                      onChange={handleChange}
                      placeholder="/path/to/input/video.mp4"
                      style={{ flex: 1, minWidth: '200px' }}
                    />
                    <label className="btn btn-primary" style={{ cursor: 'pointer', position: 'relative' }}>
                      {uploadingVideo ? '⏳ Uploading...' : '📤 Upload Video'}
                      <input
                        type="file"
                        accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv"
                        onChange={handleVideoUpload}
                        disabled={uploadingVideo}
                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      />
                    </label>
                    <button type="button" onClick={() => openFileBrowser('video_path', 'file')} className="btn btn-secondary">
                      📁 Browse Server
                    </button>
                  </div>
                  {uploadError && (
                    <small style={{ color: '#f87171', display: 'block', marginTop: '4px' }}>
                      ❌ {uploadError}
                    </small>
                  )}
                  {formData.video_path && (
                    <small style={{ color: '#10b981', display: 'block', marginTop: '4px' }}>
                      ✅ {formData.video_path.split('/').pop()}
                    </small>
                  )}
                </FormGroup>

                <FormGroup label="Output Path" helpText="Leave empty to auto-generate, or select custom output folder">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      name="output_path"
                      value={formData.output_path}
                      onChange={handleChange}
                      placeholder="Auto-generated if empty"
                      style={{ flex: 1 }}
                    />
                    <button type="button" onClick={() => openFileBrowser('output_path', 'directory')} className="btn btn-secondary">
                      📂 Browse
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, output_path: '' }))} 
                      className="btn btn-secondary"
                      title="Clear to use auto-generated path"
                    >
                      🔄 Auto
                    </button>
                  </div>
                  {!formData.output_path && (
                    <small style={{ color: '#10b981', display: 'block', marginTop: '4px' }}>
                      ✅ Output path will be auto-generated on server
                    </small>
                  )}
                </FormGroup>

                <FormGroup label="Music Group" helpText="Optional: apply a saved music group to generated videos">
                  <select
                    name="music_group_id"
                    value={formData.music_group_id}
                    onChange={handleChange}
                  >
                    <option value="">No music group</option>
                    {musicGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.member_count} tracks)
                      </option>
                    ))}
                  </select>
                  {musicGroupsLoading && (
                    <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                      Loading groups...
                    </small>
                  )}
                  {musicGroupsError && (
                    <small style={{ color: '#f87171', display: 'block', marginTop: '4px' }}>
                      {musicGroupsError}
                    </small>
                  )}
                  {selectedMusicGroup && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: '#0f172a',
                        borderRadius: '8px',
                        border: `1px solid ${selectedMusicGroup.color || '#334155'}`
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '600', color: selectedMusicGroup.color || '#cbd5e1' }}>
                        {selectedMusicGroup.name}
                      </div>
                      {selectedMusicGroup.description && (
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          {selectedMusicGroup.description}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                        {selectedMusicGroup.member_count} track{selectedMusicGroup.member_count === 1 ? '' : 's'}
                      </div>
                      {selectedMusicGroup.members && selectedMusicGroup.members.length > 0 && (
                        <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                          <div style={{ marginBottom: '4px' }}>Preview:</div>
                          <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            {selectedMusicGroup.members.slice(0, 3).map(member => (
                              <li key={member.filename}>
                                {member.filename}
                                {!member.exists && <span style={{ color: '#f87171' }}> (missing)</span>}
                              </li>
                            ))}
                            {selectedMusicGroup.member_count > 3 && (
                              <li>...and {selectedMusicGroup.member_count - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ marginTop: '16px' }}>
                    <RangeInput
                      label="Music Volume"
                      name="music_volume"
                      value={formData.music_volume}
                      onChange={handleChange}
                      min={0}
                      max={2}
                      step={0.05}
                      defaultValue={1.0}
                      helpText="Adjust blend between base audio (0 = muted, 1 = original volume, 2 = boosted)"
                      allowRange={false}
                    />
                    <FormGroup label="Replace Original Audio" helpText="Disable to keep the base video's audio mixed with the new music">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                        <input
                          type="checkbox"
                          name="music_delete_video_audio"
                          checked={formData.music_delete_video_audio}
                          onChange={handleChange}
                        />
                        Remove original audio track
                      </label>
                    </FormGroup>
                  </div>
                </FormGroup>

                <FormGroup label="Watermark Group" helpText="Optional: apply saved watermark overlays">
                  <select
                    name="watermark_group_id"
                    value={formData.watermark_group_id}
                    onChange={handleChange}
                  >
                    <option value="">No watermark group</option>
                    {watermarkGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.member_count} assets)
                      </option>
                    ))}
                  </select>
                  {watermarkGroupsLoading && (
                    <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                      Loading groups...
                    </small>
                  )}
                  {watermarkGroupsError && (
                    <small style={{ color: '#f87171', display: 'block', marginTop: '4px' }}>
                      {watermarkGroupsError}
                    </small>
                  )}
                  {selectedWatermarkGroup && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: '#0f172a',
                        borderRadius: '8px',
                        border: `1px solid ${selectedWatermarkGroup.color || '#334155'}`
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '600', color: selectedWatermarkGroup.color || '#cbd5e1' }}>
                        {selectedWatermarkGroup.name}
                      </div>
                      {selectedWatermarkGroup.description && (
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          {selectedWatermarkGroup.description}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                        {selectedWatermarkGroup.member_count} asset{selectedWatermarkGroup.member_count === 1 ? '' : 's'}
                      </div>
                      {selectedWatermarkGroup.members && selectedWatermarkGroup.members.length > 0 && (
                        <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                          <div style={{ marginBottom: '4px' }}>Preview:</div>
                          <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            {selectedWatermarkGroup.members.slice(0, 3).map(member => (
                              <li key={member.watermark_filename}>
                                {member.watermark_filename}
                                {!member.exists && <span style={{ color: '#f87171' }}> (missing)</span>}
                              </li>
                            ))}
                            {selectedWatermarkGroup.member_count > 3 && (
                              <li>...and {selectedWatermarkGroup.member_count - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ marginTop: '16px' }}>
                    <RangeInput
                      label="Watermark Size"
                      name="watermark_size"
                      value={formData.watermark_size}
                      onChange={handleChange}
                      min={0.1}
                      max={1.5}
                      step={0.05}
                      defaultValue={1.0}
                      helpText="Scale watermark relative to original (0.1 = 10%, 1.0 = original size)"
                      allowRange={false}
                    />
                    <RangeInput
                      label="Watermark Opacity"
                      name="watermark_opacity"
                      value={formData.watermark_opacity}
                      onChange={handleChange}
                      min={0}
                      max={1}
                      step={0.05}
                      defaultValue={1.0}
                      helpText="Transparency level (0 = invisible, 1 = fully opaque)"
                      allowRange={false}
                    />
                  </div>
                </FormGroup>

                <FormGroup label="Footage Group" helpText="Optional: apply saved footage overlays">
                  <select
                    name="footage_group_id"
                    value={formData.footage_group_id}
                    onChange={handleChange}
                  >
                    <option value="">No footage group</option>
                    {footageGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.member_count} assets)
                      </option>
                    ))}
                  </select>
                  {footageGroupsLoading && (
                    <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                      Loading groups...
                    </small>
                  )}
                  {footageGroupsError && (
                    <small style={{ color: '#f87171', display: 'block', marginTop: '4px' }}>
                      {footageGroupsError}
                    </small>
                  )}
                  {selectedFootageGroup && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: '#0f172a',
                        borderRadius: '8px',
                        border: `1px solid ${selectedFootageGroup.color || '#334155'}`
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '600', color: selectedFootageGroup.color || '#cbd5e1' }}>
                        {selectedFootageGroup.name}
                      </div>
                      {selectedFootageGroup.description && (
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          {selectedFootageGroup.description}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                        {selectedFootageGroup.member_count} asset{selectedFootageGroup.member_count === 1 ? '' : 's'}
                      </div>
                      {selectedFootageGroup.members && selectedFootageGroup.members.length > 0 && (
                        <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                          <div style={{ marginBottom: '4px' }}>Preview:</div>
                          <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            {selectedFootageGroup.members.slice(0, 3).map(member => (
                              <li key={member.footage_filename}>
                                {member.footage_filename}
                                {!member.exists && <span style={{ color: '#f87171' }}> (missing)</span>}
                              </li>
                            ))}
                            {selectedFootageGroup.member_count > 3 && (
                              <li>...and {selectedFootageGroup.member_count - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ marginTop: '16px' }}>
                    <RangeInput
                      label="Footage Opacity"
                      name="footage_opacity"
                      value={formData.footage_opacity}
                      onChange={handleChange}
                      min={0}
                      max={1}
                      step={0.05}
                      defaultValue={1.0}
                      helpText="Blend overlay with base video (0 = hidden, 1 = fully visible)"
                      allowRange={false}
                    />
                  </div>
                </FormGroup>

                <FormGroup label="Processing Mode" helpText="How to process videos">
                  <select name="mode" value={formData.mode} onChange={handleChange}>
                    <option value="editVideoMassUniqFromOneVideo">Create Variations from One Video (Recommended)</option>
                    <option value="massVideosUniq">Process All Videos in Folder</option>
                    <option value="massImagesUniq">Process Images</option>
                    <option value="test_mode">Test Mode</option>
                  </select>
                </FormGroup>

                <FormGroup label={`Count: ${formData.count}`} helpText="Number of variations (1-100)">
                  <input
                    type="range"
                    name="count"
                    min="1"
                    max="100"
                    value={formData.count}
                    onChange={handleChange}
                  />
                  <input
                    type="number"
                    name="count"
                    value={formData.count}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    style={{ width: '100px', marginTop: '8px' }}
                  />
                </FormGroup>
              </>
            )}

            {/* Video Properties */}
            {activeSection === 'video' && (
              <>
                <RangeInput
                  label="FPS"
                  name="fps"
                  value={formData.fps}
                  onChange={handleChange}
                  min={1}
                  max={120}
                  step={0.1}
                  defaultValue={30}
                  helpText="Frames per second (1-120, higher = smoother)"
                  allowRange={true}
                />

                <FormGroup label="Resolution Preset" helpText="Quick resolution presets">
                  <select name="width_height" value={formData.width_height} onChange={handleChange}>
                    <option value="">Keep Original</option>
                    <option value="hd480">HD 480p (854x480)</option>
                    <option value="hd720">HD 720p (1280x720)</option>
                    <option value="hd1080">Full HD 1080p (1920x1080)</option>
                    <option value="2k">2K (2048x1080)</option>
                    <option value="4k">4K (3840x2160)</option>
                  </select>
                </FormGroup>

                <RangeInput
                  label="Video Bitrate (kbps)"
                  name="bit_m_video"
                  value={formData.bit_m_video}
                  onChange={handleChange}
                  min={500}
                  max={50000}
                  step={100}
                  defaultValue={5000}
                  helpText="Video quality (500-50000, higher = better quality, larger file)"
                  allowRange={true}
                />

                <RangeInput
                  label="Audio Bitrate (kbps)"
                  name="bit_m_audio"
                  value={formData.bit_m_audio}
                  onChange={handleChange}
                  min={64}
                  max={320}
                  step={8}
                  defaultValue={128}
                  helpText="Audio quality (64-320, 128=standard, 192-320=high quality)"
                  allowRange={true}
                />

                <FormGroup label="Output Format">
                  <select name="output" value={formData.output} onChange={handleChange}>
                    <option value=".mp4">MP4</option>
                    <option value=".mov">MOV</option>
                    <option value=".avi">AVI</option>
                    <option value=".mkv">MKV</option>
                  </select>
                </FormGroup>
              </>
            )}

            {/* Color Adjustments */}
            {activeSection === 'color' && (
              <>
                <RangeInput
                  label="Saturation"
                  name="saturation"
                  value={formData.saturation}
                  onChange={handleChange}
                  min={0}
                  max={2}
                  step={0.01}
                  defaultValue={1.0}
                  helpText="Color intensity (0.0-2.0, 1.0=normal)"
                  allowRange={true}
                />

                <RangeInput
                  label="Contrast"
                  name="contrast"
                  value={formData.contrast}
                  onChange={handleChange}
                  min={0}
                  max={2}
                  step={0.01}
                  defaultValue={1.0}
                  helpText="Contrast level (0.0-2.0, 1.0=normal)"
                  allowRange={true}
                />

                <RangeInput
                  label="Gamma"
                  name="gamma"
                  value={formData.gamma}
                  onChange={handleChange}
                  min={0.1}
                  max={3}
                  step={0.01}
                  defaultValue={1.0}
                  helpText="Brightness (0.1-3.0, 1.0=normal)"
                  allowRange={true}
                />

                <RangeInput
                  label="Gamma Red"
                  name="gamma_r"
                  value={formData.gamma_r}
                  onChange={handleChange}
                  min={0.1}
                  max={3}
                  step={0.01}
                  defaultValue={1.0}
                  helpText="Red channel (0.1-3.0)"
                  allowRange={true}
                />

                <RangeInput
                  label="Gamma Green"
                  name="gamma_g"
                  value={formData.gamma_g}
                  onChange={handleChange}
                  min={0.1}
                  max={3}
                  step={0.01}
                  defaultValue={1.0}
                  helpText="Green channel (0.1-3.0)"
                  allowRange={true}
                />

                <RangeInput
                  label="Gamma Blue"
                  name="gamma_b"
                  value={formData.gamma_b}
                  onChange={handleChange}
                  min={0.1}
                  max={3}
                  step={0.01}
                  defaultValue={1.0}
                  helpText="Blue channel (0.1-3.0)"
                  allowRange={true}
                />

                <RangeInput
                  label="Gamma Weight"
                  name="gamma_weight"
                  value={formData.gamma_weight}
                  onChange={handleChange}
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={0.4}
                  helpText="Weight (0.0-1.0)"
                  allowRange={true}
                />

                <RangeInput
                  label="Vibrance"
                  name="vibrance"
                  value={formData.vibrance}
                  onChange={handleChange}
                  min={-1}
                  max={1}
                  step={0.01}
                  defaultValue={0.0}
                  helpText="Color vibrance (-1.0 to 1.0)"
                  allowRange={true}
                />

                <RangeInput
                  label="Equalization"
                  name="eq"
                  value={formData.eq}
                  onChange={handleChange}
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={0.0}
                  helpText="EQ adjustment (0.0-1.0)"
                  allowRange={true}
                />
              </>
            )}

            {/* Geometric Transforms */}
            {activeSection === 'geometry' && (
              <>
                <FormGroup label="Scale" helpText="e.g., 2*iw:-1 or 1920:1080">
                  <input type="text" name="scale" value={formData.scale} onChange={handleChange} placeholder="2*iw:-1" />
                </FormGroup>

                <FormGroup label="Crop" helpText="e.g., iw/1.5:ih/1.5">
                  <input type="text" name="crop" value={formData.crop} onChange={handleChange} placeholder="iw/1.5:ih/1.5" />
                </FormGroup>

                <RangeInput
                  label="Crop Width (px)"
                  name="crop_width"
                  value={formData.crop_width}
                  onChange={handleChange}
                  min={0}
                  max={500}
                  step={1}
                  defaultValue={0}
                  helpText="Crop from left/right sides (0-500px)"
                  allowRange={true}
                />

                <RangeInput
                  label="Crop Height (px)"
                  name="crop_height"
                  value={formData.crop_height}
                  onChange={handleChange}
                  min={0}
                  max={500}
                  step={1}
                  defaultValue={0}
                  helpText="Crop from top/bottom (0-500px)"
                  allowRange={true}
                />

                <RangeInput
                  label="Rotate (degrees)"
                  name="rotate"
                  value={formData.rotate}
                  onChange={handleChange}
                  min={0}
                  max={360}
                  step={1}
                  defaultValue={0}
                  helpText="Rotation angle (0-360°)"
                  allowRange={true}
                />

                <FormGroup label="Mirror Horizontally">
                  <input type="checkbox" name="mirror_horizontally" checked={formData.mirror_horizontally} onChange={handleChange} />
                </FormGroup>

                <FormGroup label="Mirror Vertically">
                  <input type="checkbox" name="mirror_vertically" checked={formData.mirror_vertically} onChange={handleChange} />
                </FormGroup>
              </>
            )}

            {/* Effects */}
            {activeSection === 'effects' && (
              <>
                <RangeInput
                  label="Gaussian Blur"
                  name="gblur"
                  value={formData.gblur}
                  onChange={handleChange}
                  min={0}
                  max={20}
                  step={0.1}
                  defaultValue={0}
                  helpText="Blur intensity (0-20, 0=sharp, 10=very blurry)"
                  allowRange={true}
                />

                <RangeInput
                  label="Temporal Mix Frames"
                  name="tmix_frames"
                  value={formData.tmix_frames}
                  onChange={handleChange}
                  min={0}
                  max={10}
                  step={1}
                  defaultValue={0}
                  helpText="Frame blending for motion blur (0-10)"
                  allowRange={true}
                />

                <RangeInput
                  label="Noise"
                  name="noise"
                  value={formData.noise}
                  onChange={handleChange}
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={0}
                  helpText="Film grain / noise level (0-100)"
                  allowRange={true}
                />

                <FormGroup label="Fade Effect" helpText="e.g., in:0:50 or out:0:50">
                  <input type="text" name="fade" value={formData.fade} onChange={handleChange} placeholder="in:0:50" />
                </FormGroup>
              </>
            )}

            {/* Speed Controls */}
            {activeSection === 'speed' && (
              <>
                <RangeInput
                  label="Video Speed"
                  name="speed_video"
                  value={formData.speed_video}
                  onChange={handleChange}
                  min={0.25}
                  max={4.0}
                  step={0.05}
                  defaultValue={1.0}
                  helpText="Speed multiplier (0.25-4.0x, 1.0=normal)"
                  allowRange={true}
                />
                <div style={{ marginTop: '-12px', marginBottom: '16px', color: '#94a3b8', fontSize: '12px', paddingLeft: '4px' }}>
                  {typeof formData.speed_video === 'number' ? (
                    formData.speed_video < 1 ? '🐌 Slower' : formData.speed_video > 1 ? '🚀 Faster' : '➡️ Normal'
                  ) : (
                    '📊 Range mode active'
                  )}
                </div>

                <RangeInput
                  label="Audio Speed"
                  name="speed_audio"
                  value={formData.speed_audio}
                  onChange={handleChange}
                  min={0.25}
                  max={4.0}
                  step={0.05}
                  defaultValue={1.0}
                  helpText="Audio speed multiplier (0.25-4.0x, 1.0=normal)"
                  allowRange={true}
                />
                <div style={{ marginTop: '-12px', marginBottom: '16px', color: '#94a3b8', fontSize: '12px', paddingLeft: '4px' }}>
                  {typeof formData.speed_audio === 'number' ? (
                    formData.speed_audio < 1 ? '🐌 Slower' : formData.speed_audio > 1 ? '🚀 Faster' : '➡️ Normal'
                  ) : (
                    '📊 Range mode active'
                  )}
                </div>
              </>
            )}

            {/* Options */}
            {activeSection === 'options' && (
              <>
                <FormGroup label="Delete Input After Processing">
                  <input type="checkbox" name="delete_input" checked={formData.delete_input} onChange={handleChange} />
                </FormGroup>

                <FormGroup label="Use Random Config Values">
                  <input type="checkbox" name="random_config" checked={formData.random_config} onChange={handleChange} />
                </FormGroup>

                <FormGroup label="Output Format">
                  <select name="output" value={formData.output} onChange={handleChange}>
                    <option value=".mp4">MP4</option>
                    <option value=".mov">MOV</option>
                    <option value=".avi">AVI</option>
                    <option value=".mkv">MKV</option>
                  </select>
                </FormGroup>
              </>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '24px' }}>
              {loading ? 'Creating Job...' : '🚀 Create Job'}
            </button>
          </form>
        </div>

        {/* Result Panel */}
        <div>
          <div className="card">
            <h3>Result</h3>
            {result ? (
              result.success ? (
                <div style={{ padding: '16px', background: '#10b981', borderRadius: '8px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                  <div style={{ fontWeight: '600', marginBottom: '8px' }}>Job Created!</div>
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '11px', wordBreak: 'break-all' }}>
                    <div><strong>Job ID:</strong> {result.data.job_id}</div>
                    <div><strong>Status:</strong> {result.data.status}</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#ef4444', borderRadius: '8px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>❌</div>
                  <div style={{ fontWeight: '600' }}>Error</div>
                  <div style={{ marginTop: '12px', fontSize: '12px' }}>{result.error}</div>
                </div>
              )
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <div className="empty-state-text">Configure and create</div>
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h3>Current Settings</h3>
            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.8' }}>
              <div>📊 {Object.keys(formData).filter(k => formData[k] !== '' && formData[k] !== false && formData[k] !== 1.0 && formData[k] !== 0).length} parameters configured</div>
              <div>🎬 Mode: {formData.mode}</div>
              <div>📁 Count: {formData.count}</div>
              {formData.video_path && <div>📹 Video: {formData.video_path.split('/').pop()}</div>}
            </div>
          </div>
        </div>
      </div>

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

// Helper component for form groups
function FormGroup({ label, helpText, children }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
      {helpText && <small style={{ color: '#64748b', fontSize: '12px', display: 'block', marginTop: '4px' }}>{helpText}</small>}
    </div>
  )
}


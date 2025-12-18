import React, { useState } from 'react'

export default function RangeInput({ 
  label, 
  name, 
  value, 
  onChange, 
  min = 0, 
  max = 2, 
  step = 0.01, 
  defaultValue = 1.0,
  helpText = '',
  allowRange = true 
}) {
  const initialRange = value && typeof value === 'object' && value.mode === 'range'
  const initialFrom = initialRange ? value.from : value
  const initialTo = initialRange ? value.to : value

  const [useRange, setUseRange] = useState(initialRange)
  const [fromValue, setFromValue] = useState(
    initialFrom !== undefined && initialFrom !== null ? initialFrom : defaultValue
  )
  const [toValue, setToValue] = useState(
    initialTo !== undefined && initialTo !== null ? initialTo : defaultValue
  )

  const handleRangeToggle = (checked) => {
    setUseRange(checked)
    if (checked) {
      // Switch to range mode
      onChange({
        target: {
          name: name,
          value: { from: fromValue, to: toValue, mode: 'range' }
        }
      })
    } else {
      // Switch to single value mode
      onChange({
        target: {
          name: name,
          value: fromValue
        }
      })
    }
  }

  const handleFromChange = (newFrom) => {
    setFromValue(parseFloat(newFrom))
    if (useRange) {
      onChange({
        target: {
          name: name,
          value: { from: parseFloat(newFrom), to: toValue, mode: 'range' }
        }
      })
    } else {
      onChange({
        target: {
          name: name,
          value: parseFloat(newFrom)
        }
      })
    }
  }

  const handleToChange = (newTo) => {
    setToValue(parseFloat(newTo))
    if (useRange) {
      onChange({
        target: {
          name: name,
          value: { from: fromValue, to: parseFloat(newTo), mode: 'range' }
        }
      })
    }
  }

  return (
    <div className="form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ margin: 0 }}>
          {label}: {useRange ? `${fromValue.toFixed(2)} - ${toValue.toFixed(2)}` : fromValue.toFixed(2)}
        </label>
        {allowRange && (
          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useRange}
              onChange={(e) => handleRangeToggle(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Use Range
          </label>
        )}
      </div>

      {useRange ? (
        <>
          {/* From Value */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>From:</div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={fromValue}
              onChange={(e) => handleFromChange(e.target.value)}
              style={{ width: '100%' }}
            />
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={fromValue}
              onChange={(e) => handleFromChange(e.target.value)}
              style={{ width: '100px', marginTop: '4px' }}
            />
          </div>

          {/* To Value */}
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>To:</div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={toValue}
              onChange={(e) => handleToChange(e.target.value)}
              style={{ width: '100%' }}
            />
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={toValue}
              onChange={(e) => handleToChange(e.target.value)}
              style={{ width: '100px', marginTop: '4px' }}
            />
          </div>

          <div style={{ 
            marginTop: '8px', 
            padding: '8px', 
            background: 'rgba(102, 126, 234, 0.1)', 
            borderRadius: '6px',
            fontSize: '12px',
            color: '#94a3b8'
          }}>
            ℹ️ Will create {name} variations from {fromValue.toFixed(2)} to {toValue.toFixed(2)}
          </div>
        </>
      ) : (
        <>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={fromValue}
            onChange={(e) => handleFromChange(e.target.value)}
            style={{ width: '100%' }}
          />
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={fromValue}
            onChange={(e) => handleFromChange(e.target.value)}
            style={{ width: '100px', marginTop: '8px' }}
          />
        </>
      )}
      
      {helpText && <small style={{ color: '#64748b', fontSize: '12px', display: 'block', marginTop: '4px' }}>{helpText}</small>}
    </div>
  )
}


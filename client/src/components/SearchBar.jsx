import React, { useState } from 'react'

export default function SearchBar({ onSearch, disabled }) {
  const [value, setValue] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (value.trim() && !disabled) onSearch(value.trim())
  }

  return (
    <form onSubmit={submit}>
      <div style={{ position: 'relative' }}>
        {/* Animated glow ring */}
        <div style={{
          position: 'absolute', inset: -2, borderRadius: 18,
          background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6, #4f8ef7)',
          backgroundSize: '200% 200%',
          animation: disabled ? 'gradShift 1.5s ease infinite' : 'none',
          opacity: disabled ? 0.6 : 0,
          transition: 'opacity 0.3s',
          filter: 'blur(6px)',
        }} />

        <div className="glass" style={{
          position: 'relative', display: 'flex', alignItems: 'center',
          borderRadius: 16, overflow: 'hidden', padding: '6px 6px 6px 20px',
        }}>
          <span style={{ fontSize: 18, opacity: 0.35, flexShrink: 0 }}>🔍</span>

          <input
            id="company-search-input"
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Enter company name — e.g. Apple Inc., Reliance Industries, Tesla..."
            disabled={disabled}
            autoComplete="off"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              padding: '16px 14px', color: 'var(--text)', fontSize: 15,
              fontFamily: 'var(--font)', opacity: disabled ? 0.5 : 1,
            }}
          />

          <button
            id="search-submit-btn"
            type="submit"
            disabled={disabled || !value.trim()}
            style={{
              padding: '14px 26px', borderRadius: 12, border: 'none',
              background: disabled || !value.trim()
                ? 'rgba(79,142,247,0.2)'
                : 'linear-gradient(135deg, #4f8ef7, #8b5cf6)',
              color: 'white', fontWeight: 600, fontSize: 14,
              cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              whiteSpace: 'nowrap', fontFamily: 'var(--font)',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            {disabled
              ? <><svg className="anim-spin" style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Analyzing...</>
              : 'Analyze →'
            }
          </button>
        </div>
      </div>
    </form>
  )
}

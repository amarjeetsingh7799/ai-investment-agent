import React from 'react'

export default function ThesisPanel({ result }) {
  const bullets = (result.analystNotes || '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Investment thesis */}
      <div className="glass" style={{ padding: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
          Investment Thesis
        </div>
        <blockquote style={{
          borderLeft: '2px solid var(--blue)',
          paddingLeft: 18, margin: 0,
          fontSize: 15, lineHeight: 1.8,
          color: 'var(--text)',
        }}>
          {result.investmentThesis || 'No thesis available.'}
        </blockquote>
      </div>

      {/* Analyst notes */}
      {bullets.length > 0 && (
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            Analyst Notes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bullets.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 2, fontSize: 13 }}>▸</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{line}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import React from 'react'

function Column({ title, color, bg, border, icon, items, emptyText }) {
  return (
    <div className="glass" style={{ flex: 1, minWidth: 240, overflow: 'hidden', border: `1px solid ${border}` }}>
      {/* Column header */}
      <div style={{
        padding: '14px 18px', background: bg,
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {title}
        </span>
        <span style={{
          marginLeft: 'auto', padding: '2px 8px', borderRadius: 999,
          fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${border}`,
        }}>
          {items.length}
        </span>
      </div>

      {/* Items list */}
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.length === 0
          ? (
            <p style={{ textAlign: 'center', color: 'var(--dim)', fontSize: 13, padding: '20px 0' }}>
              {emptyText}
            </p>
          )
          : items.map((item, i) => (
            <div
              key={item}
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '10px 12px', borderRadius: 10, background: bg,
              }}
            >
              <span style={{ color, fontSize: 11, flexShrink: 0, marginTop: 3 }}>▸</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default function SignalsList({ bullish = [], risks = [] }) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <Column
        title="Bullish Signals"
        icon="✅" color="var(--green)"
        bg="rgba(16,217,138,0.06)" border="rgba(16,217,138,0.2)"
        items={bullish}
        emptyText="No bullish signals identified"
      />
      <Column
        title="Risk Flags"
        icon="⚠️" color="var(--red)"
        bg="rgba(255,77,109,0.06)" border="rgba(255,77,109,0.2)"
        items={risks}
        emptyText="No significant risks identified"
      />
    </div>
  )
}

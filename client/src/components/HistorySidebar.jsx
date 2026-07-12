import React from 'react'

const VERDICT_STYLE = {
  INVEST: { color: '#10d98a', bg: 'rgba(16,217,138,0.1)', border: 'rgba(16,217,138,0.3)' },
  PASS:   { color: '#ff4d6d', bg: 'rgba(255,77,109,0.1)', border: 'rgba(255,77,109,0.3)' },
}

function HistoryItem({ session }) {
  const vs = VERDICT_STYLE[session.verdict] || {}

  return (
    <div
      style={{
        padding: '10px 12px', borderRadius: 10,
        cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span className="truncate" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>
          {session.companyName}
        </span>
        {session.verdict && (
          <span style={{
            padding: '2px 8px', borderRadius: 6, flexShrink: 0,
            fontSize: 11, fontWeight: 700,
            color: vs.color, background: vs.bg, border: `1px solid ${vs.border}`,
          }}>
            {session.verdict}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--dim)', alignItems: 'center' }}>
        {session.ticker && <span className="mono">{session.ticker}</span>}
        {session.ticker && <span>·</span>}
        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

export default function HistorySidebar({ history, isOpen, onToggle }) {
  const sidebarContent = (
    <>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Research History
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {history.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--dim)', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🕐</div>
              No research sessions yet
            </div>
          )
          : history.map(s => <HistoryItem key={s._id} session={s} />)
        }
      </div>
    </>
  )

  const sidebarBase = {
    width: 250,
    background: 'rgba(7,7,26,0.85)',
    borderRight: '1px solid var(--border)',
    backdropFilter: 'blur(20px)',
    display: 'flex', flexDirection: 'column',
  }

  return (
    <>
      {/* Desktop sidebar — hidden below 768px via media trick */}
      <aside id="desktop-sidebar" style={{ ...sidebarBase, display: 'flex' }}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)' }}
            onClick={onToggle}
          />
          <aside style={{ ...sidebarBase, position: 'relative', width: 280 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                History
              </span>
              <button onClick={onToggle} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {history.length === 0
                ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--dim)', fontSize: 13 }}>No sessions yet</div>
                : history.map(s => <HistoryItem key={s._id} session={s} />)
              }
            </div>
          </aside>
        </div>
      )}

      {/* Hide desktop sidebar on small screens */}
      <style>{`@media(max-width:768px){#desktop-sidebar{display:none!important}}`}</style>
    </>
  )
}

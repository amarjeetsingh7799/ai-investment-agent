import React from 'react'

const LABEL_COLOR = {
  BULLISH:  { color: '#10d98a', bg: 'rgba(16,217,138,0.12)',  border: 'rgba(16,217,138,0.3)'  },
  POSITIVE: { color: '#10d98a', bg: 'rgba(16,217,138,0.12)',  border: 'rgba(16,217,138,0.3)'  },
  BEARISH:  { color: '#ff4d6d', bg: 'rgba(255,77,109,0.12)',  border: 'rgba(255,77,109,0.3)'  },
  NEGATIVE: { color: '#ff4d6d', bg: 'rgba(255,77,109,0.12)',  border: 'rgba(255,77,109,0.3)'  },
  NEUTRAL:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
}

function SentimentGauge({ score }) {
  const label   = score >= 65 ? 'BULLISH' : score >= 45 ? 'NEUTRAL' : 'BEARISH'
  const col     = LABEL_COLOR[label]
  const R       = 38
  const circum  = 2 * Math.PI * R
  const dash    = (score / 100) * circum

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      {/* SVG dial */}
      <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <circle
            cx="50" cy="50" r={R} fill="none"
            stroke={col.color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circum}`}
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: col.color }}>
            {score?.toFixed(0) ?? '--'}
          </span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: col.color }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Overall sentiment score</div>
      </div>
    </div>
  )
}

export default function SentimentPanel({ articles = [], score }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Gauge card */}
      <div className="glass" style={{ padding: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
          News Sentiment
        </div>
        <SentimentGauge score={score} />
        <p style={{ fontSize: 12, color: 'var(--dim)', marginTop: 16 }}>
          Keyword-scored across {articles.length} articles from Yahoo Finance RSS
        </p>
      </div>

      {/* Articles */}
      {articles.length > 0 && (
        <div className="glass" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Headlines ({articles.length})
          </div>
          {articles.map((article, i) => {
            const sl  = (article.sentimentLabel || 'NEUTRAL').toUpperCase()
            const lc  = LABEL_COLOR[sl] || LABEL_COLOR.NEUTRAL
            const safeKey = article.url || article.title || String(i)

            return (
              <div
                key={safeKey}
                style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 6 }}>
                  {/* Title */}
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.5 }}>
                    {article.url && article.url !== '#'
                      ? (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
                          onMouseEnter={e => e.target.style.color = 'var(--blue)'}
                          onMouseLeave={e => e.target.style.color = 'var(--text)'}
                        >
                          {article.title}
                        </a>
                      )
                      : article.title
                    }
                  </div>

                  {/* Sentiment badge */}
                  <span style={{
                    padding: '3px 9px', borderRadius: 6, flexShrink: 0,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                    color: lc.color, background: lc.bg, border: `1px solid ${lc.border}`,
                  }}>
                    {sl}
                  </span>
                </div>

                {article.snippet && (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5, margin: 0 }}>
                    {article.snippet}
                  </p>
                )}
                {article.publishedAt && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
                    {article.publishedAt}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import React from 'react'
import { useTilt } from '../hooks/useTilt'

const VERDICT_STYLE = {
  INVEST: { color: '#10d98a', glow: 'rgba(16,217,138,0.2)', border: 'rgba(16,217,138,0.35)', bg: 'rgba(16,217,138,0.07)', emoji: '✅' },
  PASS:   { color: '#ff4d6d', glow: 'rgba(255,77,109,0.2)', border: 'rgba(255,77,109,0.35)', bg: 'rgba(255,77,109,0.07)', emoji: '❌' },
}

function ScoreBar({ label, score, color }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontSize: 13, color: 'var(--muted, rgba(255,255,255,0.45))' }}>{label}</span>
        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color }}>{score?.toFixed(0) ?? '--'}/100</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: mounted ? `${score ?? 0}%` : '0%', background: `linear-gradient(90deg, ${color}80, ${color})` }} />
      </div>
    </div>
  )
}

function formatCap(v) {
  if (!v) return null
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`
  return `$${(v / 1e6).toFixed(0)}M`
}

export default function VerdictCard({ result }) {
  const { ref, onMouseMove, onMouseLeave } = useTilt(8)

  const vs = VERDICT_STYLE[result.verdict] || VERDICT_STYLE.PASS
  const m  = result.financialMetrics || {}

  const tags = [
    result.ticker              && { label: result.ticker,                     mono: true },
    m.sector                   && { label: m.sector },
    m.recommendationKey        && { label: `Analysts: ${m.recommendationKey.replace(/_/g,' ')}` },
    formatCap(m.marketCap)     && { label: `Cap: ${formatCap(m.marketCap)}` },
    m.currentPrice             && { label: `$${m.currentPrice.toFixed(2)}` },
  ].filter(Boolean)

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={result.verdict === 'INVEST' ? 'glow-green' : 'glow-red'}
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 20, padding: 28,
        border: `1px solid ${vs.border}`,
        background: `linear-gradient(135deg, ${vs.bg}, rgba(10,10,30,0.9))`,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        transformStyle: 'preserve-3d',
        cursor: 'default',
      }}
    >
      {/* Decorative radial glow in corner */}
      <div style={{
        position: 'absolute', top: -50, right: -50, width: 200, height: 200,
        borderRadius: '50%', background: vs.color,
        filter: 'blur(50px)', opacity: 0.12, pointerEvents: 'none',
      }} />

      {/* Top section: verdict badge + scores */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start', position: 'relative' }}>
        {/* Verdict badge */}
        <div style={{
          padding: '18px 26px', borderRadius: 14,
          border: `1px solid ${vs.border}`, background: vs.bg,
          display: 'flex', alignItems: 'center', gap: 16,
          backdropFilter: 'blur(12px)',
        }}>
          <span style={{ fontSize: 36 }}>{vs.emoji}</span>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '0.1em', color: vs.color, lineHeight: 1 }}>
              {result.verdict}
            </div>
            <div style={{ fontSize: 12, color: vs.color, opacity: 0.75, marginTop: 4 }}>
              {result.confidenceLevel} Confidence
            </div>
          </div>
        </div>

        {/* Score bars */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 11, color: 'var(--dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
            Analysis Scores
          </div>
          <ScoreBar label="Financial Score" score={result.financialScore} color="var(--blue)"   />
          <ScoreBar label="News Sentiment"  score={result.sentimentScore} color="var(--purple)" />
          {result.overallScore != null && (
            <ScoreBar label="Overall Score" score={result.overallScore}   color={vs.color}      />
          )}
        </div>
      </div>

      {/* Tags row */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {tags.map((t, i) => (
            <span
              key={i}
              className={t.mono ? 'mono' : ''}
              style={{
                padding: '4px 12px', borderRadius: 8, fontSize: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                color: 'var(--muted)',
              }}
            >
              {t.label}
            </span>
          ))}
        </div>
      )}

      {/* Error notices */}
      {result.errors?.length > 0 && (
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, fontSize: 12, color: 'var(--amber)', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
          ⚠️ {result.errors.join(' · ')}
        </div>
      )}
    </div>
  )
}

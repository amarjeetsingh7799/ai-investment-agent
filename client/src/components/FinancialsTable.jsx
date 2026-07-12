import React from 'react'

// All the financial metrics we display, with formatting rules
const METRICS = [
  { key: 'currentPrice',             label: 'Current Price',          fmt: v => `$${v.toFixed(2)}` },
  { key: 'marketCap',                label: 'Market Cap',             fmt: v => v>=1e12?`$${(v/1e12).toFixed(2)}T`:v>=1e9?`$${(v/1e9).toFixed(1)}B`:`$${(v/1e6).toFixed(0)}M` },
  { key: 'peRatio',                  label: 'P/E Ratio (TTM)',        fmt: v => `${v.toFixed(1)}×` },
  { key: 'forwardPE',                label: 'Forward P/E',            fmt: v => `${v.toFixed(1)}×` },
  { key: 'priceToBook',              label: 'Price / Book',           fmt: v => `${v.toFixed(2)}×` },
  { key: 'revenueGrowth',            label: 'Revenue Growth YoY',     fmt: v => `${(v*100).toFixed(1)}%`, signed: true },
  { key: 'earningsGrowth',           label: 'Earnings Growth',        fmt: v => `${(v*100).toFixed(1)}%`, signed: true },
  { key: 'grossMargins',             label: 'Gross Margin',           fmt: v => `${(v*100).toFixed(1)}%`, signed: true },
  { key: 'operatingMargins',         label: 'Operating Margin',       fmt: v => `${(v*100).toFixed(1)}%`, signed: true },
  { key: 'profitMargins',            label: 'Net Profit Margin',      fmt: v => `${(v*100).toFixed(1)}%`, signed: true },
  { key: 'returnOnEquity',           label: 'Return on Equity (ROE)', fmt: v => `${(v*100).toFixed(1)}%`, signed: true },
  { key: 'returnOnAssets',           label: 'Return on Assets (ROA)', fmt: v => `${(v*100).toFixed(1)}%`, signed: true },
  { key: 'currentRatio',             label: 'Current Ratio',          fmt: v => v.toFixed(2) },
  { key: 'debtToEquity',             label: 'Debt / Equity',          fmt: v => v.toFixed(2) },
  { key: 'freeCashflow',             label: 'Free Cash Flow',         fmt: v => v>=1e9?`$${(v/1e9).toFixed(1)}B`:`$${(v/1e6).toFixed(0)}M`, signed: true },
  { key: 'beta',                     label: 'Beta',                   fmt: v => v.toFixed(2) },
  { key: 'dividendYield',            label: 'Dividend Yield',         fmt: v => `${(v*100).toFixed(2)}%` },
  { key: 'targetMeanPrice',          label: 'Analyst Target Price',   fmt: v => `$${v.toFixed(2)}` },
  { key: 'numberOfAnalystOpinions',  label: 'Analyst Count',          fmt: v => String(v) },
  { key: 'fiftyTwoWeekHigh',         label: '52-Week High',           fmt: v => `$${v.toFixed(2)}` },
  { key: 'fiftyTwoWeekLow',          label: '52-Week Low',            fmt: v => `$${v.toFixed(2)}` },
]

export default function FinancialsTable({ metrics, ticker }) {
  if (!metrics) {
    return (
      <div className="glass" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>No financial data available — company may not be publicly listed.</p>
      </div>
    )
  }

  const upside = metrics.targetMeanPrice && metrics.currentPrice
    ? ((metrics.targetMeanPrice - metrics.currentPrice) / metrics.currentPrice * 100)
    : null

  return (
    <div className="glass" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Financial Metrics
        </span>
        {ticker && <span className="mono" style={{ color: 'var(--blue)', fontSize: 13 }}>{ticker}</span>}
      </div>

      {/* Analyst upside / downside banner */}
      {upside != null && (
        <div style={{
          padding: '10px 24px', fontSize: 13,
          color:       upside > 0 ? 'var(--green)' : 'var(--red)',
          background:  upside > 0 ? 'rgba(16,217,138,0.06)' : 'rgba(255,77,109,0.06)',
          borderBottom: '1px solid var(--border)',
        }}>
          Analyst consensus target: {upside > 0 ? '+' : ''}{upside.toFixed(1)}% to ${metrics.targetMeanPrice.toFixed(2)}
        </div>
      )}

      {/* Metric rows */}
      {METRICS.map(({ key, label, fmt, signed }) => {
        const val = metrics[key]
        if (val == null) return null

        const valueColor = signed && val > 0 ? 'var(--green)'
                         : signed && val < 0 ? 'var(--red)'
                         : 'var(--text)'

        return (
          <div
            key={key}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: valueColor }}>{fmt(val)}</span>
          </div>
        )
      })}

      <div style={{ padding: '10px 24px', fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>
        Source: Yahoo Finance · Not financial advice
      </div>
    </div>
  )
}

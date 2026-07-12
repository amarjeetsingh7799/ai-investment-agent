import React from 'react'

const STEP_ORDER = [
  { key: 'validating',      icon: '🔍', label: 'Input Validation'      },
  { key: 'ticker_resolved', icon: '🏷️',  label: 'Ticker Resolved'       },
  { key: 'researching',     icon: '📡', label: 'Parallel Data Fetch'    },
  { key: 'data_collected',  icon: '📦', label: 'Data Collected'         },
  { key: 'scoring',         icon: '⚙️',  label: 'Financial Scoring'      },
  { key: 'scored',          icon: '🧮', label: 'Scores Computed'        },
  { key: 'evaluating',      icon: '🤖', label: 'Thesis Generation'      },
  { key: 'complete',        icon: '✅', label: 'Analysis Complete'      },
]

function Spinner() {
  return (
    <svg className="anim-spin" style={{ width: 16, height: 16, color: 'var(--blue)' }} viewBox="0 0 24 24" fill="none">
      <circle style={{ opacity: 0.2 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path style={{ opacity: 0.8 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

export default function AgentProgress({ steps, isLoading }) {
  return (
    <div className="glass anim-fade-up" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Agent Pipeline
        </span>
        {isLoading && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--blue)' }}>
            <span className="anim-ping" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }} />
            Processing
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {STEP_ORDER.map(({ key, icon, label }, i) => {
          const step    = steps.find(s => s.node === key)
          const isDone  = step?.status === 'done'
          const isActive= step?.status === 'active'
          const isPending = !step

          return (
            <div
              key={key}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px',
                borderRadius: 10, transition: 'all 0.3s',
                background: isActive
                  ? 'rgba(79,142,247,0.09)'
                  : isDone ? 'rgba(255,255,255,0.02)' : 'transparent',
                border: isActive
                  ? '1px solid rgba(79,142,247,0.25)'
                  : '1px solid transparent',
                opacity: isPending ? 0.3 : 1,
              }}
            >
              {/* Status icon */}
              <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isDone   && <span style={{ color: 'var(--green)', fontSize: 14, fontWeight: 700 }}>✓</span>}
                {isActive && <Spinner />}
                {isPending&& <span style={{ fontSize: 13, opacity: 0.5 }}>{icon}</span>}
              </div>

              {/* Label + message */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--text)' : isDone ? 'var(--muted)' : 'var(--dim)' }}>
                  {label}
                </div>
                {step?.message && (
                  <div className="mono truncate" style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>
                    {step.message}
                  </div>
                )}
              </div>

              {/* Step number */}
              <span className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

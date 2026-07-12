import React, { useState, useEffect, useCallback } from 'react'
import ThreeBackground from './three/Background'
import SearchBar       from './components/SearchBar'
import AgentProgress   from './components/AgentProgress'
import VerdictCard     from './components/VerdictCard'
import FinancialsTable from './components/FinancialsTable'
import SentimentPanel  from './components/SentimentPanel'
import SignalsList     from './components/SignalsList'
import ThesisPanel     from './components/ThesisPanel'
import HistorySidebar  from './components/HistorySidebar'

const NODE_LABELS = {
  validating:     'Resolving Ticker Symbol',
  ticker_resolved:'Ticker Identified',
  researching:    'Fetching Data in Parallel',
  data_collected: 'Data Collection Complete',
  scoring:        'Financial Scoring Engine',
  scored:         'Scores Computed',
  evaluating:     'Generating Investment Thesis',
  complete:       'Analysis Complete',
}

const QUICK_PICKS = ['Apple Inc.', 'Tesla', 'Reliance Industries', 'Infosys', 'HDFC Bank']

export default function App() {
  const [phase,         setPhase]         = useState('idle')     // idle | loading | result | error
  const [steps,         setSteps]         = useState([])
  const [result,        setResult]        = useState(null)
  const [errorMsg,      setErrorMsg]      = useState(null)
  const [history,       setHistory]       = useState([])
  const [activeTab,     setActiveTab]     = useState('thesis')
  const [sidebarOpen,   setSidebarOpen]   = useState(false)

  // Load research history from the backend
  const loadHistory = useCallback(async () => {
    try {
      const res  = await fetch('/api/history')
      const data = await res.json()
      if (Array.isArray(data)) setHistory(data)
    } catch (_) { /* MongoDB is optional — silently skip */ }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const handleSearch = async (companyName) => {
    setPhase('loading')
    setSteps([])
    setResult(null)
    setErrorMsg(null)
    setActiveTab('thesis')

    try {
      const response = await fetch('/api/research', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ companyName }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || `Server error ${response.status}`)
      }

      // Stream SSE events from the backend
      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer      = lines.pop() // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'progress') handleProgressEvent(event)
            if (event.type === 'result')   handleResultEvent(event)
            if (event.type === 'error')    handleErrorEvent(event)
          } catch (_) { /* ignore malformed SSE lines */ }
        }
      }
    } catch (err) {
      setErrorMsg(err.message)
      setPhase('error')
    }
  }

  const handleProgressEvent = ({ node, message }) => {
    setSteps(prev => {
      const exists = prev.find(s => s.node === node)
      if (exists) {
        return prev.map(s => s.node === node ? { ...s, message, status: 'done' } : s)
      }
      return [...prev, { node, label: NODE_LABELS[node] || node, message, status: 'active' }]
    })
  }

  const handleResultEvent = ({ result }) => {
    setResult(result)
    setPhase('result')
    setSteps(prev => prev.map(s => ({ ...s, status: 'done' })))
    loadHistory()
  }

  const handleErrorEvent = ({ message }) => {
    setErrorMsg(message)
    setPhase('error')
  }

  const tabs = [
    { id: 'thesis',     icon: '📋', label: 'Thesis'     },
    { id: 'financials', icon: '📊', label: 'Financials' },
    { id: 'sentiment',  icon: '📰', label: 'Sentiment'  },
    { id: 'signals',    icon: '🚦', label: 'Signals'    },
  ]

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* ── 3D Particle Background ── */}
      <ThreeBackground />

      {/* ── Layout ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', minHeight: '100vh' }}>
        <HistorySidebar
          history={history}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* ── Header ── */}
          <header style={{
            padding: '16px 28px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            background: 'rgba(7,7,26,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setSidebarOpen(o => !o)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
                aria-label="Toggle history sidebar"
              >
                ☰
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🔬</span>
                  <h1 className="grad-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
                    AI Investment Research Agent
                  </h1>
                </div>
                <p style={{ fontSize: 12, color: 'var(--dim)', marginTop: 2 }}>
                  InsideIIM × Altuni AI Labs
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--dim)' }}>
              <span className="anim-ping" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
              Zero API Keys · Yahoo Finance
            </div>
          </header>

          {/* ── Main Content ── */}
          <main style={{ flex: 1, maxWidth: 900, width: '100%', margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            <SearchBar onSearch={handleSearch} disabled={phase === 'loading'} />

            {/* Agent progress tracker */}
            {(phase === 'loading' || (phase === 'result' && steps.length > 0)) && (
              <AgentProgress steps={steps} isLoading={phase === 'loading'} />
            )}

            {/* Error state */}
            {phase === 'error' && (
              <div className="glass anim-fade-up" style={{ padding: 20, border: '1px solid rgba(255,77,109,0.3)', background: 'rgba(255,77,109,0.07)' }}>
                <p style={{ color: 'var(--red)', fontWeight: 600 }}>⚠️ Research Failed</p>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>{errorMsg}</p>
              </div>
            )}

            {/* Results */}
            {phase === 'result' && result && (
              <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <VerdictCard result={result} />

                {/* Tab bar */}
                <div className="glass" style={{ display: 'flex', gap: 4, padding: 6 }}>
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      id={`tab-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        flex: 1, padding: '10px 8px',
                        borderRadius: 10, border: 'none',
                        cursor: 'pointer', fontFamily: 'var(--font)',
                        fontSize: 13, fontWeight: 500,
                        transition: 'all 0.2s',
                        background: activeTab === tab.id ? 'rgba(79,142,247,0.15)' : 'transparent',
                        color:      activeTab === tab.id ? 'var(--blue)' : 'var(--dim)',
                        boxShadow:  activeTab === tab.id ? 'inset 0 0 0 1px rgba(79,142,247,0.3)' : 'none',
                      }}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div key={activeTab} className="anim-fade-up">
                  {activeTab === 'thesis'     && <ThesisPanel     result={result} />}
                  {activeTab === 'financials' && <FinancialsTable  metrics={result.financialMetrics} ticker={result.ticker} />}
                  {activeTab === 'sentiment'  && <SentimentPanel   articles={result.newsArticles} score={result.sentimentScore} />}
                  {activeTab === 'signals'    && <SignalsList       bullish={result.bullishSignals} risks={result.riskFlags} />}
                </div>
              </div>
            )}

            {/* Idle / welcome state */}
            {phase === 'idle' && (
              <div className="anim-fade-up" style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 60 }}>
                <div className="anim-float" style={{ fontSize: 64, marginBottom: 20 }}>📈</div>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
                  Research Any Public Company
                </h2>
                <p style={{ color: 'var(--muted)', maxWidth: 420, margin: '0 auto', lineHeight: 1.7, fontSize: 15 }}>
                  Enter a company name. The agent fetches live financial data, scans real news,
                  and delivers a data-backed <strong style={{ color: 'var(--green)' }}>INVEST</strong> or <strong style={{ color: 'var(--red)' }}>PASS</strong> verdict instantly.
                </p>

                <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
                  {QUICK_PICKS.map(name => (
                    <button
                      key={name}
                      onClick={() => handleSearch(name)}
                      className="grad-border"
                      style={{
                        padding: '9px 18px', borderRadius: 999, border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.03)', color: 'var(--muted)',
                        cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.target.style.color = 'var(--text)'; e.target.style.borderColor = 'rgba(79,142,247,0.4)' }}
                      onMouseLeave={e => { e.target.style.color = 'var(--muted)'; e.target.style.borderColor = 'var(--border)' }}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                {/* Feature badges */}
                <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
                  {['🏦 Live Financial Data', '📰 Real News RSS', '🤖 AI Scoring Engine', '⚡ Streaming Results'].map(f => (
                    <span key={f} className="glass" style={{ padding: '7px 14px', fontSize: 12, color: 'var(--muted)', borderRadius: 999 }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

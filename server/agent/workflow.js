import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
// ─────────────────────────────────────────────────────────────────────────────
//  AI Investment Research Agent — Zero API Key Workflow
//  Uses: Yahoo Finance (free) + RSS News + Rule-Based AI Engine
// ─────────────────────────────────────────────────────────────────────────────

// ─── Node 1: Resolve Ticker ───────────────────────────────────────────────────
// Maps company names to tickers using Yahoo Finance's own search endpoint (free)
export async function resolveTickerNode(state) {
  try {
    const query = encodeURIComponent(state.companyName);
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=1&newsCount=0`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const data = await res.json();
    const quote = data?.quotes?.[0];
    const ticker = quote?.symbol || null;
    const fullName = quote?.longname || quote?.shortname || state.companyName;

    if (!ticker) {
      return { ...state, ticker: null, fullName: state.companyName, currentNode: 'ticker_resolved', errors: [...state.errors, 'Could not resolve ticker — company may not be publicly listed'] };
    }
    return { ...state, ticker, fullName, exchange: quote?.exchange, currentNode: 'ticker_resolved' };
  } catch (err) {
    return { ...state, ticker: null, fullName: state.companyName, currentNode: 'ticker_resolved', errors: [...state.errors, `Ticker lookup failed: ${err.message}`] };
  }
}

// ─── Node 2: Fetch Financial Metrics via yahoo-finance2 (handles auth automatically) ──
export async function fetchFinancialsNode(state) {
  try {
    const { ticker } = state;
    if (!ticker) {
      return { ...state, financialMetrics: null, currentNode: 'financials_fetched' };
    }

    // yahoo-finance2 automatically manages Yahoo's crumb/cookie — no API key needed
    const [quote, summary] = await Promise.allSettled([
      yahooFinance.quote(ticker),
      yahooFinance.quoteSummary(ticker, {
        modules: ['summaryDetail', 'financialData', 'defaultKeyStatistics', 'assetProfile'],
      }),
    ]);

    const q  = quote.status   === 'fulfilled' ? quote.value   : {};
    const s  = summary.status === 'fulfilled' ? summary.value : {};

    const fd = s.financialData         || {};
    const sd = s.summaryDetail         || {};
    const ks = s.defaultKeyStatistics  || {};
    const ap = s.assetProfile          || {};

    // Prefer summaryDetail/financialData; fall back to the quote object
    const metrics = {
      currentPrice:            fd.currentPrice            ?? q.regularMarketPrice          ?? null,
      marketCap:               q.marketCap                ?? sd.marketCap                  ?? null,
      peRatio:                 q.trailingPE               ?? sd.trailingPE                 ?? null,
      forwardPE:               q.forwardPE                ?? sd.forwardPE                  ?? null,
      priceToBook:             ks.priceToBook             ?? null,
      revenueGrowth:           fd.revenueGrowth           ?? null,
      earningsGrowth:          fd.earningsGrowth          ?? null,
      grossMargins:            fd.grossMargins            ?? null,
      operatingMargins:        fd.operatingMargins        ?? null,
      profitMargins:           fd.profitMargins           ?? null,
      returnOnEquity:          fd.returnOnEquity          ?? null,
      returnOnAssets:          fd.returnOnAssets          ?? null,
      currentRatio:            fd.currentRatio            ?? null,
      debtToEquity:            fd.debtToEquity            ?? null,
      freeCashflow:            fd.freeCashflow            ?? null,
      totalCash:               fd.totalCash               ?? null,
      totalDebt:               fd.totalDebt               ?? null,
      revenuePerShare:         fd.revenuePerShare         ?? null,
      beta:                    q.beta                     ?? sd.beta                        ?? null,
      dividendYield:           q.dividendYield            ?? sd.dividendYield               ?? null,
      fiftyTwoWeekHigh:        q.fiftyTwoWeekHigh         ?? sd.fiftyTwoWeekHigh            ?? null,
      fiftyTwoWeekLow:         q.fiftyTwoWeekLow          ?? sd.fiftyTwoWeekLow             ?? null,
      targetMeanPrice:         fd.targetMeanPrice         ?? null,
      recommendationKey:       fd.recommendationKey       ?? null,
      numberOfAnalystOpinions: fd.numberOfAnalystOpinions ?? null,
      sector:                  ap.sector                  ?? q.sector                       ?? null,
      industry:                ap.industry                ?? q.industry                     ?? null,
      country:                 ap.country                 ?? null,
      fullTimeEmployees:       ap.fullTimeEmployees       ?? null,
      website:                 ap.website                 ?? null,
    };

    const filledCount = Object.values(metrics).filter(v => v != null).length;
    if (filledCount < 3) throw new Error('Insufficient data returned for this ticker');

    return { ...state, financialMetrics: metrics, currentNode: 'financials_fetched' };
  } catch (err) {
    return {
      ...state, financialMetrics: null, currentNode: 'financials_fetched',
      errors: [...state.errors, `Financial fetch failed: ${err.message}`],
    };
  }
}

// ─── Node 3: Fetch News via Yahoo Finance RSS (Free, No Key) ──────────────────
const BULLISH_WORDS = ['beat', 'record', 'growth', 'profit', 'surge', 'rise', 'strong', 'outperform', 'upgrade', 'buy', 'gains', 'rally', 'high', 'positive', 'revenue', 'expands', 'partnership', 'launch', 'innovative', 'acquisition', 'dividend', 'exceeds', 'boosts', 'milestone', 'breakthrough'];
const BEARISH_WORDS  = ['miss', 'loss', 'decline', 'fall', 'drop', 'weak', 'downgrade', 'sell', 'lawsuit', 'fine', 'penalty', 'fraud', 'debt', 'cut', 'layoff', 'warning', 'risk', 'concern', 'investigation', 'recall', 'default', 'crisis', 'negative', 'disappoints', 'lowers', 'bankruptcy'];

function scoreSentiment(text) {
  const lower = text.toLowerCase();
  let score   = 0;
  BULLISH_WORDS.forEach(w => { if (lower.includes(w)) score++; });
  BEARISH_WORDS.forEach(w => { if (lower.includes(w)) score--; });
  const norm = Math.max(-1, Math.min(1, score / 4));
  const label = norm > 0.15 ? 'BULLISH' : norm < -0.15 ? 'BEARISH' : 'NEUTRAL';
  return { sentimentScore: norm, sentimentLabel: label };
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block   = match[1];
    const title   = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(block) || /<title>(.*?)<\/title>/.exec(block))?.[1]?.trim() || '';
    const url     = (/<link>(.*?)<\/link>/.exec(block))?.[1]?.trim() || '#';
    const pubDate = (/<pubDate>(.*?)<\/pubDate>/.exec(block))?.[1]?.trim() || '';
    const snippet = (/<description><!\[CDATA\[(.*?)\]\]><\/description>/.exec(block) || /<description>(.*?)<\/description>/.exec(block))?.[1]?.replace(/<[^>]*>/g, '').trim().slice(0, 250) || '';
    if (title) items.push({ title, url, publishedAt: pubDate, snippet });
  }
  return items;
}

export async function fetchNewsNode(state) {
  try {
    const { ticker, companyName } = state;
    let articles = [];

    // Try Yahoo Finance RSS for the ticker
    if (ticker) {
      try {
        const rssUrl = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${ticker}&region=US&lang=en-US`;
        const rssRes = await fetch(rssUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (rssRes.ok) {
          const xml = await rssRes.text();
          articles  = parseRSS(xml).slice(0, 8);
        }
      } catch (_) {}
    }

    // Fallback: Yahoo Finance news search RSS
    if (articles.length === 0) {
      try {
        const q = encodeURIComponent(companyName + ' stock');
        const rssRes = await fetch(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${q}&region=US&lang=en-US`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (rssRes.ok) {
          const xml = await rssRes.text();
          articles  = parseRSS(xml).slice(0, 8);
        }
      } catch (_) {}
    }

    // Score each article's sentiment with keyword engine
    const scored = articles.map(a => ({
      ...a,
      ...scoreSentiment(a.title + ' ' + a.snippet)
    }));

    // Compute overall sentiment (0–100)
    const avg = scored.length > 0
      ? scored.reduce((sum, a) => sum + a.sentimentScore, 0) / scored.length
      : 0;
    const overallSentiment = Math.round(50 + avg * 50);

    return { ...state, newsArticles: scored, sentimentScore: overallSentiment, currentNode: 'news_fetched' };
  } catch (err) {
    return { ...state, newsArticles: [], sentimentScore: 50, currentNode: 'news_fetched', errors: [...state.errors, `News fetch failed: ${err.message}`] };
  }
}

// ─── Node 4: Multi-Factor Financial Scoring Engine ────────────────────────────
export function scoreFinancialsNode(state) {
  const m = state.financialMetrics;
  const bullishSignals = [];
  const riskFlags      = [];
  let score = 50; // neutral baseline

  if (!m) {
    return { ...state, financialScore: 35, riskFlags: ['No financial data available — company may not be publicly listed'], bullishSignals: [], currentNode: 'scored' };
  }

  // ── Profitability ──────────────────────────────────────────
  if (m.profitMargins > 0.20)       { score += 10; bullishSignals.push(`Excellent net profit margin: ${(m.profitMargins*100).toFixed(1)}%`); }
  else if (m.profitMargins > 0.10)  { score += 6;  bullishSignals.push(`Solid profit margins: ${(m.profitMargins*100).toFixed(1)}%`); }
  else if (m.profitMargins > 0)     { score += 2;  }
  else if (m.profitMargins < 0)     { score -= 12; riskFlags.push(`Negative profit margins: ${(m.profitMargins*100).toFixed(1)}% — company is losing money`); }

  if (m.grossMargins > 0.50)        { score += 7;  bullishSignals.push(`Premium gross margins: ${(m.grossMargins*100).toFixed(1)}%`); }
  else if (m.grossMargins > 0.30)   { score += 4;  bullishSignals.push(`Healthy gross margins: ${(m.grossMargins*100).toFixed(1)}%`); }

  if (m.operatingMargins > 0.20)    { score += 5;  bullishSignals.push(`Strong operating leverage: ${(m.operatingMargins*100).toFixed(1)}%`); }
  else if (m.operatingMargins < 0)  { score -= 8;  riskFlags.push(`Negative operating margins: ${(m.operatingMargins*100).toFixed(1)}%`); }

  // ── Returns ────────────────────────────────────────────────
  if (m.returnOnEquity > 0.25)      { score += 8;  bullishSignals.push(`Exceptional ROE: ${(m.returnOnEquity*100).toFixed(1)}%`); }
  else if (m.returnOnEquity > 0.12) { score += 5;  bullishSignals.push(`Good return on equity: ${(m.returnOnEquity*100).toFixed(1)}%`); }
  else if (m.returnOnEquity < 0)    { score -= 8;  riskFlags.push(`Negative return on equity: ${(m.returnOnEquity*100).toFixed(1)}%`); }

  if (m.returnOnAssets > 0.10)      { score += 5;  bullishSignals.push(`Strong ROA: ${(m.returnOnAssets*100).toFixed(1)}%`); }
  else if (m.returnOnAssets < 0)    { score -= 5;  riskFlags.push(`Negative return on assets`); }

  // ── Growth ────────────────────────────────────────────────
  if (m.revenueGrowth > 0.20)       { score += 9;  bullishSignals.push(`High revenue growth: +${(m.revenueGrowth*100).toFixed(1)}% YoY`); }
  else if (m.revenueGrowth > 0.08)  { score += 5;  bullishSignals.push(`Positive revenue growth: +${(m.revenueGrowth*100).toFixed(1)}% YoY`); }
  else if (m.revenueGrowth > 0)     { score += 2;  }
  else if (m.revenueGrowth < -0.05) { score -= 10; riskFlags.push(`Declining revenue: ${(m.revenueGrowth*100).toFixed(1)}% YoY`); }
  else if (m.revenueGrowth < 0)     { score -= 5;  riskFlags.push(`Slightly declining revenue: ${(m.revenueGrowth*100).toFixed(1)}% YoY`); }

  if (m.earningsGrowth > 0.15)      { score += 8;  bullishSignals.push(`Strong earnings growth: +${(m.earningsGrowth*100).toFixed(1)}% YoY`); }
  else if (m.earningsGrowth > 0)    { score += 3;  }
  else if (m.earningsGrowth < 0)    { score -= 7;  riskFlags.push(`Declining earnings: ${(m.earningsGrowth*100).toFixed(1)}% YoY`); }

  // ── Balance Sheet ─────────────────────────────────────────
  if (m.currentRatio > 2.0)         { score += 5;  bullishSignals.push(`Very strong liquidity — current ratio: ${m.currentRatio.toFixed(2)}`); }
  else if (m.currentRatio > 1.2)    { score += 3;  bullishSignals.push(`Healthy current ratio: ${m.currentRatio.toFixed(2)}`); }
  else if (m.currentRatio < 1.0)    { score -= 8;  riskFlags.push(`Current ratio below 1.0 (${m.currentRatio.toFixed(2)}) — short-term liquidity risk`); }

  if (m.debtToEquity < 0.5)         { score += 6;  bullishSignals.push(`Very low debt-to-equity: ${m.debtToEquity.toFixed(2)}`); }
  else if (m.debtToEquity < 1.5)    { score += 3;  bullishSignals.push(`Manageable debt-to-equity: ${m.debtToEquity.toFixed(2)}`); }
  else if (m.debtToEquity > 4.0)    { score -= 9;  riskFlags.push(`Very high debt-to-equity: ${m.debtToEquity.toFixed(2)} — significant leverage risk`); }
  else if (m.debtToEquity > 2.5)    { score -= 5;  riskFlags.push(`Elevated debt-to-equity: ${m.debtToEquity.toFixed(2)}`); }

  // ── Cash Flow ─────────────────────────────────────────────
  if (m.freeCashflow > 0)           { score += 7;  const fcf = m.freeCashflow>=1e9?`$${(m.freeCashflow/1e9).toFixed(1)}B`:`$${(m.freeCashflow/1e6).toFixed(0)}M`; bullishSignals.push(`Positive free cash flow: ${fcf}`); }
  else if (m.freeCashflow < 0)      { score -= 8;  riskFlags.push(`Negative free cash flow — burning cash`); }

  // ── Valuation ─────────────────────────────────────────────
  if (m.peRatio != null && m.peRatio > 0) {
    if (m.peRatio < 15)             { score += 5;  bullishSignals.push(`Attractive P/E ratio: ${m.peRatio.toFixed(1)}x`); }
    else if (m.peRatio < 30)        { score += 2;  bullishSignals.push(`Reasonable P/E ratio: ${m.peRatio.toFixed(1)}x`); }
    else if (m.peRatio > 80)        { score -= 5;  riskFlags.push(`Very elevated P/E: ${m.peRatio.toFixed(1)}x — priced for perfection`); }
    else if (m.peRatio > 50)        { score -= 2;  riskFlags.push(`High P/E ratio: ${m.peRatio.toFixed(1)}x`); }
  }

  // ── Analyst Consensus ─────────────────────────────────────
  const recMap = { strong_buy: 7, buy: 4, hold: 0, underperform: -4, sell: -7, strong_sell: -9 };
  if (m.recommendationKey && recMap[m.recommendationKey] !== undefined) {
    const delta = recMap[m.recommendationKey];
    if (delta > 0)  { score += delta; bullishSignals.push(`Analyst consensus: ${m.recommendationKey.replace(/_/g,' ').toUpperCase()} (${m.numberOfAnalystOpinions || '?'} analysts)`); }
    else if (delta < 0) { score += delta; riskFlags.push(`Analyst consensus: ${m.recommendationKey.replace(/_/g,' ').toUpperCase()} (${m.numberOfAnalystOpinions || '?'} analysts)`); }
  }

  // ── Price Target Upside ───────────────────────────────────
  if (m.targetMeanPrice && m.currentPrice) {
    const upside = ((m.targetMeanPrice - m.currentPrice) / m.currentPrice) * 100;
    if (upside > 25)       { score += 6;  bullishSignals.push(`Strong analyst upside: +${upside.toFixed(1)}% to $${m.targetMeanPrice.toFixed(2)}`); }
    else if (upside > 10)  { score += 3;  bullishSignals.push(`Moderate analyst upside: +${upside.toFixed(1)}%`); }
    else if (upside < -15) { score -= 6;  riskFlags.push(`Analyst target implies downside: ${upside.toFixed(1)}%`); }
    else if (upside < 0)   { score -= 2;  riskFlags.push(`Slightly below analyst target`); }
  }

  // ── 52-Week Position ──────────────────────────────────────
  if (m.fiftyTwoWeekHigh && m.fiftyTwoWeekLow && m.currentPrice) {
    const range = m.fiftyTwoWeekHigh - m.fiftyTwoWeekLow;
    const pos   = (m.currentPrice - m.fiftyTwoWeekLow) / range;
    if (pos > 0.85)   riskFlags.push(`Trading near 52-week high — limited short-term upside`);
    else if (pos < 0.20) bullishSignals.push(`Trading near 52-week low — potential value opportunity`);
  }

  const finalScore = Math.max(0, Math.min(100, score));
  return { ...state, financialScore: finalScore, riskFlags, bullishSignals, currentNode: 'scored' };
}

// ─── Node 5: Rule-Based Investment Evaluator (No LLM Required) ───────────────
function generateThesis(state) {
  const { companyName, ticker, financialMetrics: m, financialScore: fs, sentimentScore: ss, bullishSignals, riskFlags } = state;
  const overall = Math.round(fs * 0.65 + ss * 0.35);
  const isInvest = overall >= 58;
  const verdict  = isInvest ? 'INVEST' : 'PASS';
  const confidence = overall >= 72 || overall <= 35 ? 'HIGH' : overall >= 62 || overall <= 46 ? 'MEDIUM' : 'LOW';

  const name    = m?.fullName || companyName;
  const sector  = m?.sector   || 'the market';
  const mktCap  = m?.marketCap ? (m.marketCap>=1e12?`$${(m.marketCap/1e12).toFixed(2)}T`:`$${(m.marketCap/1e9).toFixed(1)}B`) : null;

  // ── Build Thesis ─────────────────────────────────────────
  let thesis = '';
  if (isInvest) {
    const strengths = bullishSignals.slice(0, 3).map(s => s.split(':')[0].toLowerCase()).join(', ');
    thesis = `${companyName}${mktCap?' ('+mktCap+' market cap)':''} presents a compelling investment opportunity within ${sector}. `;
    thesis += `The company demonstrates ${strengths || 'solid fundamental strength'}, supported by a financial score of ${fs}/100. `;
    if (ss >= 60) thesis += `News sentiment is broadly positive at ${ss}/100, reinforcing confidence in the company's near-term trajectory. `;
    else          thesis += `Despite mixed news sentiment (${ss}/100), the underlying financial fundamentals remain the primary basis for this recommendation. `;
    thesis += `With ${bullishSignals.length} bullish signal${bullishSignals.length !== 1 ? 's' : ''} and only ${riskFlags.length} risk flag${riskFlags.length !== 1 ? 's' : ''} identified, the risk-reward profile supports a BUY position.`;
  } else {
    const weaknesses = riskFlags.slice(0, 3).map(s => s.split(':')[0].toLowerCase()).join(', ');
    thesis = `${companyName} currently does not meet our investment criteria. `;
    thesis += `Key concerns include ${weaknesses || 'deteriorating fundamentals'}, reflected in a below-threshold financial score of ${fs}/100. `;
    if (ss < 50) thesis += `Negative news sentiment (${ss}/100) compounds the bearish outlook, suggesting headwinds ahead. `;
    else         thesis += `While news sentiment (${ss}/100) is relatively neutral, it is insufficient to offset the fundamental weakness. `;
    thesis += `We recommend avoiding this position until the company demonstrates clear improvement in its core financial metrics.`;
  }

  // ── Build Analyst Notes ──────────────────────────────────
  const notes = [];
  notes.push(`Overall composite score: ${overall}/100 (Financial: ${fs}/100 weighted 65%, Sentiment: ${ss}/100 weighted 35%)`);
  if (m?.revenueGrowth != null) notes.push(`Revenue trajectory is ${m.revenueGrowth>0.1?'accelerating — a strong positive signal':m.revenueGrowth>0?'modestly positive':m.revenueGrowth>-0.05?'slightly declining — watch closely':'declining significantly — a material risk'}`);
  if (m?.profitMargins != null) notes.push(`Profit margins at ${(m.profitMargins*100).toFixed(1)}% indicate the company is ${m.profitMargins>0.15?'highly profitable with strong pricing power':m.profitMargins>0?'marginally profitable':'currently unprofitable — a key risk factor'}`);
  if (m?.freeCashflow != null)  notes.push(`Free cash flow is ${m.freeCashflow>0?'positive, indicating the company generates real cash after capital expenditure':'negative, meaning the company is burning cash — monitor runway'}`);
  if (m?.debtToEquity != null)  notes.push(`Balance sheet leverage (D/E: ${m.debtToEquity.toFixed(2)}) is ${m.debtToEquity<1?'conservative, providing financial flexibility':m.debtToEquity<2.5?'moderate and manageable':'elevated, increasing financial risk in a rising rate environment'}`);
  if (m?.recommendationKey)     notes.push(`Wall Street analyst consensus stands at "${m.recommendationKey.replace(/_/g,' ')}" based on ${m.numberOfAnalystOpinions||'multiple'} analyst opinions${m.targetMeanPrice&&m.currentPrice?`, with a mean target of $${m.targetMeanPrice.toFixed(2)} (${((m.targetMeanPrice-m.currentPrice)/m.currentPrice*100).toFixed(1)}% ${m.targetMeanPrice>m.currentPrice?'upside':'downside'})`:''}`);
  if (riskFlags.length > 0)     notes.push(`Key risks to monitor: ${riskFlags.slice(0,2).join('; ')}`);

  return { verdict, confidenceLevel: confidence, investmentThesis: thesis, analystNotes: notes.join('\n'), overallScore: overall };
}

export async function evaluatorNode(state) {
  try {
    const evaluation = generateThesis(state);
    return { ...state, ...evaluation, currentNode: 'complete' };
  } catch (err) {
    // Fallback verdict if generation fails
    const overall = Math.round((state.financialScore||50)*0.65 + (state.sentimentScore||50)*0.35);
    return {
      ...state,
      verdict:          overall >= 58 ? 'INVEST' : 'PASS',
      confidenceLevel:  'LOW',
      investmentThesis: `Based on a composite score of ${overall}/100, this company receives a ${overall>=58?'positive':'negative'} rating.`,
      analystNotes:     state.bullishSignals.concat(state.riskFlags.map(r=>'RISK: '+r)).join('\n'),
      overallScore:     overall,
      currentNode:      'complete',
      errors:           [...state.errors, `Evaluator warning: ${err.message}`]
    };
  }
}

// ─── Main Workflow Orchestrator ───────────────────────────────────────────────
export async function runResearchWorkflow(companyName, onProgress) {
  let state = {
    companyName,
    ticker: null,
    fullName: companyName,
    financialMetrics: null,
    newsArticles: [],
    financialScore: null,
    sentimentScore: null,
    riskFlags: [],
    bullishSignals: [],
    verdict: null,
    confidenceLevel: null,
    investmentThesis: null,
    analystNotes: null,
    overallScore: null,
    currentNode: 'start',
    errors: []
  };

  const emit = (node, message) => {
    state = { ...state, currentNode: node };
    onProgress?.({ node, message, state });
  };

  // Step 1 — Resolve Ticker
  emit('validating', `Searching for "${companyName}" on Yahoo Finance...`);
  state = await resolveTickerNode(state);
  emit('ticker_resolved', state.ticker ? `Ticker found: ${state.ticker} (${state.exchange || 'Exchange'})` : 'Ticker not found — proceeding with limited data');

  // Step 2 — Parallel: Financials + News
  emit('researching', 'Fetching live financial data and news simultaneously...');
  const [financialState, newsState] = await Promise.all([
    fetchFinancialsNode({ ...state }),
    fetchNewsNode({ ...state })
  ]);
  state = { ...state, ...financialState, newsArticles: newsState.newsArticles, sentimentScore: newsState.sentimentScore };
  emit('data_collected', `Fetched ${Object.values(financialState.financialMetrics||{}).filter(v=>v!=null).length} financial metrics · ${newsState.newsArticles.length} news articles`);

  // Step 3 — Score
  emit('scoring', 'Running multi-factor financial scoring engine...');
  state = scoreFinancialsNode(state);
  emit('scored', `Financial: ${state.financialScore}/100 · Sentiment: ${state.sentimentScore}/100 · ${state.bullishSignals.length} signals · ${state.riskFlags.length} flags`);

  // Step 4 — Evaluate & Generate Thesis
  emit('evaluating', 'Generating investment thesis and final verdict...');
  state = await evaluatorNode(state);
  emit('complete', `Verdict: ${state.verdict} · Confidence: ${state.confidenceLevel} · Overall: ${state.overallScore}/100`);

  return state;
}

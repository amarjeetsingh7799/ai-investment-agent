import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Research from './models/Research.js';
import { runResearchWorkflow } from './agent/workflow.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── DB Connection ─────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_investment_agent')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.warn('⚠️  MongoDB not connected (sessions won\'t be saved):', err.message));

// ─── GET / Root Status Page ────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>AI Investment Agent — API Server</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0a14;color:#fff;font-family:Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#0f0f1f;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px;max-width:480px;width:90%}
    h1{font-size:22px;font-weight:700;background:linear-gradient(135deg,#4f8ef7,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px}
    .sub{color:rgba(255,255,255,0.35);font-size:13px;margin-bottom:28px}
    .row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
    .row:last-child{border-bottom:none}
    .label{font-size:13px;color:rgba(255,255,255,0.55)}
    .ok{color:#10d98a;font-weight:600;font-size:13px}
    .tip{margin-top:24px;padding:14px;background:rgba(16,217,138,0.08);border:1px solid rgba(16,217,138,0.2);border-radius:10px;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.8}
    code{background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-family:monospace;color:#4f8ef7}
  </style>
</head>
<body>
  <div class="card">
    <h1>🔬 AI Investment Research Agent</h1>
    <p class="sub">Backend API Server &middot; Port 5000 &middot; Zero API Key Mode</p>
    <div class="row"><span class="label">Server Status</span><span class="ok">✅ Running</span></div>
    <div class="row"><span class="label">Financial Data</span><span class="ok">✅ Yahoo Finance (Free)</span></div>
    <div class="row"><span class="label">News Source</span><span class="ok">✅ Yahoo Finance RSS (Free)</span></div>
    <div class="row"><span class="label">Scoring Engine</span><span class="ok">✅ Rule-Based AI (No Key)</span></div>
    <div class="row"><span class="label">POST /api/research</span><span class="ok">✅ Ready</span></div>
    <div class="row"><span class="label">GET /api/history</span><span class="ok">✅ Ready</span></div>
    <div class="row"><span class="label">GET /health</span><span class="ok">✅ Ready</span></div>
    <div class="tip">
      ✅ <strong>No API keys required!</strong><br/>
      Open your app at <code>http://localhost:3000</code>
    </div>
  </div>
</body>
</html>`);
});

// ─── POST /api/research  (SSE streaming endpoint) ─────────────────────────────
app.post('/api/research', async (req, res) => {
  const { companyName } = req.body;
  if (!companyName?.trim()) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  // Set up Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendEvent = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  // Create a pending session in MongoDB
  let session = null;
  try {
    session = await Research.create({ companyName: companyName.trim(), status: 'RUNNING' });
    sendEvent('session', { sessionId: session._id });
  } catch (_) {
    // MongoDB optional — continue without it
  }

  try {
    const onProgress = ({ node, message }) => {
      sendEvent('progress', { node, message });
    };

    const result = await runResearchWorkflow(companyName.trim(), onProgress);

    // Persist results to MongoDB
    if (session) {
      await Research.findByIdAndUpdate(session._id, {
        ticker: result.ticker,
        verdict: result.verdict,
        confidenceLevel: result.confidenceLevel,
        financialScore: result.financialScore,
        sentimentScore: result.sentimentScore,
        financialMetrics: result.financialMetrics,
        newsArticles: result.newsArticles,
        riskFlags: result.riskFlags,
        bullishSignals: result.bullishSignals,
        investmentThesis: result.investmentThesis,
        analystNotes: result.analystNotes,
        status: 'COMPLETE'
      });
    }

    sendEvent('result', { result });
    sendEvent('done', {});
    res.end();

  } catch (err) {
    if (session) {
      await Research.findByIdAndUpdate(session._id, { status: 'ERROR', error: err.message });
    }
    sendEvent('error', { message: err.message });
    res.end();
  }
});

// ─── GET /api/history ─────────────────────────────────────────────────────────
app.get('/api/history', async (req, res) => {
  try {
    const history = await Research.find({ status: 'COMPLETE' })
      .select('companyName ticker verdict confidenceLevel financialScore sentimentScore createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(history);
  } catch (err) {
    res.json([]); // Return empty if DB is unavailable
  }
});

// ─── GET /api/research/:id ─────────────────────────────────────────────────────
app.get('/api/research/:id', async (req, res) => {
  try {
    const research = await Research.findById(req.params.id);
    if (!research) return res.status(404).json({ error: 'Not found' });
    res.json(research);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 AI Investment Agent server running on http://localhost:${PORT}`);
});

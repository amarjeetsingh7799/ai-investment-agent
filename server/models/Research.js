import mongoose from 'mongoose';

const researchSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  ticker: { type: String, default: null },
  verdict: { type: String, enum: ['INVEST', 'PASS'], default: null },
  confidenceLevel: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: null },
  financialScore: { type: Number, default: null },
  sentimentScore: { type: Number, default: null },
  financialMetrics: { type: mongoose.Schema.Types.Mixed, default: null },
  newsArticles: [{ type: mongoose.Schema.Types.Mixed }],
  riskFlags: [{ type: String }],
  bullishSignals: [{ type: String }],
  investmentThesis: { type: String, default: null },
  analystNotes: { type: String, default: null },
  status: { type: String, enum: ['PENDING', 'RUNNING', 'COMPLETE', 'ERROR'], default: 'PENDING' },
  error: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Research', researchSchema);

# AI Investment Research Agent

An intelligent, fully autonomous AI agent that conducts deep financial research on public companies and provides a data-backed `INVEST` or `PASS` verdict.

Built for the **1-year AI Product Development Engineer Internship assignment at InsideIIM × Altuni AI Labs**.

## 📖 Overview — What it does

This application allows a user to input a public company name (e.g., "Apple Inc", "Tesla"). The agent then:
1. Automatically resolves the company name to its stock ticker.
2. Fetches **live, real-time financial data** (30+ metrics including margins, P/E, free cash flow, growth rates) using `yahoo-finance2` (which bypasses API blocks).
3. Fetches **real-time news headlines** via Yahoo Finance RSS.
4. Uses a **Multi-Factor Rule-Based AI Engine** to evaluate the data, assigning scores to financials and news sentiment.
5. Generates a final investment thesis, confidence level, and an overall `INVEST` or `PASS` verdict.
6. Presents the findings in a stunning, hardware-accelerated **3D Glassmorphic UI** powered by React and Three.js.

## 🚀 How to run it

This project operates with **Zero API Keys**. You do not need OpenAI, Tavily, or any paid services to run it. Everything uses free, public data endpoints.

### Prerequisites
- Node.js (v18 or higher)
- Optional: MongoDB (for saving session history, but the app falls back gracefully if not running)

### Step 1: Start the Backend (API Server)
Open a terminal and run:
```bash
cd server
npm install
npm start
```
*The backend will run on `http://localhost:5000`.*

### Step 2: Start the Frontend (Vite + React)
Open a second terminal and run:
```bash
cd client
npm install
npm run dev
```
*The frontend will run on `http://localhost:3000`. Open this in your browser.*

## 🧠 How it works (Architecture)

**Frontend (Client):** 
- Built with **React + Vite**.
- Uses custom **Three.js** for a 3D animated particle background.
- Heavy use of **CSS Variables** and `translateZ(0)` for GPU-accelerated glassmorphism without causing frame drops or layout shifts.
- Implements **Server-Sent Events (SSE)** to stream the agent's progress dynamically as it fetches data in parallel.

**Backend (Server):**
- Built with **Node.js + Express**.
- The `workflow.js` agent operates as a sequential pipeline:
  - **Node 1 (Validation):** Queries Yahoo Finance search to resolve company names to tickers.
  - **Node 2 (Financials):** Uses `yahoo-finance2` to scrape deeply nested financial metrics safely.
  - **Node 3 (News/Sentiment):** Parses XML RSS feeds and runs keyword-based sentiment analysis (`BULLISH`/`BEARISH` lexicons).
  - **Node 4 & 5 (Scoring & Thesis):** Evaluates profitability, debt, liquidity, and valuation multiples to generate an overarching score (0-100) and deterministic thesis.

## ⚖️ Key Decisions & Trade-offs

1. **Rule-Based Engine vs. LLM (Cost & Reliability):** 
   *Decision:* I opted to build a deterministic, rule-based scoring engine instead of calling OpenAI GPT-4 for the evaluation.
   *Why:* The user required the system to run seamlessly with "as little as possible" and zero API keys. LLMs introduce latency, hallucinations in financial math, and require paid keys. A multi-factor algorithm guarantees instant, reproducible, and free results.
   
2. **yahoo-finance2 vs. raw fetch:**
   *Decision:* Upgraded from raw `fetch` to `yahoo-finance2` (v4).
   *Why:* Yahoo Finance recently started blocking basic fetch requests by requiring valid cookie/crumb pairs. `yahoo-finance2` handles this automatically, allowing us to retrieve all 30 metrics instead of just 3.

3. **Vite vs. Create React App:**
   *Decision:* Migrated to Vite.
   *Why:* `react-scripts` conflicts with newer Node versions (v24). Vite is significantly faster and more stable.

## 📊 Example Runs

- **Apple Inc (AAPL):**
  - Financial Score: 97/100 (Exceptional profit margins, massive free cash flow, high ROE).
  - Sentiment Score: ~53/100 (Neutral/mixed daily news).
  - Verdict: **INVEST (HIGH CONFIDENCE)**.
  
- **Peloton (PTON):**
  - Financial Score: 20/100 (Negative margins, burning cash, high debt).
  - Sentiment Score: ~45/100 (Bearish outlooks).
  - Verdict: **PASS (HIGH CONFIDENCE)**.

## 🔮 What I would improve with more time

1. **Integrate a Local LLM:** I would integrate `Ollama` or a local LLaMA-3 model to parse the news articles more deeply and generate the thesis, maintaining the "Zero API Key / Free" requirement while adding true NLP.
2. **Historical Charts:** Integrate `Chart.js` to map the company's stock price over the last 5 years directly inside the Financials tab.
3. **Database Integration:** Fully wire up the MongoDB instance to allow users to compare their historical `INVEST` ratings against real market performance 6 months later.

---
*Built with ❤️ and AI.*

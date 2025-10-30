# InsightBridge – Chrome Built-in AI Challenge 2025 Submission

## Overview
InsightBridge helps investors quickly decide whether a news article or research paper affects their portfolio.  
Using Chrome’s built-in AI models (Summarizer, Prompt, Rewriter), the extension:
1. Summarizes the article in 2 sentences.
2. Judges relevance to selected stocks.
3. Simplifies the explanation for non-experts.

All analysis runs locally in Chrome — no data leaves your browser.

---

## How to Run
1. Open **Chrome Canary** or any version with Built-in AI APIs enabled.
2. Go to `chrome://extensions/` → **Load unpacked** → select the `InsightBridge` folder.
3. Click the extension icon → paste article text → enter stock tickers → click “Analyze”.
4. Wait a few seconds — result will show summary, verdict, and explanation.

---

## APIs Used
- `ai.summarizer.summarize()` – compresses text to 2-sentence summary.
- `ai.prompt.prompt()` – classifies relevance to user portfolio.
- `ai.rewriter.rewrite()` – simplifies the explanation for readability.

---

## Example Output
**Input:** "Tesla announced expansion of its Gigafactory Shanghai to double battery output..."
**Stocks:** TSLA, NVDA

**Output:**
✅ Relevant
Summary: Tesla will expand its Gigafactory Shanghai to double production. The move strengthens its supply chain for EV batteries.
Explanation: This development directly impacts TSLA as it increases production capacity. It may also influence suppliers like NVDA indirectly through AI chip demand. For other stocks, the impact is minimal.
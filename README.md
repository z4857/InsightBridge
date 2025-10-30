# InsightBridge – Your personal multilingual AI stock analyst

## Overview
InsightBridge helps investors quickly decide whether a news article or research paper affects their stock.  
Using Chrome’s built-in AI models and Yahoo API, the extension:
1. Retrieves the company name from stock stick
2. Summarizes the article in 5 sentences.
3. Judges relevance to selected stocks.
4. Simplifies the explanation for non-experts.
5. Wraps up everything in a short paragraph for future use

All analysis runs locally in Chrome — no personal API key required.

---

## How to Run
1. Open **Chrome Canary** or any version with Built-in AI APIs enabled.
2. Go to `chrome://extensions/` → **Load unpacked** → select the `InsightBridge` folder.
3. Click the extension icon → paste article text → enter stock tickers → click “Analyze”.
4. Wait a few seconds — result will show summary, verdict, and explanation.

---

## Chrome Built-in APIs Used (to be enabled in chrome://flags/)
- `Prompt API for Gemini Nano.
- `Prompt API for Gemini Nano with Multimodal Input.
- `Summarization API for Gemini Nano.

---

## Use Example 
**Stock sticker:** TSLA
**Output language:** "English"

**Output:**
Tesla, Inc. (TSLA) - Trade Deal Analysis
Here's an analysis of how the US-China trade deal framework impacts Tesla, Inc. (TSLA):

---

1. Identification:

Country/Region: Tesla operates globally with a significant presence in the US, Europe, and Asia. However, it heavily relies on both the US and Chinese markets.
Main Business Sector: Tesla is an automotive and clean energy company, primarily focused on electric vehicles, battery energy storage, and solar products.

2. Relevance:

The webpage content is highly relevant to TSLA. The US-China trade relationship significantly impacts Tesla due to its manufacturing footprint, supply chain dependencies, and market access in both countries.

3. Explanation:

Trade deal framework reduces uncertainty in global trade environment.
Delayed tariffs benefit Tesla's supply chain costs.
Resumption of soybean purchases eases broader trade tensions.
Potential for smoother Chinese market access for Tesla.
TikTok sale plan indirectly affects broader tech/consumer sentiment.

4. Summary:

The US and China have reached a trade deal framework, delaying tariffs and addressing concerns around mineral exports and TikTok. This development is highly relevant to Tesla, which relies on both markets for manufacturing, supply chains, and sales. Reduced tariff risk can positively impact Tesla's costs and profitability, while smoother trade relations may unlock further growth opportunities in China, a crucial market. The broader easing of trade tensions reduces overall market uncertainty, which is generally favorable for investor sentiment toward companies like Tesla. This agreement could lead to increased confidence in Tesla's long-term prospects, particularly within the Asian market.

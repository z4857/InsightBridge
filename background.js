// --- Initialize side panel ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(err => console.error('Failed to set sidebar behavior:', err));
});

// --- Language detection helper function ---
function detectLanguage(text) {
  const chineseChars = /[\u4e00-\u9fa5]/;
  const japaneseChars = /[\u3040-\u30ff\u31f0-\u31ff]/;
  const koreanChars = /[\uac00-\ud7af]/;
  if (chineseChars.test(text)) return 'zh';
  if (japaneseChars.test(text)) return 'ja';
  if (koreanChars.test(text)) return 'ko';
  return 'en';
}

// --- Define stock lookup function ---
async function lookupTickerInfo(symbol) {
  const proxy = "https://api.allorigins.win/raw?url=";
  const yahooURL = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}`;

  try {
    console.log('Looking up stock symbol via Yahoo Finance:', symbol);
    const response = await fetch(proxy + yahooURL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Yahoo Finance API result:', data);

    if (data.quotes && data.quotes.length > 0) {
      const company = data.quotes[0];
      return {
        found: true,
        symbol: company.symbol || symbol,
        name: company.shortname || company.longname || null,
        company: company.shortname || company.longname || null,
        exchange: company.exchange || null
      };
    } else {
      return {
        found: false,
        symbol: symbol,
        name: null,
        company: null
      };
    }

  } catch (error) {
    console.error('Yahoo Finance stock lookup failed:', error);
    return {
      found: false,
      symbol: symbol,
      name: null,
      company: null,
      error: error.message
    };
  }
}

// --- Summarizer + Prompt main function (enhanced version) ---
async function summarizeAndAnalyze(ticker, outputLang = 'zh') {
  try {
    console.log('Starting stock analysis:', ticker, 'language:', outputLang);

    // Step 0: Retrieve stock information using Yahoo Finance API
    chrome.runtime.sendMessage({
      type: 'ANALYSIS_PROGRESS',
      message: 'Looking up stock information...'
    });

    const tickerInfo = await lookupTickerInfo(ticker);
    console.log('Stock information lookup result:', tickerInfo);

    const pageText = await getActiveTabText();
    if (!pageText.trim()) throw new Error('Page content is empty.');

    // Step 1: Automatic language detection
    const detectedLang = detectLanguage(pageText);
    console.log('Detected language:', detectedLang);

    chrome.runtime.sendMessage({
      type: 'ANALYSIS_PROGRESS',
      message: 'Generating content summary...'
    });

    // Step 2: Summarizer stage (supports multiple languages)
    let summary = '';
    try {
      if (typeof Summarizer === 'undefined') {
        throw new Error('Summarizer API not available');
      }

      const summarizer = await Summarizer.create({
        type: 'tldr',
        length: 'medium',
        language: detectedLang === 'en' ? 'en' : 'auto'
      });

      const summaryResult = await summarizer.summarize(pageText.substring(0, 5000));

      if (typeof summaryResult === 'string') summary = summaryResult;
      else if (summaryResult?.summary) summary = summaryResult.summary;
      else if (Array.isArray(summaryResult?.summaries) && summaryResult.summaries[0]?.text)
        summary = summaryResult.summaries[0].text;
      else summary = '(AI did not generate summary)';

    } catch (summarizerError) {
      console.error('Summarizer error:', summarizerError);
      summary = 'Summary generation failed, using first 500 characters of original text:\n' + pageText.substring(0, 500);
    }

    chrome.runtime.sendMessage({
      type: 'ANALYSIS_PROGRESS',
      message: 'Performing relevance analysis...'
    });

    // Step 3: Prompt stage (using looked up stock information)
    let finalOutput = summary;

    if (typeof LanguageModel !== 'undefined') {
      try {
        const availability = await LanguageModel.availability();
        if (availability === 'available') {
          const session = await LanguageModel.create();

          const promptLang = outputLang === 'en' ? 'English' :
                           outputLang === 'ja' ? 'Japanese' :
                           outputLang === 'ko' ? 'Korean' : 'Chinese';

          // Build stock information string with proper fallbacks
          let tickerInfoStr = '';
          if (tickerInfo.found && tickerInfo.name) {
            tickerInfoStr = `
Stock Ticker: ${tickerInfo.symbol}
Company Name: ${tickerInfo.name}
Exchange: ${tickerInfo.exchange || 'Unknown'}
Source: Yahoo Finance API`;
          } else if (tickerInfo.found && !tickerInfo.name) {
            tickerInfoStr = `
Stock Ticker: ${tickerInfo.symbol}
Company Name: Information not available
Source: Yahoo Finance API`;
          } else {
            tickerInfoStr = `
Stock Ticker: ${ticker}
Note: This ticker was not found in Yahoo Finance search results. It might be an incorrect ticker symbol, or it might be delisted/not actively traded.`;
          }

          const promptInput = `
You are a global financial market expert. Please respond in ${promptLang}.

${tickerInfoStr}

Below is the webpage summary: 
${summary}

Please analyze and provide:

1. **Identification**: 
   ${tickerInfo.found ? 
     `The ticker ${tickerInfo.symbol} represents "${tickerInfo.name || 'a company'}" (from Yahoo Finance). Identify which country/region this company operates in and its main business sector based on the context.` : 
     `The ticker "${ticker}" was not found in Yahoo Finance. Try to identify if this might be a valid ticker from other exchanges or if it might be incorrect. If you can identify the company from context, provide the company name, country, and exchange.`}

2. **Relevance**: Assess whether the webpage content is highly relevant to this stock/company.

3. **Explanation**: Provide brief bullet points (each point ≤15 words) explaining the key connections or reasons for relevance/irrelevance.

4. **Summary**: Generate an integrated summary (≤5 sentences) containing:
   - Core content of the webpage
   - Relevance conclusion to the stock
   - Any important financial/business implications

**Important**: Respond strictly in ${promptLang}. Use clear markdown formatting.
          `;

          console.log('Sending prompt to LanguageModel...');
          const promptResult = await session.prompt(promptInput);
          finalOutput = promptResult || summary;

          console.log('LanguageModel response received');

        } else {
          finalOutput = `${summary}\n\n(Note: Prompt API currently unavailable, status: ${availability})`;
        }
      } catch (promptError) {
        console.error('Prompt API call failed:', promptError);
        finalOutput = `${summary}\n\n(Note: Prompt API call failed, showing summary only. Error: ${promptError.message})`;
      }
    } else {
      console.warn('Current browser environment does not support LanguageModel API');
      finalOutput += '\n\n(Note: Browser does not support built-in Prompt API, showing summary only)';
    }

    // Step 4: Return results to sidepanel
    chrome.runtime.sendMessage({
      type: 'ANALYSIS_COMPLETE',
      analysis: finalOutput,
      tickerInfo: tickerInfo
    });

  } catch (err) {
    console.error('Analysis failed:', err);
    chrome.runtime.sendMessage({
      type: 'ANALYSIS_ERROR',
      error: err.message
    });
  }
}

// --- Receive instructions from sidepanel.js ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('Message received:', msg.type);
  
  if (msg.type === 'ANALYZE_PAGE') {
    summarizeAndAnalyze(msg.ticker, msg.outputLang);
    // Return true to indicate async response
    return true;
  }
});

// --- Helper: Get active tab text content ---
async function getActiveTabText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab found');

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body?.innerText || ''
    });

    const text = results && results[0]?.result ? results[0].result.trim() : '';
    console.log('Extracted text length:', text.length);
    return text;
  } catch (error) {
    console.error('Failed to extract active tab text:', error);
    return '';
  }
}

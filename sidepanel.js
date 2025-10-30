// --- 初始化界面按钮 ---
document.addEventListener('DOMContentLoaded', function() {
  const analyzeBtn = document.getElementById('analyze');
  const tickerInput = document.getElementById('ticker');
  const languageSelect = document.getElementById('language');
  const resultDiv = document.getElementById('result');

  // 恢复保存的设置
  chrome.storage.local.get(['lastTicker', 'lastLanguage'], function(result) {
    if (result.lastTicker) {
      tickerInput.value = result.lastTicker;
    }
    if (result.lastLanguage) {
      languageSelect.value = result.lastLanguage;
    }
  });

  analyzeBtn.addEventListener('click', function() {
    const ticker = tickerInput.value.trim().toUpperCase();
    const outputLang = languageSelect.value;

    if (!ticker) {
      alert('Please enter a stock code.');
      tickerInput.focus();
      return;
    }

    // 保存用户设置
    chrome.storage.local.set({
      lastTicker: ticker,
      lastLanguage: outputLang
    });

    // 更新UI状态 - FIXED: Changed to ANALYZING
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span>ANALYZING</span>';
    resultDiv.innerText = 'Analysis in progress...';

    // 发送分析请求
    chrome.runtime.sendMessage({ 
      type: 'ANALYZE_PAGE', 
      ticker: ticker, 
      outputLang: outputLang 
    }, function(response) {
      // 处理发送消息时的错误
      if (chrome.runtime.lastError) {
        console.error('Message sending failure:', chrome.runtime.lastError);
        resultDiv.innerText = '❌ Message sending failure: ' + chrome.runtime.lastError.message;
        // FIXED: Reset button on error
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<span>START</span>';
      }
    });
  });

  // 按Enter键触发分析
  tickerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      analyzeBtn.click();
    }
  });
});

// --- 接收 background.js 返回的结果 ---
chrome.runtime.onMessage.addListener((msg) => {
  const analyzeBtn = document.getElementById('analyze');
  const resultDiv = document.getElementById('result');

  console.log('Message received:', msg.type); // 调试信息

  if (msg.type === 'ANALYSIS_COMPLETE') {
    resultDiv.innerHTML = markdownToHtml(msg.analysis);
    // FIXED: Reset button on completion
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<span>START</span>';
    }
  } else if (msg.type === 'ANALYSIS_ERROR') {
    resultDiv.innerText = '❌ Error: ' + msg.error;
    // FIXED: Reset button on error
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<span>START</span>';
    }
  } else if (msg.type === 'ANALYSIS_PROGRESS') {
    resultDiv.innerText = msg.message;
    // Keep button disabled during progress
  }
});

// --- 改进的 Markdown 转 HTML 函数 ---
function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown;
  
  // 预处理：统一换行符
  html = html.replace(/\r\n/g, '\n');
  
  // 转换标题（必须在行首）
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // 转换粗体和斜体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // 转换代码
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  
  // 转换链接
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // 转换无序列表
  const lines = html.split('\n');
  let inList = false;
  let processedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listMatch = line.match(/^[\s]*[-*•]\s+(.+)$/);
    
    if (listMatch) {
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      processedLines.push('<li>' + listMatch[1] + '</li>');
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }
  
  if (inList) {
    processedLines.push('</ul>');
  }
  
  html = processedLines.join('\n');
  
  // 转换段落（避免在标题和列表中创建段落）
  const paragraphLines = html.split('\n');
  let result = [];
  let paragraphBuffer = [];
  
  for (let line of paragraphLines) {
    const trimmed = line.trim();
    
    // 如果是标题、列表标签或空行
    if (trimmed.startsWith('<h') || 
        trimmed.startsWith('</h') || 
        trimmed.startsWith('<ul>') || 
        trimmed.startsWith('</ul>') || 
        trimmed.startsWith('<li>') ||
        trimmed === '') {
      
      // 先处理缓存的段落
      if (paragraphBuffer.length > 0) {
        result.push('<p>' + paragraphBuffer.join(' ') + '</p>');
        paragraphBuffer = [];
      }
      
      // 添加当前行（如果不是空行）
      if (trimmed !== '') {
        result.push(line);
      }
    } else {
      // 累积段落内容
      paragraphBuffer.push(trimmed);
    }
  }
  
  // 处理最后的段落缓存
  if (paragraphBuffer.length > 0) {
    result.push('<p>' + paragraphBuffer.join(' ') + '</p>');
  }
  
  html = result.join('\n');
  
  // 清理多余的空白
  html = html.replace(/\n{3,}/g, '\n\n');
  html = html.trim();
  
  return html;
}
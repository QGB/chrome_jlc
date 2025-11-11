document.addEventListener('DOMContentLoaded', () => {
    const logContainer = document.getElementById('log-container');
    const clearLogsBtn = document.getElementById('clear-logs-btn');

    // 监听来自其他脚本的日志消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'JLC_LOG') {
            const logEntry = document.createElement('div');
            const timestamp = new Date().toLocaleTimeString();
            logEntry.textContent = `[${timestamp}] ${message.payload.message}`;
            
            // 根据日志类型设置不同颜色
            if (message.payload.level === 'error') {
                logEntry.className = 'log-error';
            } else if (message.payload.message.includes('✅')) {
                logEntry.className = 'log-success';
            } else {
                logEntry.className = 'log-info';
            }
            
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight; // 自动滚动到底部
        }
    });

    clearLogsBtn.addEventListener('click', () => {
        logContainer.innerHTML = '';
    });
});
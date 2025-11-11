// 保存原始的 console 方法
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

function sendLog(level, args) {
    const message = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');

    // 1. 发送消息到 options 页面（如果页面打开了）
    chrome.runtime.sendMessage({
        type: 'JLC_LOG',
        payload: {
            level: level,
            message: message
        }
    }).catch(error => {
        // 如果 options 页面未打开，会有一个错误，我们忽略它
    });

    // 2. 调用原始的 console 方法，确保开发者工具中仍然有输出
    if (level === 'error') {
        originalConsoleError.apply(console, args);
    } else {
        originalConsoleLog.apply(console, args);
    }
}

// 重写 console.log 和 console.error
console.log = (...args) => sendLog('log', args);
console.error = (...args) => sendLog('error', args);
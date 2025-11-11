document.addEventListener('DOMContentLoaded', () => {
    const importBtn = document.getElementById('import-btn');

    importBtn.addEventListener('click', () => {
        // 查询当前活动的标签页
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab) {
                // 注入并执行 content-script.js 文件
                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    files: ['content-script.js'],
                });
            }
            // 执行后关闭弹出窗口
            window.close();
        });
    });
});
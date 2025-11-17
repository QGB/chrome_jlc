import './logger.js';
document.addEventListener('DOMContentLoaded', () => {
    const importBtn = document.getElementById('import-btn');
    const getJlcCookiesBtn = document.getElementById('get-jlc-cookies-btn');
    const openOptionsBtn = document.getElementById('open-options-btn');
    const getAllComponentsBtn = document.getElementById('get-all-components-btn');
    const deleteComponentBtn = document.getElementById('delete-component-btn');

    importBtn.addEventListener('click', () => {
        executeContentScript();
    });

    getJlcCookiesBtn.addEventListener('click', () => {
        fetchAndPostJlcCookies();
    });

    openOptionsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    getAllComponentsBtn.addEventListener('click', () => {
        console.log(" getAllComponents ", 2);//
        injectAndExecute('getAllComponents');
    });

    deleteComponentBtn.addEventListener('click', () => {
        const uuidToDelete = document.getElementById('component-uuid-input').value.trim();
        console.log(" deleteComponent ", uuidToDelete);//
        if (uuidToDelete) {
            injectAndExecute('deleteComponent', [uuidToDelete]);
        } else {
            console.log("JLC 扩展：请输入要删除的封装UUID。");
        }
    });

    // 封装执行 content-script 的逻辑
    function executeContentScript() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab) {
                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    files: ['logger.js', 'content-script.js'],
                }, () => {
                    // 脚本注入后，可以在这里处理结果或关闭弹出窗口
                    window.close();
                });
            } else {
                console.error("JLC 扩展：未找到当前活动标签页。");
                window.close();
            }
        });
    }

    // 通用的脚本注入函数
    function injectAndExecute(functionName, args = []) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab && currentTab.url.includes('lceda.cn')) {
                // 1. 先注入包含函数定义的文件
                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    files: ['page-functions.js']
                }).then(() => {
                    // 2. 再发送消息，调用刚刚注入的函数
                    chrome.tabs.sendMessage(currentTab.id, {
                        type: 'EXECUTE_FUNCTION',
                        functionName: functionName,
                        args: args
                    });
                });

                // 注意：这里不再使用 func 和 args 选项
            } else {
                console.error("JLC 扩展：此功能只能在 lceda.cn 页面上运行。");
            }
            // Don't close the popup immediately to see logs if needed
            // window.close();
        });
    }

    // 获取 jlc.com cookies 并发送的逻辑
    async function fetchAndPostJlcCookies() {
        try {
            const options = { domain: "jlc.com" };

            // 获取当前窗口信息，判断是否为隐私模式
            const currentWindow = await chrome.windows.getCurrent();
            if (currentWindow.incognito) {
                const [currentTab] = await chrome.tabs.query({ active: true, windowId: currentWindow.id });
                // 在隐私模式下，直接从当前标签页获取其 cookieStoreId
                if (currentTab && currentTab.cookieStoreId) {
                    options.storeId = currentTab.cookieStoreId;
                } else {
                    console.warn("JLC 扩展：无法从当前隐私标签页确定 Cookie Store ID。将使用当前执行上下文的存储区。");
                }
            }

            const allCookies = await chrome.cookies.getAll(options);
            
            // 定义需要筛选的 cookie 名称
            const targetCookieNames = ['JLC_CUSTOMER_CODE', 'JLCGROUP_SESSIONID', 'XSRF-TOKEN'];
            
            // 筛选出目标 cookies
            const filteredCookies = allCookies.filter(cookie => targetCookieNames.includes(cookie.name));
            
            const cookieData = JSON.stringify(filteredCookies, null, 2);
            console.log("JLC 扩展：获取到 jlc.com 的目标 cookies:", cookieData);

            
            await fetch("http://127.0.0.1:1122/jlc_cookies=request.get_json();r=len(jlc_cookies)", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: cookieData,
            });
            console.log("JLC 扩展：Cookies 已成功发送到本地服务器。");
        } catch (error) {
            // 优化错误日志，提供更详细的诊断信息
            console.error("JLC 扩展：获取或发送 cookies 失败。");
            console.error("错误名称:", error.name);
            console.error("错误信息:", error.message);
            console.error("错误堆栈:", error.stack);

            // 检查是否可能是在隐私模式下被阻止访问 localhost
            const currentWindow = await chrome.windows.getCurrent();
            if (currentWindow.incognito && error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.error("JLC 扩展提示：检测到可能是在隐私模式下访问 localhost 失败。请确保在扩展详情页面 (chrome://extensions) 中，已为本扩展勾选了 '允许访问文件网址' 选项。这是在隐私模式下访问本地服务器所必需的。");
            }
        } finally {
            window.close(); // 无论成功失败都关闭弹出窗口
        }
    }
});
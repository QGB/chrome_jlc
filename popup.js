import './logger.js';
document.addEventListener('DOMContentLoaded', () => {
    const importBtn = document.getElementById('import-btn');
    const getJlcCookiesBtn = document.getElementById('get-jlc-cookies-btn');
    const openOptionsBtn = document.getElementById('open-options-btn');

    importBtn.addEventListener('click', () => {
        executeContentScript();
    });

    getJlcCookiesBtn.addEventListener('click', () => {
        fetchAndPostJlcCookies();
    });

    openOptionsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
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

    // 获取 jlc.com cookies 并发送的逻辑
    async function fetchAndPostJlcCookies() {
        try {
            const allCookies = await chrome.cookies.getAll({ domain: "jlc.com" });
            
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
            console.error("JLC 扩展：获取或发送 cookies 失败:", error);
        } finally {
            window.close(); // 无论成功失败都关闭弹出窗口
        }
    }
});
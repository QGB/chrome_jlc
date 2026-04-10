// 自动检测订单页面并执行订单脚本

(function() {
    // 检查当前页面URL是否匹配订单页面
    function isOrderPage() {
        const currentUrl = window.location.href;
        return currentUrl.startsWith('https://www.jlc.com/newOrder/#/pcb/pcbPlaceOrder?');
    }

    // 动态加载并执行 order-script.js
    function executeOrderScript() {
        console.log("JLC 扩展：[自动检测] 检测到订单页面，准备执行订单自动化脚本...");
        
        // 创建 script 标签来加载 order-script.js
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('order-script.js');
        script.onload = function() {
            console.log("JLC 扩展：[自动检测] order-script.js 加载并执行完成。");
            document.head.removeChild(script);
        };
        script.onerror = function() {
            console.error("JLC 扩展：[自动检测] 加载 order-script.js 失败。");
            document.head.removeChild(script);
        };
        
        document.head.appendChild(script);
    }

    // 主要检测逻辑
    function startAutoDetection() {
        console.log("JLC 扩展：[自动检测] 开始监听订单页面...");
        ms=11000
        // 检查当前页面
        if (isOrderPage()) {
            console.log("JLC 扩展：[自动检测] 当前页面匹配订单页面，等待"+(ms/1000)+"秒后执行...");
            setTimeout(() => {
                executeOrderScript();
            }, ms);
            return;
        }

        // 监听页面URL变化（SPA应用）
        let lastUrl = window.location.href;
        const observer = new MutationObserver(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                console.log("JLC 扩展：[自动检测] 页面URL发生变化:", currentUrl);
                
                if (isOrderPage()) {
                    console.log("JLC 扩展：[自动检测] 检测到订单页面，等待5秒后执行...");
                    setTimeout(() => {
                        executeOrderScript();
                    }, 5000);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 监听 popstate 事件（浏览器前进后退）
        window.addEventListener('popstate', () => {
            setTimeout(() => {
                if (isOrderPage()) {
                    console.log("JLC 扩展：[自动检测] popstate事件检测到订单页面，等待5秒后执行...");
                    setTimeout(() => {
                        executeOrderScript();
                    }, 5000);
                }
            }, 100);
        });

        console.log("JLC 扩展：[自动检测] 监听器已设置完成。");
    }

    // 确保页面加载完成后开始检测
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startAutoDetection);
    } else {
        startAutoDetection();
    }
})();
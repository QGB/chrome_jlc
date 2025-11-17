import './logger.js';

document.addEventListener('DOMContentLoaded', () => {
    let isBusy = false; // Global flag to prevent concurrent operations
    const importBtn = document.getElementById('import-btn');
    const getJlcCookiesBtn = document.getElementById('get-jlc-cookies-btn');
    const openOptionsBtn = document.getElementById('open-options-btn');
    const getAllComponentsBtn = document.getElementById('get-all-components-btn');
    const deleteFootprintContainer = document.getElementById('delete-footprint-container');
    const deleteFootprintSubmenu = document.getElementById('delete-footprint-submenu');

    importBtn.addEventListener('click', () => {
        if (isBusy) return;
        executeContentScript();
    });

    getJlcCookiesBtn.addEventListener('click', () => {
        if (isBusy) return;
        fetchAndPostJlcCookies();
    });

    openOptionsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    getAllComponentsBtn.addEventListener('click', () => {
        if (isBusy) return;
        console.log(" getAllComponents ", 2);//
        injectAndExecute('getAllComponents');
    });

    // Event delegation for the dynamic delete submenu
    deleteFootprintSubmenu.addEventListener('click', (event) => {
        if (isBusy) return;
        const target = event.target.closest('.submenu-item');
        if (target && target.dataset.uuid) {
            const uuidToDelete = target.dataset.uuid;
            const title = target.textContent;
            if (confirm(`确定要删除封装 "${title}" 吗？`)) {
                console.log(`准备删除封装: ${title} (UUID: ${uuidToDelete})`);
                injectAndExecute('deleteComponent', [uuidToDelete]);
            }
        }
    });

    // 封装执行 content-script 的逻辑
    async function executeContentScript() {
        isBusy = true;
        try {
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (currentTab) {
                await chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    files: ['logger.js', 'content-script.js'],
                });
            } else {
                console.error("JLC 扩展：未找到当前活动标签页。");
            }
        } catch (error) {
            console.error("JLC 扩展：执行内容脚本失败:", error);
        } finally {
            isBusy = false;
            window.close();
        }
    }

    // 通用的脚本注入函数
    async function injectAndExecute(functionName, args = []) {
        isBusy = true;
        try {
            // 精确匹配编辑器页面，避免注入到API页面等
            const tabs = await chrome.tabs.query({ url: "*://*.lceda.cn/editor*" });
            if (tabs.length > 0) {
                const targetTab = tabs[0]; // 使用找到的第一个匹配页面
                console.log(`JLC 扩展：找到匹配页面 ${targetTab.url}，准备执行 '${functionName}'。`);

                const execute = async () => {
                    console.log(`JLC 扩展：[步骤2] 正在发送 '${functionName}' 执行消息...`);
                    const response = await chrome.tabs.sendMessage(targetTab.id, {
                        type: 'EXECUTE_FUNCTION',
                        functionName: functionName,
                        args: args
                    });
                    console.log("JLC 扩展：[步骤2] 收到内容脚本的响应:", response);
                    if (response && !response.success) {
                        throw response.error;
                    }
                    // 如果成功并且是获取封装的函数，则将结果发送到本地服务器并更新UI
                    if (response && response.success && functionName === 'getAllComponents' && response.data) {
                        // 1. 更新UI，显示删除子菜单
                        updateDeleteSubmenu(response.data);

                        // 2. 将结果发送到本地服务器
                        console.log("JLC 扩展：准备将封装列表发送到本地服务器...");
                        const fetchResponse = await fetch("http://127.0.0.1:1122/jlc_footprint=request.get_json();r=len(jlc_footprint)", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(response.data),
                        });
                        const responseText = await fetchResponse.text();
                        console.log("JLC 扩展：封装列表已成功发送。响应:", responseText);
                    }
                };

                try {
                    // "注入或连接" 模式：先尝试 PING
                    console.log("JLC 扩展：[步骤1] 正在 PING 内容脚本...");
                    const pingResponse = await chrome.tabs.sendMessage(targetTab.id, { type: 'PING' });
                    if (pingResponse?.ack === 'PONG') {
                        console.log("JLC 扩展：[步骤1] PONG 成功，内容脚本已存在。");
                        await execute(); // 直接执行
                    } else {
                        throw new Error("Invalid PING response, forcing re-injection.");
                    }
                } catch (e) {
                    // PING 失败，说明脚本未注入
                    console.warn("JLC 扩展：[步骤1] PING 失败，内容脚本不存在或已失效，开始注入...");
                    await chrome.scripting.executeScript({ target: { tabId: targetTab.id }, files: ['page-functions.js'] });
                    console.log("JLC 扩展：[步骤1] 注入成功。");
                    await execute(); // 注入后执行
                }
            } else {
                console.error("JLC 扩展：[失败] 未能找到任何已打开的 lceda.cn 页面来执行此功能。");
                const allTabs = await chrome.tabs.query({});
                console.log("JLC 扩展：[调试] 当前所有已打开的页面URL:", allTabs.map(t => t.url));
            }
        } catch (error) {
            console.error(`JLC 扩展：执行 '${functionName}' 失败:`, error);
            if (error.message) {
                console.error(`JLC 扩展：[详细错误] ${error.message}`);
            }
        } finally {
            isBusy = false;
            // Don't close the popup to allow viewing logs
        }
    }

    /**
     * 根据获取到的封装列表，动态更新删除子菜单的UI
     * @param {Array} footprints - 封装对象数组
     */
    function updateDeleteSubmenu(footprints) {
        deleteFootprintSubmenu.innerHTML = ''; // 清空旧的列表
        if (footprints && footprints.length > 0) {
            footprints.forEach(fp => {
                const item = document.createElement('div');
                item.className = 'submenu-item';
                item.textContent = fp.title;
                item.dataset.uuid = fp.uuid;
                item.style.padding = '5px';
                item.style.cursor = 'pointer';
                item.title = `UUID: ${fp.uuid}`;
                item.onmouseover = () => item.style.backgroundColor = '#e0e0e0';
                item.onmouseout = () => item.style.backgroundColor = '';
                deleteFootprintSubmenu.appendChild(item);
            });
            deleteFootprintContainer.style.display = 'block'; // 显示整个删除菜单
        } else {
            deleteFootprintContainer.style.display = 'none'; // 如果没有封装，则隐藏
        }
    }

    // 获取 jlc.com cookies 并发送的逻辑
    async function fetchAndPostJlcCookies() {
        isBusy = true;
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
            let filteredCookies = allCookies.filter(cookie => targetCookieNames.includes(cookie.name));

            // 检查 JLC_CUSTOMER_CODE 是否存在，如果不存在，则尝试从页面抓取
            const hasCustomerCodeCookie = filteredCookies.some(c => c.name === 'JLC_CUSTOMER_CODE');
            if (!hasCustomerCodeCookie) {
                console.warn("JLC 扩展：[备用方案] 未找到 JLC_CUSTOMER_CODE cookie，开始尝试从页面 DOM 抓取...");
                
                // 查找一个匹配 jlc.com 的标签页，而不仅仅是当前活动页
                const jlcTabs = await chrome.tabs.query({ url: "*://*.jlc.com/*" });

                if (jlcTabs.length > 0) {
                    const targetTab = jlcTabs[0]; // 使用找到的第一个匹配页面
                    console.log(`JLC 扩展：[备用方案] 找到匹配页面 ${targetTab.url}，准备注入抓取脚本。`);

                    // 将函数定义移到此处，以确保 executeScript 可以正确序列化它
                    function getCustomerCodeFromPage() {
                        const customerCodeElement = document.querySelector('.customer-code');
                        if (customerCodeElement && customerCodeElement.textContent) {
                            const text = customerCodeElement.textContent.trim();
                            const parts = text.split(/\s+/);
                            return parts[parts.length - 1];
                        }
                        return null;
                    }

                    const injectionResults = await chrome.scripting.executeScript({
                        target: { tabId: targetTab.id },
                        func: getCustomerCodeFromPage,
                    });

                    // 从注入结果中获取客户编号
                    const customerCode = injectionResults[0]?.result;
                    if (customerCode) {
                        console.log(`JLC 扩展：[备用方案] 成功从页面抓取到客户编号: ${customerCode}`);
                        // 手动组装一个 cookie 对象
                        const manualCookie = {
                            name: 'JLC_CUSTOMER_CODE',
                            value: customerCode,
                            domain: 'www.jlc.com',
                            path: '/',
                            // 设置一个较长的过期时间，例如10年
                            expirationDate: (Date.now() / 1000) + (10 * 365 * 24 * 60 * 60),
                            hostOnly: true,
                            httpOnly: true,
                            secure: false,
                            session: false,
                            sameSite: 'unspecified',
                        };
                        // 仅在 storeId 存在时添加它，避免普通模式下出错
                        if (options.storeId) {
                            manualCookie.storeId = options.storeId;
                        }
                        filteredCookies.push(manualCookie);
                    } else {
                        console.error("JLC 扩展：[备用方案] 脚本注入成功，但在页面 DOM 中未能找到客户编号元素。");
                    }
                } else {
                    console.error("JLC 扩展：[备用方案] 失败，未能找到任何已打开的 jlc.com 页面。");
                    // 增加详细日志，列出所有已打开的页面URL
                    const allTabs = await chrome.tabs.query({});
                    console.log("JLC 扩展：[调试] 当前所有已打开的页面URL:", allTabs.map(t => t.url));
                }
            }
            
            const cookieData = JSON.stringify(filteredCookies, null, 2);
            console.log("JLC 扩展：获取到 jlc.com 的目标 cookies:", cookieData);

            
            const response = await fetch("http://127.0.0.1:1122/jlc_cookies=request.get_json();r=len(jlc_cookies)", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: cookieData,
            });
            const responseText = await response.text();
            console.log("JLC 扩展：Cookies 已成功发送到本地服务器。响应:", responseText);
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
            isBusy = false;
            window.close(); // 无论成功失败都关闭弹出窗口
        }
    }
});
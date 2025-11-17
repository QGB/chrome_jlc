// 这个文件包含了需要在 lceda.cn 页面上下文中执行的函数

/**
 * 获取所有个人封装
 * @param {string} [uuid] - 可选的用户UUID，如果未提供，会尝试从页面中查找
 */
function getAllComponents(uuid) {
    // 注意：这里的 console.log 是页面原始的或被 logger.js 重写后的 console.log
    console.log("JLC 扩展：开始获取所有封装...");
    // 如果没有提供uuid，尝试从页面中一个可能的地方获取
    const userUUID = uuid || window.USER_INFO?.uuid;
    if (!userUUID) {
        console.error("JLC 扩展：无法确定用户UUID。请提供或确保页面已登录。");
        return;
    }
    const url = `https://lceda.cn/api/components?version=6.5.23&docType=4&uid=${userUUID}&type=3&tag%5B%5D=All`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("JLC 扩展：获取到的所有封装列表:", data);
        })
        .catch(error => {
            console.error("JLC 扩展：获取封装列表失败:", error);
        });
}

/**
 * 删除指定的个人封装
 * @param {string} uuid - 要删除的封装的UUID
 */
function deleteComponent(uuid) {
    console.log(`JLC 扩展：准备删除封装，UUID: ${uuid}`);
    const url = `https://lceda.cn/api/components/${uuid}/delete`;
    const body = new URLSearchParams();
    body.append('uuid', uuid);
    body.append('version', '6.5.23');

    fetch(url, { method: 'POST', body: body })
        .then(response => response.json())
        .then(data => console.log(`JLC 扩展：删除操作完成，响应:`, data))
        .catch(error => console.error(`JLC 扩展：删除封装失败，UUID: ${uuid}`, error));
}

// 接收来自 popup 的消息并执行相应函数
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXECUTE_FUNCTION' && message.functionName) {
        const func = window[message.functionName];
        if (typeof func === 'function') {
            func.apply(window, message.args || []);
        }
    }
});
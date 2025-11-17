// 这个文件包含了需要在 lceda.cn 页面上下文中执行的函数

/**
 * 获取并处理所有个人封装
 */
async function getAllComponents() {
    // 注意：这里的 console.log 是页面原始的或被 logger.js 重写后的 console.log
    console.log("JLC 扩展：[getAllComponents] 开始执行...");

    try {
        // 步骤 1: 获取用户 UUID
        console.log("JLC 扩展：[getAllComponents] 步骤 1: 正在查询 DOM 元素 '.tree-node[node-id]'...");
        const userNode = document.querySelector('.tree-node[node-id]');
        if (!userNode) {
            throw new Error("未能在页面 DOM 中找到用户节点('.tree-node[node-id]')。无法获取用户 UUID。");
        }
        const userUUID = userNode.getAttribute('node-id');
        if (!userUUID) {
            throw new Error("找到了用户节点，但无法获取 'node-id' 属性。");
        }
        console.log(`JLC 扩展：[getAllComponents] 步骤 1: 成功! 获取到用户 UUID: ${userUUID}`);

        // 步骤 2: 发起网络请求
        const url = `https://lceda.cn/api/components?version=6.5.23&docType=4&uid=${userUUID}&type=3&tag%5B%5D=All`;
        console.log(`JLC 扩展：[getAllComponents] 步骤 2: 准备向以下 URL 发起请求: ${url}`);
        const response = await fetch(url);
        console.log(`JLC 扩展：[getAllComponents] 步骤 2: 收到响应，状态码: ${response.status}`);
        if (!response.ok) {
            throw new Error(`网络请求失败，状态码: ${response.status} ${response.statusText}`);
        }

        // 步骤 3: 解析 JSON 数据
        console.log("JLC 扩展：[getAllComponents] 步骤 3: 正在解析 JSON 响应...");
        const data = await response.json();
        console.log("JLC 扩展：[getAllComponents] 步骤 3: JSON 解析成功。");

        // 步骤 4: 处理数据
        console.log("JLC 扩展：[getAllComponents] 步骤 4: 正在处理数据...");
        if (data && data.success && data.result && data.result.lists) {
            console.log(`JLC 扩展：[getAllComponents] 步骤 4: 成功获取到 ${data.result.count} 个封装，开始逐个处理...`);
            data.result.lists.forEach((component, index) => {
                console.log(`  [${index + 1}/${data.result.count}] 封装UUID: ${component.uuid}, 标题: ${component.title}`, component);
            });
            console.log("JLC 扩展：[getAllComponents] ✅ 所有封装处理完毕。");
            return data.result.lists; // 返回获取到的封装列表
        } else {
            throw new Error(`API返回数据格式不正确或请求未成功。接收到的数据: ${JSON.stringify(data)}`);
        }
    } catch (error) {
        console.error("JLC 扩展：[getAllComponents] 执行过程中发生错误:", error);
        throw error; // 将错误向上抛出，以便消息监听器可以捕获并返回给 popup
    }
}

/**
 * 删除指定的个人封装
 * @param {string} uuid - 要删除的封装的UUID
 */
async function deleteComponent(uuid) {
    console.log(`JLC 扩展：[deleteComponent] 开始执行，目标 UUID: ${uuid}`);
    const url = `https://lceda.cn/api/components/${uuid}/delete`;
    const body = new URLSearchParams();
    body.append('uuid', uuid);
    body.append('version', '6.5.23');

    try {
        console.log(`JLC 扩展：[deleteComponent] 正在向 ${url} 发送 POST 请求...`);
        const response = await fetch(url, { method: 'POST', body: body });
        console.log(`JLC 扩展：[deleteComponent] 收到响应，状态码: ${response.status}`);
        const data = await response.json();
        if (data && data.success) {
            console.log(`JLC 扩展：[deleteComponent] ✅ 成功删除封装。API 响应:`, data);
        } else {
            throw new Error(`API 返回失败。响应: ${JSON.stringify(data)}`);
        }
    } catch (error) {
        console.error(`JLC 扩展：[deleteComponent] ❌ 删除封装失败，UUID: ${uuid}`, error);
        throw error;
    }
}

// 接收来自 popup 的消息并执行相应函数
// 使用注入守卫确保监听器只被添加一次
if (typeof window.jlcFunctionListenerInjected === 'undefined') {
    window.jlcFunctionListenerInjected = true;

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'PING') {
            console.log("JLC 扩展：[内容脚本] 收到 PING, 回复 PONG。");
            sendResponse({ ack: 'PONG' });
            return; // PING消息，快速响应
        }

        if (message.type === 'EXECUTE_FUNCTION') {
            (async () => {
                try {
                    const func = window[message.functionName];
                    if (typeof func === 'function') {
                        const resultData = await func.apply(window, message.args || []);
                        sendResponse({ success: true, data: resultData });
                    } else {
                        throw new Error(`Function '${message.functionName}' not found in page-functions.js`);
                    }
                } catch (e) {
                    sendResponse({ success: false, error: { message: e.message, stack: e.stack } });
                }
            })();
            return true; // 异步响应
        }
    });
}
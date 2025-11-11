import './logger.js';
console.log(" chrome_jlc\\background.js start 。。。");
/**
 * 注入并执行内容脚本的核心逻辑。
 * @param {chrome.tabs.Tab} tab - 当前活动的标签页对象。
 */
function triggerClickOnTab(tab) {
  // 确保我们在一个有URL的页面上，而不是一个空的 "chrome://" 页面
  if (tab && tab.id && tab.url && (tab.url.startsWith("http") || tab.url.startsWith("https"))) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id }, // 指定要注入脚本的标签页
      files: ['logger.js', 'content-script.js'], // 先注入 logger，再注入内容脚本
    });
  } else {
    console.log("此扩展无法在当前页面上运行。");
  }
}

/**
 * 监听在 manifest.json 中定义的命令（快捷键）。
 */
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "execute_click") {
    triggerClickOnTab(tab);
  }
});
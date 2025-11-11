// 这个文件中的代码将被注入到目标网页中执行

(function() {
    // 确保脚本不会重复执行
    if (window.jlcAutomationRunning) {
        console.log("JLC 扩展：自动化流程已在运行中，本次触发被忽略。");
        return;
    }
    window.jlcAutomationRunning = true;

    console.log("JLC 扩展：开始执行自动化流程...");

    // 步骤 1: 点击 "打开" 菜单
    const openMenu = document.querySelector('#mm-common-open > div:nth-child(4) > div.menu-text.i18n');
    if (!openMenu) {
        console.error("JLC 扩展：[失败] 未找到'打开'菜单按钮。");
        delete window.jlcAutomationRunning;
        return;
    }
    openMenu.click();
    console.log("JLC 扩展：[成功] 点击了'打开'菜单。");

    // 步骤 2: 点击 "KiCad" 导入选项
    setTimeout(() => {
        const confirmKiCad = document.querySelector('body > div.panel.window.messager-window > div.messager-body.panel-body.panel-body-noborder.window-body > div.messager-button > a:nth-child(1)');
        if (!confirmKiCad) {
            console.error("JLC 扩展：[失败] 未找到'KiCad导入'确认按钮。");
            delete window.jlcAutomationRunning;
            return;
        }
        confirmKiCad.click();
        console.log("JLC 扩展：[成功] 点击了'KiCad导入'确认按钮。");
        console.log("JLC 扩展：[监视] 等待用户选择文件并监视导入弹窗的出现...");

        // 步骤 3: 监视导入弹窗的出现
        const observer = new MutationObserver((mutationsList, obs) => {
            const dialog = document.querySelector('#dlgImport.easyui-dialog');
            if (dialog && dialog.parentElement && dialog.parentElement.style.display === 'block') {
                console.log("JLC 扩展：[监视] 检测到可见的导入弹窗！");
                obs.disconnect(); // 找到后立即停止观察

                // 步骤 4: 在弹窗内执行操作
                setTimeout(() => {
                    const radioImportLib = document.querySelector('#import_fileOp_fileLib');
                    if (radioImportLib) {
                        radioImportLib.click();
                        console.log("JLC 扩展：[操作] 点击了'导入文件并提取库'。");
                    } else {
                        console.error("JLC 扩展：[失败] 未找到'导入文件并提取库'单选框。");
                    }

                    const finalImportBtn = document.querySelector('#dlgImport > div.dialog-button > a:nth-child(1)');
                    if (finalImportBtn) {
                        finalImportBtn.click();
                        console.log("JLC 扩展：[操作] 点击了最终的'导入'按钮。");
                    } else {
                        console.error("JLC 扩展：[失败] 未找到最终的'导入'按钮。");
                    }
                    console.log("JLC 扩展：✅ 自动化流程已结束。");
                    delete window.jlcAutomationRunning;
                }, 500); // 等待弹窗内元素渲染
            }
        });

        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

        // 设置超时，如果用户取消或长时间未操作，则中止
        setTimeout(() => {
            observer.disconnect();
            if (window.jlcAutomationRunning) { // 检查流程是否仍在运行
                console.log("JLC 扩展：[监视] 超时。用户可能已取消文件选择。流程中止。");
                delete window.jlcAutomationRunning;
            }
        }, 20000); // 20秒超时

    }, 500); // 等待确认框出现

})();
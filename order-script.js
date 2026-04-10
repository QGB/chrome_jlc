// 这个文件中的代码将被注入到下单页面中执行

(function() {
    // 确保脚本不会重复执行
    if (window.jlcOrderAutomationRunning) {
        console.log("JLC 扩展：下单自动化流程已在运行中，本次触发被忽略。");
        return;
    }
    window.jlcOrderAutomationRunning = true;

    console.log("JLC 扩展：开始执行下单自动化流程...");
    console.log("JLC 扩展：当前页面URL:", window.location.href);

    // 定义需要自动选择的按钮配置列表
    const buttonConfigs = [
        {
            id: 'isNeedOrderSMT_no',
            description: '不需要SMT',
            fallbackSelector: "input[type='radio'][name='isNeedOrderSMT']",
            fallbackIndex: 1
        },
        {
            id: 'isNeedOrderSteel_no',
            description: '不需要钢网'
        },
        {
            id:'express_yufu_0',
            description: '顺丰电商标快'
        },
        {
            id: 'bingdDelivery_2',
            description: '快递方式2'
        },
        {
            id: 'confirmProductionFile_no',
            description: '确认生产文件'
        },
        {
            id: 'isConfirmStatus_yes',
            description: '确认状态'
        }
    ];

    /**
     * 通用的按钮点击函数
     * @param {Object} config - 按钮配置对象
     * @param {number} stepIndex - 步骤索引
     */
    function clickButton(config, stepIndex) {
        const stepNum = stepIndex + 1;
        console.log(`JLC 扩展：[步骤${stepNum}] 查找ID为'${config.id}'的按钮...`);
        
        const button = document.querySelector(`#${config.id}`);
        if (button) {
            console.log(`JLC 扩展：[步骤${stepNum}] 找到按钮:`, button);
            console.log(`JLC 扩展：[步骤${stepNum}] 按钮当前状态:`, {
                disabled: button.disabled,
                checked: button.checked,
                type: button.type,
                value: button.value
            });
            
            button.click();
            console.log(`JLC 扩展：[成功] 点击了'${config.description}'按钮。`);
            console.log(`JLC 扩展：[步骤${stepNum}] 点击后按钮状态:`, {
                checked: button.checked
            });
        } else {
            console.error(`JLC 扩展：[失败] 未找到'${config.description}'按钮。`);
            
            // 如果有备选方案，尝试执行
            if (config.fallbackSelector && config.fallbackIndex !== undefined) {
                const fallbackButtons = document.querySelectorAll(config.fallbackSelector);
                if (fallbackButtons.length > config.fallbackIndex) {
                    console.log(`JLC 扩展：[备选方案] 找到${config.description}相关按钮:`, fallbackButtons);
                    fallbackButtons[config.fallbackIndex].click();
                    console.log(`JLC 扩展：[备选方案] 点击了第${config.fallbackIndex + 1}个${config.description}按钮。`);
                }
            }
        }
    }

    // 遍历配置列表，依次点击所有按钮
    buttonConfigs.forEach((config, index) => {
        clickButton(config, index);
    });

    // 异步处理优惠券按钮点击
    document.querySelector('#useCollarCoupon > h2 > span.selectCoupon.flex.items-center > div > span').click();
    setTimeout(() => {
        handleCouponButton();
    }, 1000); // 等待1秒让页面响应前面的操作

    /**
     * 处理优惠券按钮点击
     */
    function handleCouponButton() {
        console.log("JLC 扩展：[优惠券] 开始查找优惠券按钮...");
        
        const couponButtonSelector = '#app > div:nth-child(1) > div:nth-child(2) > div:nth-child(30) > div > div.el-dialog__body > div > div.coupon-wrap.flex.flex-wrap > div > div.pd-x-16.pd-y-12 > div > button';
        const couponButton = document.querySelector(couponButtonSelector);
        
        if (couponButton) {
            console.log("JLC 扩展：[优惠券] 找到优惠券按钮:", couponButton);
            console.log("JLC 扩展：[优惠券] 按钮文本:", couponButton.textContent);
            console.log("JLC 扩展：[优惠券] 按钮状态:", {
                disabled: couponButton.disabled,
                visible: couponButton.offsetParent !== null
            });
            
            if (!couponButton.disabled && couponButton.offsetParent !== null) {
                couponButton.click();
                console.log("JLC 扩展：[成功] 点击了'立即使用优惠券'按钮。");
            } else {
                console.log("JLC 扩展：[跳过] 优惠券按钮不可用或不可见。");
            }
        } else {
            console.log("JLC 扩展：[信息] 未找到优惠券按钮，可能没有可用优惠券或弹窗未出现。");
            
            // 尝试更通用的选择器作为备选方案
            const fallbackCouponButtons = document.querySelectorAll('button');
            const couponButtonByText = Array.from(fallbackCouponButtons).find(btn => 
                btn.textContent && btn.textContent.includes('立即使用')
            );
            
            if (couponButtonByText) {
                console.log("JLC 扩展：[备选方案] 通过文本找到优惠券按钮:", couponButtonByText);
                couponButtonByText.click();
                console.log("JLC 扩展：[成功] 通过备选方案点击了优惠券按钮。");
            }
        }
        
        // 完成所有操作
        console.log("JLC 扩展：✅ 下单自动化流程已结束。");
        delete window.jlcOrderAutomationRunning;
    }
})();
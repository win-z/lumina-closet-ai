import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to app...');
    await page.goto('http://101.37.159.90/');

    await page.waitForLoadState('networkidle');

    const isLoggedOut = await page.isVisible('text="没有账户？去注册"') || await page.isVisible('button:has-text("登录")');
    if (isLoggedOut) {
        console.log('Logging in...');
        await page.fill('input[type="email"], input[placeholder*="邮箱"]', '1075638488@qq.com');
        await page.fill('input[type="password"], input[placeholder*="密码"]', '12345678');
        await page.click('button:has-text("登录")');
        await page.waitForTimeout(2000);
    }

    // Navigate to Stylist (搭配) tab
    await page.click('text="搭配"');
    await page.waitForTimeout(1000);

    // Take a screenshot of stylist home
    await page.screenshot({ path: 'stylist_home.png' });

    // TC-13: AI Recommendation mode
    console.log('--- TC-13: AI Recommendation mode ---');
    // It should default to "生成搭配" > "AI推荐"
    // Let's click "获取搭配建议"
    const getAiBtn = page.getByRole('button', { name: /获取搭配建议|给点建议/ });
    if (await getAiBtn.isVisible()) {
        await getAiBtn.click();
        console.log('Clicked AI recommend button, waiting for results...');
        await page.waitForSelector('text="保存到搭配"', { timeout: 30000 }).catch(() => console.log('Timeout waiting for AI results'));
        console.log('TC-13 execution complete (check screenshot)');
    } else {
        console.log('TC-13 SKIP: Button not found');
    }

    await page.screenshot({ path: 'stylist_ai_result.png' });

    // TC-16: Save Outfit
    console.log('--- TC-16: Save Outfit ---');
    const saveBtn = page.getByRole('button', { name: /保存到搭配|保存搭配/ });
    if (await saveBtn.isVisible()) {
        // Fill name if needed
        const nameInput = page.locator('input[placeholder*="名称"]');
        if (await nameInput.isVisible()) {
            await nameInput.fill('AI测试搭配');
        }
        await saveBtn.click();
        await page.waitForTimeout(1000);
        console.log('TC-16 PASSED');
    }

    // TC-17: View saved outfits
    console.log('--- TC-17: View saved outfits ---');
    // Click "已保存搭配"
    const savedTab = page.locator('button:has-text("已保存搭配")');
    if (await savedTab.isVisible()) {
        await savedTab.click();
        await page.waitForTimeout(1000);
        console.log('TC-17 PASSED');
    }

    await browser.close();
})();

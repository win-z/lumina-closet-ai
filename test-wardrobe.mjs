import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to app...');
    await page.goto('http://101.37.159.90/');

    // Wait for network idle or domcontentloaded
    await page.waitForLoadState('networkidle');

    // Check if already logged in (look for avatar or Wardrobe text)
    const isLoggedOut = await page.isVisible('text="没有账户？去注册"') || await page.isVisible('text="登录"');

    if (isLoggedOut) {
        console.log('Logging in...');
        // Assuming the login form is visible
        // Fill email
        await page.fill('input[type="email"], input[placeholder*="邮箱"]', '1075638488@qq.com');
        // Fill password
        await page.fill('input[type="password"], input[placeholder*="密码"]', '12345678');

        // Click Login
        await page.click('button:has-text("登录")');

        // Wait immediately for toast to take a snapshot for the user's fast-disappearing error
        try {
            // The toast might be in a common component, trying to take screenshot of the whole page right after click
            // Wait a tiny bit for render
            await page.waitForTimeout(300);
            await page.screenshot({ path: 'login_feedback.png' });
            console.log('Took screenshot immediately after login click -> login_feedback.png');

            // Wait for navigation or error
            // If there is an error toast, we might catch it
            const hasError = await page.waitForSelector('.toast, .error, text="失败", text="错误"', { timeout: 2000 }).catch(() => null);
            if (hasError) {
                console.log('Error toast found!');
                await page.screenshot({ path: 'login_error.png' });
                console.log('Error screenshot saved as login_error.png');
            }
        } catch (e) {
            console.error(e);
        }
    }

    // Wait a few seconds to see if it logs in
    await page.waitForTimeout(3000);

    // Verify state
    const isWardrobeVisible = await page.isVisible('text="我的衣橱"');
    if (isWardrobeVisible) {
        console.log('Login successful, wardrobe is visible.');

        // TC-12: Empty Wardrobe state
        const isEmpty = await page.isVisible('text="衣橱空空如也"');
        if (isEmpty) {
            console.log('TC-12 PASSED: Empty Wardrobe state visible.');
        } else {
            console.log('TC-12 SKIP: Wardrobe is not empty.');
        }

        // Capture screenshot of wardrobe
        await page.screenshot({ path: 'wardrobe_home.png' });
    } else {
        console.log('Login failed or wardrobe not visible.');
    }

    await browser.close();
})();

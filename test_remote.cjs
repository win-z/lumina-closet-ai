const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions', '--disable-web-security'] });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

    console.log('Navigating to http://101.37.159.90/');
    await page.goto('http://101.37.159.90/', { waitUntil: 'networkidle0', timeout: 30000 });

    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || 'ROOT NOT FOUND');
    console.log('Root HTML length:', rootHtml.length);
    if (rootHtml.length < 50) {
        console.log('Root HTML content:', rootHtml);
    }

    await browser.close();
})();

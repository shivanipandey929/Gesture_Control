import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set guest auth in localStorage
  await page.goto('http://127.0.0.1:5173/auth', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('aerotouch_auth_mode', 'guest');
  });

  // 1. Desktop 1366x768 Light Mode
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('http://127.0.0.1:5173/modes', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({
    path: 'C:/Users/ActSoft/.gemini/antigravity/brain/f9f8c783-c0cd-4cf7-ade2-8118f9e10b16/modes-redesign-1366x768-light.png',
    fullPage: true
  });

  // 2. Desktop 1920x1080 Light Mode
  await page.setViewport({ width: 1920, height: 1080 });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({
    path: 'C:/Users/ActSoft/.gemini/antigravity/brain/f9f8c783-c0cd-4cf7-ade2-8118f9e10b16/modes-redesign-1920x1080-light.png',
    fullPage: true
  });

  // 3. Dark Mode
  const themeToggle = await page.$('button[title*="Dark Theme"], button[title*="Light Theme"], button[aria-label="Toggle theme"]');
  if (themeToggle) {
    await themeToggle.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({
      path: 'C:/Users/ActSoft/.gemini/antigravity/brain/f9f8c783-c0cd-4cf7-ade2-8118f9e10b16/modes-redesign-1366x768-dark.png',
      fullPage: true
    });
    // switch back
    await themeToggle.click();
    await new Promise(r => setTimeout(r, 300));
  }

  // 4. Mobile 390x844
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({
    path: 'C:/Users/ActSoft/.gemini/antigravity/brain/f9f8c783-c0cd-4cf7-ade2-8118f9e10b16/modes-redesign-mobile-390x844.png',
    fullPage: true
  });

  // 5. Test Open Workspace transition (switch back to desktop viewport)
  await page.setViewport({ width: 1366, height: 768 });
  const openButtons = await page.$$('button');
  for (const btn of openButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Open Workspace')) {
      console.log('Clicking Open Workspace...');
      await btn.click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({
        path: 'C:/Users/ActSoft/.gemini/antigravity/brain/f9f8c783-c0cd-4cf7-ade2-8118f9e10b16/modes-workspace-active.png',
        fullPage: true
      });
      break;
    }
  }

  await browser.close();
  console.log('All Modes Hub redesign screenshots captured successfully!');
}

run().catch(console.error);

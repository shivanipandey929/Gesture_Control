import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Laptop 1366x768 Light Mode
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('http://127.0.0.1:5173/auth', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'C:/Users/ActSoft/.gemini/antigravity/brain/f9f8c783-c0cd-4cf7-ade2-8118f9e10b16/auth-new-laptop-1366x768.png' });

  // 2. Desktop 1920x1080 Light Mode
  await page.setViewport({ width: 1920, height: 1080 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'C:/Users/ActSoft/.gemini/antigravity/brain/f9f8c783-c0cd-4cf7-ade2-8118f9e10b16/auth-new-desktop-1920x1080.png' });

  // 3. Dark Mode (click theme toggle)
  const themeToggle = await page.$('button[aria-label="Toggle theme"]');
  if (themeToggle) {
    await themeToggle.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'C:/Users/ActSoft/.gemini/antigravity/brain/f9f8c783-c0cd-4cf7-ade2-8118f9e10b16/auth-new-dark-1920x1080.png' });
  }

  // 4. Mobile 390x844 Light Mode
  if (themeToggle) {
    await themeToggle.click(); // switch back to light
    await new Promise(r => setTimeout(r, 400));
  }
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'C:/Users/ActSoft/.gemini/antigravity/brain/f9f8c783-c0cd-4cf7-ade2-8118f9e10b16/auth-new-mobile-390x844.png' });

  await browser.close();
  console.log('Screenshots captured successfully!');
}

run().catch(console.error);

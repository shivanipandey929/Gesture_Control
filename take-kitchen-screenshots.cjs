const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:/Users/ActSoft/.gemini/antigravity/brain/f9f8c783-c0cd-4cf7-ade2-8118f9e10b16';

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const targets = [
    { name: 'kitchen-1093x540-light', width: 1093, height: 540, theme: 'light', startCooking: false },
    { name: 'kitchen-1093x540-dark', width: 1093, height: 540, theme: 'dark', startCooking: false },
    { name: 'kitchen-1366x657-light', width: 1366, height: 657, theme: 'light', startCooking: true, mult: 2 },
    { name: 'kitchen-1366x657-dark', width: 1366, height: 657, theme: 'dark', startCooking: true, mult: 2 },
    { name: 'kitchen-390x844-light', width: 390, height: 844, theme: 'light', startCooking: true, isMobile: true },
    { name: 'kitchen-390x844-dark', width: 390, height: 844, theme: 'dark', startCooking: true, isMobile: true },
  ];

  for (const t of targets) {
    const page = await browser.newPage();
    await page.setViewport({ width: t.width, height: t.height, isMobile: !!t.isMobile });
    
    // Set localStorage settings for theme and guest auth mode
    await page.evaluateOnNewDocument((theme) => {
      localStorage.setItem('aerotouch_auth_mode', 'guest');
      localStorage.setItem('aerotouch_settings', JSON.stringify({ theme }));
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, t.theme);

    await page.goto('http://localhost:4173/kitchen', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Apply dark/light class on html if needed
    await page.evaluate((theme) => {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, t.theme);

    if (t.startCooking) {
      // Click servings multiplier if specified
      if (t.mult) {
        const multButtons = await page.$$('button');
        for (const btn of multButtons) {
          const txt = await page.evaluate(el => el.textContent, btn);
          if (txt && txt.includes(`${t.mult}x`)) {
            await btn.click();
            break;
          }
        }
      }
      // Click "Start Cooking" button
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const txt = await page.evaluate(el => el.textContent, btn);
        if (txt && (txt.includes('Start Cooking') || txt.includes('खाना बनाना शुरू करें') || txt.includes('स्वयंपाक सुरू करा'))) {
          await btn.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 600));
    }

    const outPath = path.join(artifactDir, `${t.name}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved screenshot: ${outPath}`);
    await page.close();
  }

  await browser.close();
  console.log('All screenshots completed successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

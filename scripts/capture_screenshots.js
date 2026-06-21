/**
 * MamaGreen — Actual Running Application Screenshot Capture
 * Uses puppeteer-core with Microsoft Edge to capture real screenshots
 * from the running localhost application.
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

function findBrowser() {
  for (const p of EDGE_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No Edge or Chrome browser found');
}

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = 'C:\\Users\\joant\\.gemini\\antigravity\\brain\\14780cbc-a459-417a-87cc-73a82a8e4d68';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clickButtonByText(page, text) {
  const btn = await page.evaluateHandle((t) => {
    const buttons = [...document.querySelectorAll('button')];
    return buttons.find(b => b.textContent.includes(t));
  }, text);
  if (btn && btn.asElement()) {
    await btn.asElement().click();
    return true;
  }
  return false;
}

async function main() {
  const execPath = findBrowser();
  console.log(`Using browser: ${execPath}`);
  console.log('Launching headless browser...');
  
  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });

  try {
    const page = await browser.newPage();

    // 1. Capture LOGIN page
    console.log('1) Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    const loginPath = path.join(OUT_DIR, 'screenshot_login_actual.png');
    await page.screenshot({ path: loginPath, fullPage: false });
    console.log(`   ✅ Login screenshot saved`);

    // 2. Quick guest login via direct navigation
    console.log('2) Performing guest login...');
    // Try clicking "Instant Demo Guest Login" button 
    const clicked = await clickButtonByText(page, 'Instant Demo');
    if (clicked) {
      console.log('   Clicked Instant Demo button');
      await sleep(2000);
    }

    // Try "Quick Demo" variant
    if (!clicked) {
      const clicked2 = await clickButtonByText(page, 'Quick Demo');
      if (clicked2) {
        console.log('   Clicked Quick Demo button');
        await sleep(2000);
      }
    }

    // Check if onboarding appeared
    const nameInput = await page.$('input[type="text"]');
    if (nameInput) {
      console.log('   Filling onboarding form...');
      await nameInput.click({ clickCount: 3 });
      await nameInput.type('Green Traveler', { delay: 20 });
      await sleep(500);
      
      // Click through steps
      for (let step = 0; step < 3; step++) {
        const clicked = await clickButtonByText(page, 'Next Step');
        if (clicked) {
          console.log(`   Passed step ${step + 1}`);
          await sleep(1000);
          
          // Fill location on step 3
          if (step === 1) {
            const locInput = await page.$('input[type="text"]');
            if (locInput) {
              await locInput.click({ clickCount: 3 });
              await locInput.type('Bengaluru', { delay: 20 });
              await sleep(500);
            }
          }
        }
      }
      
      // Click Start Journey / Complete
      const started = await clickButtonByText(page, 'Start');
      if (started) console.log('   Clicked Start button');
      await sleep(3000);
    }

    // If still not on dashboard, navigate directly
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    if (!currentUrl.includes('/dashboard')) {
      console.log('   Direct navigating to dashboard...');
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(4000);
    } else {
      await sleep(3000);
    }

    // 3. Capture DASHBOARD page
    console.log('3) Capturing dashboard...');
    await page.waitForSelector('body', { timeout: 10000 });
    await sleep(2000);
    const dashPath = path.join(OUT_DIR, 'screenshot_dashboard_actual.png');
    await page.screenshot({ path: dashPath, fullPage: true });
    console.log(`   ✅ Dashboard screenshot saved`);

    // Also capture just the top viewport
    const dashTopPath = path.join(OUT_DIR, 'screenshot_dashboard_top_actual.png');
    await page.screenshot({ path: dashTopPath, fullPage: false });
    console.log(`   ✅ Dashboard top-viewport screenshot saved`);

    // 4. Navigate to SETTINGS page
    console.log('4) Navigating to settings...');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    const settingsPath = path.join(OUT_DIR, 'screenshot_settings_actual.png');
    await page.screenshot({ path: settingsPath, fullPage: true });
    console.log(`   ✅ Settings screenshot saved`);

    // 5. Navigate to ACHIEVEMENTS page
    console.log('5) Navigating to achievements...');
    await page.goto(`${BASE_URL}/achievements`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    const achievementsPath = path.join(OUT_DIR, 'screenshot_achievements_actual.png');
    await page.screenshot({ path: achievementsPath, fullPage: true });
    console.log(`   ✅ Achievements screenshot saved`);

    console.log('\n🎉 All screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('❌ Screenshot capture failed:', err.message);
  process.exit(1);
});

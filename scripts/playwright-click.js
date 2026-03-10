/**
 * Playwright 自动化脚本：打开指定页面并点击指定按钮
 *
 * 使用方式：
 *   node scripts/playwright-click.js
 *   node scripts/playwright-click.js --url=https://example.com --selector="button#submit"
 *   node scripts/playwright-click.js --url=https://example.com --text="提交"
 *
 * 参数说明：
 *   --url=...        要打开的页面 URL（默认：https://example.com）
 *   --selector=...   要点击元素的 CSS 选择器（如 button#submit, .btn-primary）
 *   --text=...       要点击的按钮文本（与 selector 二选一）
 *   --headless       无头模式运行（不显示浏览器窗口）
 */

const { chromium } = require('playwright');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { url: 'https://example.com', selector: null, text: null, headless: false };
  for (const arg of args) {
    if (arg.startsWith('--url=')) result.url = arg.slice(6);
    else if (arg.startsWith('--selector=')) result.selector = arg.slice(11);
    else if (arg.startsWith('--text=')) result.text = arg.slice(7);
    else if (arg === '--headless') result.headless = true;
  }
  return result;
}

async function main() {
  const { url, selector, text, headless } = parseArgs();

  if (!selector && !text) {
    console.log('请指定 --selector=... 或 --text=... 来选择要点击的按钮');
    console.log('示例: node scripts/playwright-click.js --url=https://example.com --text="More information"');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless,
    slowMo: 50, // 放慢操作便于观察
  });

  try {
    const page = await browser.newPage();
    console.log('正在打开:', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    if (selector) {
      console.log('正在点击选择器:', selector);
      await page.click(selector, { timeout: 5000 });
    } else {
      console.log('正在点击包含文本的按钮:', text);
      await page.click(`text=${text}`, { timeout: 5000 });
    }

    console.log('点击完成');
    await page.waitForTimeout(1000); // 等待 1 秒便于观察
  } catch (err) {
    console.error('执行失败:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();

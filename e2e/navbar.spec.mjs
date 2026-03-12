import { test, expect } from '@playwright/test';

test('NavBar Office button should switch to office tab', async ({ page }) => {
  // 访问页面
  await page.goto('http://localhost:4200');
  await page.waitForTimeout(3000);
  
  // 先点击 "Interaction Stats" tab
  await page.click('button:has-text("Interaction Stats")');
  await page.waitForTimeout(500);
  
  // 验证 Interaction Stats tab 已选中（通过按钮样式）
  const statsButton = await page.locator('button:has-text("Interaction Stats")');
  const statsActive = await statsButton.evaluate(el => el.classList.contains('bg-cyan-900/50'));
  console.log('Stats button active:', statsActive);
  
  // 点击顶部 NavBar 的 Office 按钮
  await page.click('nav button:has-text("🏢 Office")');
  await page.waitForTimeout(500);
  
  // 验证 Main Office tab 按钮是否高亮
  const mainOfficeButton = await page.locator('button:has-text("Main Office")');
  const hasActiveClass = await mainOfficeButton.evaluate(el => el.classList.contains('bg-cyan-900/50'));
  console.log('Main Office button active:', hasActiveClass);
  
  // 验证顶部 NavBar Office 按钮是否高亮（cyan 颜色）
  const navOfficeButton = await page.locator('nav button:has-text("🏢 Office")');
  const navButtonClass = await navOfficeButton.evaluate(el => el.className);
  const navButtonIsActive = navButtonClass.includes('cyan');
  console.log('Nav Office button class:', navButtonClass);
  console.log('Nav Office button is active:', navButtonIsActive);
  
  // 截图
  await page.screenshot({ path: '/tmp/office-click-test.png' });
  console.log('Screenshot saved to /tmp/office-click-test.png');
  
  // 断言：Main Office 应该被选中
  expect(hasActiveClass).toBe(true);
  expect(navButtonIsActive).toBe(true);
});

test('NavBar Tasks button should show alert', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.waitForTimeout(2000);
  
  // 监听 alert 对话框
  let alertMessage = '';
  page.on('dialog', async dialog => {
    alertMessage = dialog.message();
    await dialog.accept();
  });
  
  // 点击 Tasks 按钮
  await page.click('nav button:has-text("📋 Tasks")');
  await page.waitForTimeout(500);
  
  console.log('Alert message:', alertMessage);
  expect(alertMessage).toBe('Tasks 功能尚未实现');
});

const { test, expect } = require('@playwright/test');

test('NavBar Office button should switch to office tab', async ({ page }) => {
  // 访问页面
  await page.goto('http://localhost:4200');
  await page.waitForLoadState('networkidle');
  
  // 等待页面加载完成
  await page.waitForTimeout(2000);
  
  // 先点击 "Interaction Stats" tab，确保我们不在 office tab
  await page.click('button:has-text("Interaction Stats")');
  await page.waitForTimeout(500);
  
  // 验证 StatsCards 组件显示（stats tab 的内容）
  const statsVisible = await page.isVisible('text=All-Time Statistics').catch(() => false);
  console.log('Stats tab visible:', statsVisible);
  
  // 点击顶部 NavBar 的 Office 按钮
  await page.click('nav button:has-text("🏢 Office")');
  await page.waitForTimeout(500);
  
  // 验证是否回到 office tab（IsometricOffice 应该显示）
  const officeVisible = await page.isVisible('text=AI Office Dashboard').catch(() => false);
  console.log('Office tab visible:', officeVisible);
  
  // 验证 Main Office tab 按钮是否高亮
  const mainOfficeButton = await page.locator('button:has-text("Main Office")');
  const hasActiveClass = await mainOfficeButton.evaluate(el => el.classList.contains('bg-cyan-900/50'));
  console.log('Main Office button active:', hasActiveClass);
  
  // 验证顶部 NavBar Office 按钮是否高亮
  const navOfficeButton = await page.locator('nav button:has-text("🏢 Office")');
  const navButtonText = await navOfficeButton.textContent();
  const navButtonClass = await navOfficeButton.evaluate(el => el.className);
  console.log('Nav Office button class:', navButtonClass);
  
  // 截图
  await page.screenshot({ path: '/tmp/office-click-test.png' });
  console.log('Screenshot saved to /tmp/office-click-test.png');
  
  // 断言：Main Office 应该被选中
  expect(hasActiveClass).toBe(true);
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
  expect(alertMessage).toContain('Tasks');
});

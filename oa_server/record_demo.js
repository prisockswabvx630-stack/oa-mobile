const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

// 帮助延时函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log('开始自动化录屏演示脚本...');
  
  const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(executablePath)) {
    console.error('未找到本地 Chrome，请检查路径:', executablePath);
    process.exit(1);
  }

  const browser = await chromium.launch({
    executablePath: executablePath,
    headless: true, // 使用无头模式在后台稳定录制
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const artifactDir = 'C:\\Users\\song\\.gemini\\antigravity\\brain\\af179729-29ba-4cc1-bb73-1e17de898345';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }
  
  const videoTempDir = path.join(__dirname, 'temp_videos');
  if (!fs.existsSync(videoTempDir)) {
    fs.mkdirSync(videoTempDir, { recursive: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: videoTempDir,
      size: { width: 1440, height: 900 }
    }
  });

  const page = await context.newPage();
  
  // 自动接受所有弹出的浏览器确认框（如登出的 confirm）
  page.on('dialog', async dialog => {
    console.log(`[Dialog] 自动接受弹窗: "${dialog.message()}"`);
    await dialog.accept();
  });

  try {
    // -------------------------------------------------------------
    // 1. 登录李明账号
    // -------------------------------------------------------------
    console.log('步骤 1: 正在访问登录页...');
    await page.goto('http://localhost:5173/');
    await page.waitForSelector('.login-card');
    await delay(1000);

    console.log('输入李明的账号信息...');
    await page.fill('input[type="text"].login-input', 'liming');
    await page.fill('input[type="password"].login-input', '123456');

    // 获取验证码并填写
    const captchaText = await page.innerText('.captcha-code-box');
    console.log(`自动提取到的验证码为: ${captchaText}`);
    await page.fill('.captcha-input', captchaText);
    await delay(1000);

    console.log('点击登录...');
    await page.click('.btn-login');
    
    // 等待仪表盘加载完成
    await page.waitForSelector('.stats-grid');
    console.log('登录成功，已进入仪表盘。展示首页状态...');
    await delay(3000); // 停顿展示首页

    // -------------------------------------------------------------
    // 2. 考勤打卡与统计
    // -------------------------------------------------------------
    console.log('步骤 2: 切换到考勤管理模块...');
    await page.click('text=考勤管理');
    await page.waitForSelector('.geofence-status-banner');
    await delay(1500);

    console.log('执行打卡范围调试覆盖 (设为范围内)...');
    await page.click('text=设为范围内');
    await delay(1500);

    console.log('点击上班打卡...');
    await page.click('text=上班签到');
    await page.waitForSelector('.sandbox-response.success');
    console.log('上班签到成功！');
    await delay(2000);

    console.log('查看考勤统计分析看板...');
    await page.click('text=数据汇总与分析');
    await page.waitForSelector('.donut-chart-simulation');
    console.log('正在展示考勤数据统计图表...');
    await delay(3000); // 展示图表

    // -------------------------------------------------------------
    // 3. 李明发起请假审批
    // -------------------------------------------------------------
    console.log('步骤 3: 切换到审批管理并发起请假审批...');
    await page.click('text=审批管理');
    await page.waitForSelector('.stats-grid');
    await delay(1000);

    await page.click('text=发起审批');
    await page.waitForSelector('.modal-content');
    await delay(1000);

    console.log('填写请假单内容...');
    await page.selectOption('select', '请假');
    await page.fill('input[placeholder="请输入审批标题"]', '李明请假申请-感冒休病假');
    await page.fill('textarea[placeholder="请详细描述申请事由..."]', '因感冒发烧需要休病假一天，工作已交接给同组同事，望批准。');
    await delay(1500);

    console.log('提交审批...');
    await page.click('button:has-text("提交申请")');
    await delay(2000); // 等待提交完成并刷新列表
    console.log('请假单已提交完毕，当前状态为待审批。');

    // 退出李明账号
    console.log('正在退出李明的账号...');
    await page.click('.user-profile');
    await delay(500);
    await page.click('text=退出登录');
    await page.waitForSelector('.login-card');
    await delay(1500);

    // -------------------------------------------------------------
    // 4. 部门主管张强审批
    // -------------------------------------------------------------
    console.log('步骤 4: 正在登录张强经理账号进行审批...');
    await page.fill('input[type="text"].login-input', 'zhangqiang');
    await page.fill('input[type="password"].login-input', '123456');
    const captchaText2 = await page.innerText('.captcha-code-box');
    await page.fill('.captcha-input', captchaText2);
    await delay(1000);
    await page.click('.btn-login');

    await page.waitForSelector('.stats-grid');
    console.log('张强经理登录成功。跳转至审批管理...');
    await page.click('text=审批管理');
    await page.waitForSelector('.data-table');
    await delay(1500);

    console.log('点击李明审批单的审批动作...');
    await page.click('tr:has-text("李明请假申请") .action-link:has-text("审批")');
    await page.waitForSelector('.modal-content');
    await delay(1500);

    console.log('填写审批意见并同意...');
    await page.fill('textarea[placeholder="请输入同意或拒绝的原因..."]', '同意，安心养病，早日康复。');
    await delay(1000);
    await page.click('button:has-text("同意")');
    await delay(2000);
    console.log('张强经理审批通过。退出登录...');

    await page.click('.user-profile');
    await delay(500);
    await page.click('text=退出登录');
    await page.waitForSelector('.login-card');
    await delay(1500);

    // -------------------------------------------------------------
    // 5. 李明登录查看记录
    // -------------------------------------------------------------
    console.log('步骤 5: 李明登录查看最终审批结果...');
    await page.fill('input[type="text"].login-input', 'liming');
    await page.fill('input[type="password"].login-input', '123456');
    const captchaText3 = await page.innerText('.captcha-code-box');
    await page.fill('.captcha-input', captchaText3);
    await delay(1000);
    await page.click('.btn-login');

    await page.waitForSelector('.stats-grid');
    await page.click('text=审批管理');
    await page.waitForSelector('.data-table');
    await delay(1500);
    console.log('审批记录显示已更新为已通过状态。展示详情...');
    
    await page.click('tr:has-text("李明请假申请") .action-link:has-text("详情")');
    await page.waitForSelector('.modal-content');
    await delay(3000); // 展示详情
    await page.click('button:has-text("关闭")');
    await delay(1000);

    // -------------------------------------------------------------
    // 6. 展示 Knife4j 接口文档
    // -------------------------------------------------------------
    console.log('步骤 6: 正在跳转至 Knife4j 接口文档页面...');
    await page.goto('http://localhost:3000/doc.html');
    await page.waitForSelector('text=API接口文档', { timeout: 10000 });
    await delay(2000);

    console.log('展开认证模块接口...');
    await page.click('text=认证模块');
    await delay(1500);

    console.log('展开考勤管理接口...');
    await page.click('text=考勤管理');
    await delay(1500);

    console.log('展开审批管理接口...');
    await page.click('text=审批管理');
    await delay(3000); // 停顿展示完整 API 文档目录
    
    console.log('所有演示步骤已顺利模拟录制完成！');
    
  } catch (error) {
    console.error('演示过程中出现错误:', error);
  } finally {
    const rawVideoPath = await page.video().path();
    console.log('临时录像文件保存在:', rawVideoPath);
    
    await context.close();
    await browser.close();
    
    const finalVideoPath = path.join(artifactDir, 'demo_recording.webm');
    if (fs.existsSync(rawVideoPath)) {
      fs.copyFileSync(rawVideoPath, finalVideoPath);
      console.log('录像文件已成功移至最终工件目录:', finalVideoPath);
      
      // 清理临时录像目录
      try {
        fs.unlinkSync(rawVideoPath);
        fs.rmdirSync(videoTempDir);
      } catch (e) {
        // 忽略清理时的占用报错
      }
    } else {
      console.error('录像文件不存在，保存失败。');
    }
  }
}

run();

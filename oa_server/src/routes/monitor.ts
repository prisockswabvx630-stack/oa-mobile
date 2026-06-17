import { Router, Request, Response } from 'express';
import os from 'os';
import { exec } from 'child_process';
import { onlineUsers, kickedUsers } from '../utils/onlineTracker';

const router = Router();

// 辅助函数：计算 CPU 利用率
function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startMeasure = cpuAverage();
    setTimeout(() => {
      const endMeasure = cpuAverage();
      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;
      if (totalDifference === 0) return resolve(0);
      const cpuPercentage = 100 - Math.round((100 * idleDifference) / totalDifference);
      resolve(cpuPercentage);
    }, 200);
  });
}

function cpuAverage() {
  const cpus = os.cpus();
  let idleMs = 0;
  let totalMs = 0;
  cpus.forEach((core) => {
    const times = core.times;
    const total = times.user + times.nice + times.sys + times.idle + times.irq;
    totalMs += total;
    idleMs += times.idle;
  });
  return { idle: idleMs / cpus.length, total: totalMs / cpus.length };
}

// 辅助函数：获取 Windows 磁盘空间
function getDiskSpace(): Promise<{ total: number; free: number; used: number }> {
  return new Promise((resolve) => {
    // 默认兜底数据（512 GB 硬盘，50% 使用率）
    const fallback = { total: 512 * 1024 * 1024 * 1024, free: 256 * 1024 * 1024 * 1024, used: 256 * 1024 * 1024 * 1024 };
    
    // 执行 PowerShell 命令查询 LogicalDisk 状态
    exec('powershell "Get-CimInstance Win32_LogicalDisk | Where-Object {$_.DeviceID -eq \'C:\'} | Select-Object Size, FreeSpace | ConvertTo-Json"', (err, stdout) => {
      if (err) {
        return resolve(fallback);
      }
      try {
        const parsed = JSON.parse(stdout);
        const total = Number(parsed.Size);
        const free = Number(parsed.FreeSpace);
        const used = total - free;
        resolve({ total, free, used });
      } catch (ex) {
        resolve(fallback);
      }
    });
  });
}

// ========== 1. 获取服务器负载监控 (F-MON-SERVER) ==========
router.get('/server', async (req: Request, res: Response) => {
  try {
    const cpuUsage = await getCpuUsage();
    const disk = await getDiskSpace();
    
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = Math.round((usedMem / totalMem) * 100);

    const memoryInfo = {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usage: memoryUsage
    };

    const diskInfo = {
      total: disk.total,
      free: disk.free,
      used: disk.used,
      usage: Math.round((disk.used / disk.total) * 100)
    };

    const processMemory = process.memoryUsage();
    
    res.json({
      code: 200,
      data: {
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0]?.model || 'Unknown CPU',
          usage: cpuUsage
        },
        memory: memoryInfo,
        disk: diskInfo,
        node: {
          heapTotal: processMemory.heapTotal,
          heapUsed: processMemory.heapUsed,
          rss: processMemory.rss
        },
        uptime: os.uptime(),
        platform: os.platform()
      },
      msg: 'success'
    });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ========== 2. 在线用户列表查询 (F-MON-ONLINE) ==========
router.get('/online', async (req: Request, res: Response) => {
  try {
    // 过滤掉超过 30 分钟没有活动的静默用户
    const now = Date.now();
    const activeThreshold = 30 * 60 * 1000;
    const list: any[] = [];

    onlineUsers.forEach((user, userId) => {
      if (now - user.lastActiveTime.getTime() < activeThreshold) {
        list.push(user);
      } else {
        onlineUsers.delete(userId); // 剔除非活跃用户
      }
    });

    // 排序：按最后活动时间倒序
    list.sort((a, b) => b.lastActiveTime.getTime() - a.lastActiveTime.getTime());

    res.json({ code: 200, data: list, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ========== 3. 强退在线用户 (F-MON-ONLINE) ==========
router.post('/online/kick', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ code: 400, msg: '参数有误：缺少 userId' });
    }

    const userIdStr = String(userId);
    kickedUsers.add(userIdStr);
    onlineUsers.delete(userIdStr);

    res.json({ code: 200, msg: '强退用户成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;

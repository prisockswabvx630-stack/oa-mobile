import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const isAdmin = reqUser?.username === 'admin';

    const docs = await prisma.oa_document.findMany({ where: { is_deleted: 0 }, orderBy: { create_time: 'desc' } });
    const uploaderIds = [...new Set(docs.map(d => d.uploader_id))];
    const users = await prisma.sys_user.findMany({ where: { id: { in: uploaderIds } }, select: { id: true, real_name: true, dept_id: true } });
    const userMap = new Map(users.map(u => [u.id, u]));

    // 获取部门信息
    const deptIds = [...new Set(users.filter(u => u.dept_id).map(u => u.dept_id))] as bigint[];
    const departments = await prisma.sys_department.findMany({ where: { id: { in: deptIds } }, select: { id: true, dept_name: true } });
    const deptMap = new Map(departments.map(d => [d.id, d.dept_name]));

    let filteredDocs = docs;
    if (!isAdmin && reqUser?.id) {
      const userId = BigInt(reqUser.id);
      const currentUserRecord = await prisma.sys_user.findUnique({ where: { id: userId }, select: { dept_id: true } });
      const myDeptId = currentUserRecord?.dept_id;
      
      filteredDocs = docs.filter(d => {
        if (d.uploader_id === userId) return true;
        if (d.scope === 'all') return true;
        if (d.scope === 'dept') {
          const uploaderUser = userMap.get(d.uploader_id);
          if (myDeptId && uploaderUser?.dept_id === myDeptId) return true;
          if (myDeptId && d.dept_ids && d.dept_ids.split(',').includes(String(myDeptId))) return true;
        }
        return false;
      });
    }

    const data = filteredDocs.map(d => {
      const uploaderUser = userMap.get(d.uploader_id);
      const deptName = uploaderUser?.dept_id ? deptMap.get(uploaderUser.dept_id) || '未知部门' : '总公司';
      return { ...d, uploader_name: uploaderUser?.real_name || '', dept_name: deptName };
    });
    res.json({ code: 200, data, msg: 'success' });
  } catch (error) {
    console.error('[GET /documents]', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, size, uploader, permission } = req.body;
    let uploaderId: bigint = BigInt(1);
    if (uploader) { const user = await prisma.sys_user.findFirst({ where: { real_name: uploader, is_deleted: 0 } }); if (user) uploaderId = user.id; }
    let sizeBytes = BigInt(0);
    if (size) { const match = String(size).match(/^(\d+)(KB|MB|B)?$/i); if (match) { const val = Number(match[1]); const unit = (match[2] || 'KB').toUpperCase(); if (unit === 'KB') sizeBytes = BigInt(val * 1024); else if (unit === 'MB') sizeBytes = BigInt(val * 1024 * 1024); else sizeBytes = BigInt(val); } }
    const scope = permission === '全员可见' ? 'all' : (permission === '部门可见' ? 'dept' : 'personal');
    const newDoc = await prisma.oa_document.create({
      data: { doc_name: name, doc_type: type ? String(type).toLowerCase() : 'pdf', file_size: sizeBytes, file_url: '/files/' + name, uploader_id: uploaderId, scope }
    });
    res.json({ code: 200, data: newDoc, msg: '新建文档成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).replace(/^DOC0*/i, '');
    await prisma.oa_document.update({ where: { id: BigInt(cleanId) }, data: { is_deleted: 1 } });
    res.json({ code: 200, msg: '删除文档成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id/rename', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;
    const updated = await prisma.oa_document.update({ where: { id: BigInt(String(id).replace(/^DOC0*/i, '')) }, data: { doc_name: newName, update_time: new Date() } });
    res.json({ code: 200, data: updated, msg: '重命名成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id/move', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { folderId } = req.body;
    const updated = await prisma.oa_document.update({ where: { id: BigInt(String(id).replace(/^DOC0*/i, '')) }, data: { folder_id: folderId ? BigInt(folderId) : BigInt(0), update_time: new Date() } });
    res.json({ code: 200, data: updated, msg: '移动成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 更新文档信息（备注、权限）
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).replace(/^DOC0*/i, '');
    const { remark, scope, doc_name } = req.body;
    const updateData: any = { update_time: new Date() };
    if (remark !== undefined) updateData.remark = remark;
    if (scope !== undefined) updateData.scope = scope;
    if (doc_name !== undefined) updateData.doc_name = doc_name;
    const updated = await prisma.oa_document.update({ where: { id: BigInt(cleanId) }, data: updateData });
    res.json({ code: 200, data: updated, msg: '更新成功' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 记录浏览 +1
router.post('/:id/view', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).replace(/^DOC0*/i, '');
    const updated = await prisma.oa_document.update({
      where: { id: BigInt(cleanId) },
      data: { view_count: { increment: 1 }, update_time: new Date() }
    });
    res.json({ code: 200, data: { view_count: updated.view_count }, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 记录下载 +1
router.post('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).replace(/^DOC0*/i, '');
    const updated = await prisma.oa_document.update({
      where: { id: BigInt(cleanId) },
      data: { download_count: { increment: 1 }, update_time: new Date() }
    });
    res.json({ code: 200, data: { download_count: updated.download_count }, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;

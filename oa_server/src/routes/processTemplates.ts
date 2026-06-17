import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function templateWhere(id: any) {
  const idStr = String(id);
  return isNaN(Number(idStr)) ? { template_code: idStr } : { id: BigInt(idStr) };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const templates = await prisma.oa_process_template.findMany({ where: { is_deleted: 0 }, orderBy: { sort: 'asc' } });
    res.json({ code: 200, data: templates, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { template_code, template_name, type, scope, nodes, status, sort } = req.body;
    const dbStatus = status === '启用' ? 1 : 0;
    const template = await prisma.oa_process_template.create({
      data: { template_code: template_code || 'CODE', template_name: template_name || '', type: type || 'leave', scope: scope || '全员', nodes: nodes || '发起,主管', status: dbStatus, sort: sort !== undefined ? Number(sort) : 0 }
    });
    res.json({ code: 200, data: template, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const idStr = String(req.params.id);
    const { template_name, scope, nodes, status, sort } = req.body;
    
    let template = await prisma.oa_process_template.findUnique({
      where: { template_code: idStr }
    });
    
    if (!template && !isNaN(Number(idStr))) {
      template = await prisma.oa_process_template.findUnique({
        where: { id: BigInt(idStr) }
      });
    }
    
    if (!template) {
      return res.status(404).json({ code: 404, error: 'Template not found' });
    }

    const updateData: any = { update_time: new Date() };
    if (template_name !== undefined) updateData.template_name = template_name;
    if (scope !== undefined) updateData.scope = scope;
    if (nodes !== undefined) updateData.nodes = nodes;
    if (status !== undefined) updateData.status = status === '启用' ? 1 : 0;
    if (sort !== undefined) updateData.sort = Number(sort);
    
    const updated = await prisma.oa_process_template.update({
      where: { id: template.id },
      data: updateData
    });
    res.json({ code: 200, data: updated, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const idStr = String(req.params.id);
    
    let template = await prisma.oa_process_template.findUnique({
      where: { template_code: idStr }
    });
    
    if (!template && !isNaN(Number(idStr))) {
      template = await prisma.oa_process_template.findUnique({
        where: { id: BigInt(idStr) }
      });
    }
    
    if (!template) {
      return res.status(404).json({ code: 404, error: 'Template not found' });
    }

    await prisma.oa_process_template.update({
      where: { id: template.id },
      data: { is_deleted: 1 }
    });
    res.json({ code: 200, msg: 'success' });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

export default router;

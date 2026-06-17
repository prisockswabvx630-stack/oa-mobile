const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection('mysql://root:root@localhost:3306/oa_system');
  try {
    console.log('Connected to MySQL. Start seeding mock data...');

    // 1. 清理除管理员以外的其他数据，以及新关联的数据表
    await connection.query('DELETE FROM sys_user_role WHERE user_id > 1');
    await connection.query('DELETE FROM sys_user WHERE id > 1');
    await connection.query('DELETE FROM oa_attendance');
    await connection.query('DELETE FROM oa_project');
    await connection.query('DELETE FROM oa_document');
    await connection.query('DELETE FROM oa_salary');
    await connection.query('DELETE FROM oa_asset');
    await connection.query('DELETE FROM oa_handover');
    await connection.query('DELETE FROM oa_announcement');
    await connection.query('DELETE FROM oa_task');
    await connection.query('DELETE FROM oa_process_template');
    await connection.query('DELETE FROM oa_approval');
    await connection.query('DELETE FROM oa_meeting');
    await connection.query('DELETE FROM oa_schedule');

    console.log('Existing tables cleared.');

    // 2. 插入 sys_user 数据
    const users = [
      [2, '10002', 'zhangqiang', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '张强', 1, '13900139000', 'zhangq@oa.com', 2, 3, '2020-03-15'],
      [3, '10003', 'liming', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '李明', 1, '13900139001', 'lim@oa.com', 2, 4, '2021-06-10'],
      [4, '10004', 'zhaomin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '赵敏', 0, '13900139002', 'zhaom@oa.com', 7, 10, '2019-11-01'],
      [5, '10005', 'qianwei', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '钱伟', 1, '13900139003', 'qianw@oa.com', 6, 9, '2022-01-20'],
      [6, '10006', 'sunfang', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '孙芳', 0, '13900139004', 'sunf@oa.com', 5, 4, '2023-05-10']
    ];
    for (const u of users) {
      await connection.query(
        'INSERT INTO sys_user (id, emp_no, username, password, real_name, gender, mobile, email, dept_id, position_id, status, entry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
        u
      );
    }
    console.log('sys_user seeded.');

    // 3. 插入 sys_user_role 数据
    const userRoles = [
      [2, 3], // 张强: 部门管理者
      [3, 4], // 李明: 普通员工
      [4, 2], // 赵敏: 人事专员
      [5, 3], // 钱伟: 部门管理者
      [6, 4]  // 孙芳: 普通员工
    ];
    for (const ur of userRoles) {
      await connection.query('INSERT INTO sys_user_role (user_id, role_id) VALUES (?, ?)', ur);
    }
    console.log('sys_user_role seeded.');

    // 4. 插入 oa_attendance 数据
    const attendances = [
      [1, '2026-05-21', '08:55:00', '18:05:00', 8.5, 'normal'],
      [1, '2026-05-20', '08:52:00', '18:10:00', 8.6, 'normal'],
      [2, '2026-05-21', '09:02:00', '18:30:00', 8.5, 'normal'],
      [2, '2026-05-20', '08:58:00', '18:05:00', 8.5, 'normal'],
      [3, '2026-05-21', '08:48:00', '18:02:00', 8.5, 'normal'],
      [3, '2026-05-20', '08:50:00', '18:00:00', 8.5, 'normal'],
      [4, '2026-05-21', '09:18:00', '18:00:00', 8.0, 'late'],
      [4, '2026-05-20', '08:55:00', '18:00:00', 8.5, 'normal'],
      [5, '2026-05-21', '08:58:00', '17:50:00', 8.0, 'early'],
      [5, '2026-05-20', '08:59:00', '18:02:00', 8.5, 'normal'],
      [6, '2026-05-21', '09:00:00', '18:00:00', 8.5, 'normal'],
      [6, '2026-05-20', '09:05:00', '18:05:00', 8.5, 'normal']
    ];
    for (const att of attendances) {
      await connection.query(
        'INSERT INTO oa_attendance (user_id, attend_date, clock_in_time, clock_out_time, work_hours, status) VALUES (?, ?, ?, ?, ?, ?)',
        att
      );
    }
    console.log('oa_attendance seeded.');

    // 5. 插入 oa_project 数据
    const projects = [
      ['PROJ_001', '智能OA系统第二期研发', '技术部日常核心开发工作', 2, '2026-01-01', '2026-06-30', 80, 'active', 'high'],
      ['PROJ_002', '企业网盘云存储平台', '实现高可靠分布式文档存储共享服务', 2, '2026-03-10', '2026-08-31', 45, 'active', 'medium'],
      ['PROJ_003', '移动打卡小程序', '开发轻量级手机端打卡功能，支持GPS防作弊', 3, '2026-05-01', '2026-07-15', 15, 'active', 'medium']
    ];
    for (const p of projects) {
      await connection.query(
        'INSERT INTO oa_project (project_no, project_name, description, manager_id, start_date, end_date, progress, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
    }
    console.log('oa_project seeded.');

    // 6. 插入 oa_document 数据
    const documents = [
      ['2026年第一季度财务分析报告.xlsx', 'excel', 1048576, '/uploads/docs/finance_2026_q1.xlsx', 5, 'dept', '2026-04-10 10:00:00'],
      ['公司员工手册及行为规范.pdf', 'pdf', 2548576, '/uploads/docs/employee_handbook.pdf', 4, 'all', '2026-01-05 09:00:00'],
      ['智能OA系统架构方案设计.docx', 'word', 512000, '/uploads/docs/oa_architecture.docx', 2, 'personal', '2026-05-12 14:30:00'],
      ['市场部端午假期活动方案.docx', 'word', 128000, '/uploads/docs/dragon_boat_event.docx', 6, 'dept', '2026-05-20 16:00:00']
    ];
    for (const doc of documents) {
      await connection.query(
        'INSERT INTO oa_document (doc_name, doc_type, file_size, file_url, uploader_id, scope, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [...doc, doc[6]]
      );
    }
    console.log('oa_document seeded.');

    // 7. 插入 oa_salary 数据
    const salaries = [
      [1, '2026-05', 25000, 5000, 8000, 500, 300, 2500, 2000, 3500, 31300, 'paid', '2026-05-15 10:00:00'],
      [2, '2026-05', 18000, 3000, 5000, 400, 200, 1800, 1400, 1800, 21600, 'paid', '2026-05-15 10:00:00'],
      [3, '2026-05', 15000, 2000, 4000, 400, 200, 1500, 1200, 1300, 17600, 'paid', '2026-05-15 10:00:00'],
      [4, '2026-05', 12000, 1500, 3000, 400, 200, 1200, 960, 840, 14100, 'paid', '2026-05-15 10:00:00'],
      [5, '2026-05', 14000, 2000, 3500, 400, 200, 1400, 1120, 1080, 16500, 'paid', '2026-05-15 10:00:00'],
      [6, '2026-05', 10000, 1000, 2000, 400, 200, 1000, 800, 500, 11300, 'paid', '2026-05-15 10:00:00']
    ];
    for (const sal of salaries) {
      await connection.query(
        'INSERT INTO oa_salary (user_id, month, base_salary, position_allowance, performance_bonus, meal_allowance, transport_allowance, social_security, housing_fund, income_tax, net_salary, status, paid_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        sal
      );
    }
    console.log('oa_salary seeded.');

    // 8. 插入 oa_asset 数据
    const assets = [
      ['AST2026001', 'MacBook Pro 16"', 'computer', 'Apple', 'M3 Pro 36GB/1TB', 2, '2026-01-10', 19999.00, 18000.00, 'using', '研发部办公室'],
      ['AST2026002', 'Dell 27" 4K 显示器', 'device', 'Dell', 'U2723QE', 3, '2026-02-15', 3299.00, 3000.00, 'using', '研发部办公室'],
      ['AST2026003', '人体工学网椅', 'furniture', '西昊', 'C300', 4, '2025-08-20', 1599.00, 1200.00, 'using', '人事部办公室'],
      ['AST2026004', 'Lenovo ThinkPad T14', 'computer', 'Lenovo', 'T14 Gen4 i7', null, '2026-03-01', 7499.00, 7000.00, 'idle', '行政仓库'],
      ['AST2026005', 'Epson L3258 打印机', 'device', 'Epson', 'L3258', null, '2025-12-05', 1299.00, 1000.00, 'repair', '行政办公室']
    ];
    for (const a of assets) {
      await connection.query(
        'INSERT INTO oa_asset (asset_no, asset_name, category, brand, model, user_id, purchase_date, original_value, current_value, status, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        a
      );
    }
    console.log('oa_asset seeded.');

    // 9. 插入 oa_handover 数据
    const handovers = [
      ['HND2026001', '技术部公共服务权限转移', 2, 3, '由于张强职务调整，现将技术部拥有的服务器及云账号管理权限移交给李明，包括阿里云控制台及GitLab管理员账号。', 100, 'completed', '2026-05-18 10:00:00', '2026-05-18 10:00:00'],
      ['HND2026002', '财务部第二季度报销审核工作交接', 5, 1, '钱伟近期年假休假，期间所有部门报销审核流程交接由系统管理员代为审批处理。', 30, 'in_progress', null, null]
    ];
    for (const h of handovers) {
      await connection.query(
        'INSERT INTO oa_handover (handover_no, title, initiator_id, receiver_id, content, progress, status, confirm_time, complete_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        h
      );
    }
    console.log('oa_handover seeded.');

    // 10. 插入 oa_announcement 数据
    const announcements = [
      ['关于2026年端午节放假安排的通知', 'notice', 'all', 1, '根据国务院办公厅关于2026年节假日放假安排，我司端午节放假时间为：6月15日至6月17日放假公休，共3天。6月14日（星期日）正常上班。请各部门妥善安排好工作及安全防范工作。', 'published', '2026-05-20 09:00:00'],
      ['关于推行全新《弹性工作制试行方案》的通知', 'policy', 'all', 4, '为了给员工提供更具弹性的工作环境，提升工作效率与员工满意度，自2026年6月1日起试行弹性工作制。核心工作时间为 10:00 - 16:00，每日工作满8小时即可。', 'published', '2026-05-21 10:30:00'],
      ['研发二部周度项目审查会议通告', 'announce', 'dept', 2, '本周五下午 14:00 - 16:00 将在第三会议室举行研发二部周度项目汇报及代码审查会议，请各项目负责人提前准备好PPT及进度表，准时参会。', 'draft', null]
    ];
    for (const ann of announcements) {
      await connection.query(
        'INSERT INTO oa_announcement (title, type, scope, publisher_id, content, status, publish_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ann
      );
    }
    console.log('oa_announcement seeded.');

    // 11. 插入 oa_task 数据
    const tasks = [
      ['TSK2026001', '设计数据库表结构', '设计智能OA办公系统的MySQL表结构并完成脚本编写。', 2, 1, 'high', '2026-05-11', 100, 'completed'],
      ['TSK2026002', '实现用户登录接口', '开发后端登录与鉴权接口，集成JWT/Session。', 3, 1, 'high', '2026-05-12', 30, 'in_progress'],
      ['TSK2026003', '编写API接口文档', '整理所有开发完成的后台API接口，输出Markdown/Swagger文档。', 2, 1, 'medium', '2026-05-13', 10, 'pending'],
      ['TSK2026004', '前端首页UI开发', '使用Vue3 + CSS3实现高颜值的系统后台首页。', 3, 1, 'high', '2026-05-14', 20, 'in_progress']
    ];
    for (const t of tasks) {
      await connection.query(
        'INSERT INTO oa_task (task_no, title, description, assignee_id, creator_id, priority, due_date, progress, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        t
      );
    }
    console.log('oa_task seeded.');

    // 12. 插入 oa_process_template 数据
    const templates = [
      [1, 'LEAVE', '请假审批流程', 'leave', '全员', '发起,主管,总监,HR', 1, 1],
      [2, 'EXPENSE', '报销审批流程', 'expense', '全员', '发起,主管,财务,出纳', 1, 2],
      [3, 'TRAVEL', '出差审批流程', 'travel', '全员', '发起,主管,总监,行政', 1, 3],
      [4, 'OVERTIME', '加班审批流程', 'overtime', '全员', '发起,主管', 1, 4],
      [5, 'PURCHASE', '采购审批流程', 'purchase', '全员', '发起,主管,财务,总经理', 1, 5]
    ];
    for (const t of templates) {
      await connection.query(
        'INSERT INTO oa_process_template (id, template_code, template_name, type, scope, nodes, status, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        t
      );
    }
    console.log('oa_process_template seeded.');

    // 13. 插入 oa_approval 数据
    const approvals = [
      [1, 'AP20260511001', '请假', '年假3天', 3, 2, '请假申请：2026-05-20 至 2026-05-22 年假3天。', 'pending'],
      [2, 'AP20260511002', '报销', '差旅报销 ¥3,580', 4, 7, '差旅报销：广州出差客户拜访差旅费用。', 'pending'],
      [3, 'AP20260510001', '出差', '上海出差5天', 5, 6, '出差申请：上海核心客户现场支持与交流。', 'pending'],
      [4, 'AP20260510002', '加班', '加班3小时', 3, 2, '系统紧急更新发布上线，加班3小时。', 'approved'],
      [5, 'AP20260510003', '采购', '电脑采购', 6, 5, '行政部采购备用办公笔记本电脑。', 'rejected']
    ];
    for (const ap of approvals) {
      await connection.query(
        'INSERT INTO oa_approval (id, approval_no, type, title, applicant_id, dept_id, content, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ap
      );
    }
    console.log('oa_approval seeded.');

    // 14. 插入 oa_meeting 数据
    const meetings = [
      [1, 'MT20260511001', '项目周例会', 2, '会议室A', '2026-05-11 10:00:00', '2026-05-11 11:30:00', '8', 'ongoing'],
      [2, 'MT20260511002', '需求评审会', 3, '会议室B', '2026-05-11 14:00:00', '2026-05-11 15:00:00', '3', 'upcoming'],
      [3, 'MT20260511003', '跨部门协调会', 5, '线上', '2026-05-11 16:00:00', '2026-05-11 16:30:00', '5', 'upcoming']
    ];
    for (const m of meetings) {
      await connection.query(
        'INSERT INTO oa_meeting (id, meeting_no, title, organizer_id, room_name, start_time, end_time, attendees, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        m
      );
    }
    console.log('oa_meeting seeded.');

    // 15. 插入 oa_schedule 数据
    const schedules = [
      [1, '团队晨会', '项目组每日晨会', 1, '2026-05-12 09:00:00', '2026-05-12 09:15:00', '会议室A', 'purple', null],
      [2, '项目周例会', '项目周度进度汇报与计划调整', 1, '2026-05-12 10:00:00', '2026-05-12 11:30:00', '会议室A', 'yellow', '8'],
      [3, '需求评审会', '二期核心流程设计需求评审', 1, '2026-05-12 14:00:00', '2026-05-12 15:00:00', '会议室B', 'green', '3'],
      [4, '跟进核心客户演示', '给核心客户演示新版OA系统原型', 1, '2026-05-13 15:30:00', '2026-05-13 16:15:00', '线上直播间', 'yellow', null],
      [5, '跨部门协作会议', '讨论财务与HR模块的数据对接方式', 1, '2026-05-15 11:00:00', '2026-05-15 12:00:00', '线上会议室', 'purple', '5'],
      [6, '日常安全隐患检查', '研发大楼日常消防与安全检查工作', 1, '2026-05-15 16:00:00', '2026-05-15 16:30:00', '研发大楼', 'green', null]
    ];
    for (const s of schedules) {
      await connection.query(
        'INSERT INTO oa_schedule (id, title, description, user_id, start_time, end_time, location, type, attendees) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        s
      );
    }
    console.log('oa_schedule seeded.');

    console.log('Database seeding successfully finished!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await connection.end();
  }
}

main();

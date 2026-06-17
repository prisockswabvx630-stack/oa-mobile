export interface LeaveTemplateData {
  empName: string
  empId: string
  dept: string
  position: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason: string
  applyDate?: string
  companyName?: string
}

const pageStyle = `
  font-family: SimSun, "宋体", "Times New Roman", serif;
  color: #000;
  line-height: 1.8;
  font-size: 14px;
  width: 210mm;
  min-height: 297mm;
  padding: 25mm 30mm;
  box-sizing: border-box;
  background: white;
`

const titleStyle = `
  font-family: SimHei, "黑体", "Microsoft YaHei", sans-serif;
  text-align: center;
  font-size: 26px;
  font-weight: bold;
  letter-spacing: 6px;
  margin: 0 0 30px 0;
`

const leaveTypeDetails: Record<string, { desc: string; legal: string }> = {
  '事假': {
    desc: '因个人事务需要请假处理。',
    legal: '根据公司规章制度，事假期间不发放工资。'
  },
  '病假': {
    desc: '因身体不适/患病需要休息治疗。',
    legal: '根据《企业职工患病或非因工负伤医疗期规定》，员工患病或非因工负伤，需要停止工作医疗时，根据本人实际参加工作年限和在本单位工作年限，给予三个月到二十四个月的医疗期。病假工资不低于当地最低工资标准的80%。'
  },
  '年假': {
    desc: '根据《职工带薪年休假条例》申请年休假。',
    legal: '职工累计工作已满1年不满10年的，年休假5天；已满10年不满20年的，年休假10天；已满20年的，年休假15天。年休假期间享受与正常工作期间相同的工资收入。'
  },
  '婚假': {
    desc: '因结婚需要请假。',
    legal: '根据《婚姻法》及地方计划生育条例，依法办理结婚登记的夫妻，享受婚假。婚假期间工资照发。'
  },
  '产假': {
    desc: '因生育需要休假。',
    legal: '根据《女职工劳动保护特别规定》，女职工生育享受98天产假，其中产前可以休假15天；难产的，增加产假15天；生育多胞胎的，每多生育1个婴儿，增加产假15天。各地另有奖励假的，按当地规定执行。产假期间享受生育津贴。'
  },
  '陪产假': {
    desc: '因配偶生育需要陪护。',
    legal: '根据各地计划生育条例，男方可享受陪产假（护理假）。陪产假期间工资照发。具体天数按当地规定执行。'
  },
  '丧假': {
    desc: '因直系亲属去世需要料理后事。',
    legal: '根据《关于国营企业职工请婚丧假和路程假问题的通知》，职工的直系亲属（父母、配偶和子女）死亡时，可以根据具体情况，由本单位行政领导批准，酌情给予一至三天的丧假。丧假期间工资照发。'
  },
  '调休': {
    desc: '因前期加班积累的调休时间，申请调休。',
    legal: '根据《劳动法》第四十四条，休息日安排劳动者工作又不能安排补休的，支付不低于工资的百分之二百的工资报酬。调休期间工资照发。'
  }
}

export function generateLeaveHTML(data: LeaveTemplateData): string {
  const company = data.companyName || 'XX科技有限公司'
  const today = data.applyDate || new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  const typeInfo = leaveTypeDetails[data.leaveType] || { desc: '因个人原因需要请假。', legal: '' }

  return `<div style="${pageStyle}">
<h1 style="${titleStyle}">请假申请单</h1>

<p style="text-align:center; color:#666; font-size:13px; margin-bottom:30px;">
  申请编号：QJ-${Date.now().toString().slice(-8)}
</p>

<table style="width:100%; border-collapse:collapse; margin-bottom:24px; font-size:14px;">
  <tr>
    <td style="padding:10px 12px; border:1px solid #333; background:#f5f5f5; width:120px; font-weight:bold;">申请人</td>
    <td style="padding:10px 12px; border:1px solid #333;">${data.empName}</td>
    <td style="padding:10px 12px; border:1px solid #333; background:#f5f5f5; width:120px; font-weight:bold;">工号</td>
    <td style="padding:10px 12px; border:1px solid #333;">${data.empId || '—'}</td>
  </tr>
  <tr>
    <td style="padding:10px 12px; border:1px solid #333; background:#f5f5f5; font-weight:bold;">部门</td>
    <td style="padding:10px 12px; border:1px solid #333;">${data.dept || '—'}</td>
    <td style="padding:10px 12px; border:1px solid #333; background:#f5f5f5; font-weight:bold;">职位</td>
    <td style="padding:10px 12px; border:1px solid #333;">${data.position || '—'}</td>
  </tr>
  <tr>
    <td style="padding:10px 12px; border:1px solid #333; background:#f5f5f5; font-weight:bold;">请假类型</td>
    <td style="padding:10px 12px; border:1px solid #333;" colspan="3">
      <strong style="color:#4f46e5;">${data.leaveType}</strong>
    </td>
  </tr>
  <tr>
    <td style="padding:10px 12px; border:1px solid #333; background:#f5f5f5; font-weight:bold;">请假时间</td>
    <td style="padding:10px 12px; border:1px solid #333;" colspan="3">
      自 <strong>${data.startDate}</strong> 起 至 <strong>${data.endDate}</strong> 止
    </td>
  </tr>
  <tr>
    <td style="padding:10px 12px; border:1px solid #333; background:#f5f5f5; font-weight:bold;">请假天数</td>
    <td style="padding:10px 12px; border:1px solid #333;" colspan="3">
      <strong style="color:#dc2626; font-size:16px;">${data.days}</strong> 天
    </td>
  </tr>
  <tr>
    <td style="padding:10px 12px; border:1px solid #333; background:#f5f5f5; font-weight:bold;">申请日期</td>
    <td style="padding:10px 12px; border:1px solid #333;" colspan="3">${today}</td>
  </tr>
</table>

<h3 style="font-family: SimHei, '黑体', sans-serif; font-size: 15px; font-weight: bold; margin: 20px 0 8px 0;">请假事由</h3>
<p style="padding:12px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:4px; min-height:40px;">
  ${typeInfo.desc}${data.reason ? '<br/>具体原因：' + data.reason : ''}
</p>

${typeInfo.legal ? `
<h3 style="font-family: SimHei, '黑体', sans-serif; font-size: 15px; font-weight: bold; margin: 20px 0 8px 0;">法律依据</h3>
<p style="padding:12px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:4px; font-size:13px; color:#1e40af;">
  ${typeInfo.legal}
</p>
` : ''}

<h3 style="font-family: SimHei, '黑体', sans-serif; font-size: 15px; font-weight: bold; margin: 20px 0 8px 0;">审批流程</h3>
<div style="display:flex; align-items:center; gap:8px; padding:12px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:4px;">
  <span style="padding:4px 12px; background:#4f46e5; color:white; border-radius:4px; font-size:13px;">发起</span>
  <span style="color:#9ca3af;">→</span>
  <span style="padding:4px 12px; background:#eff6ff; color:#3b82f6; border:1px solid #bfdbfe; border-radius:4px; font-size:13px;">直属主管审批</span>
  <span style="color:#9ca3af;">→</span>
  <span style="padding:4px 12px; background:#eff6ff; color:#3b82f6; border:1px solid #bfdbfe; border-radius:4px; font-size:13px;">人事部备案</span>
  <span style="color:#9ca3af;">→</span>
  <span style="padding:4px 12px; background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; border-radius:4px; font-size:13px;">归档</span>
</div>

<br/><br/>

<div style="display:flex; justify-content:space-between; margin-top:40px;">
  <div style="width:30%;">
    <p><strong>申请人签字：</strong></p>
    <br/><br/>
    <p style="margin-top:20px;">${data.empName}</p>
    <br/>
    <p>日期：____年__月__日</p>
  </div>
  <div style="width:30%;">
    <p><strong>直属主管：</strong></p>
    <br/><br/>
    <p>签字：_______________</p>
    <br/>
    <p>日期：____年__月__日</p>
  </div>
  <div style="width:30%;">
    <p><strong>人事部：</strong></p>
    <br/><br/>
    <p>签字：_______________</p>
    <br/>
    <p>日期：____年__月__日</p>
  </div>
</div>

<div style="margin-top:40px; padding-top:16px; border-top:1px dashed #ccc; font-size:12px; color:#9ca3af;">
  <p>备注：本请假申请单经审批通过后生效，请假期间请保持通讯畅通。如有紧急工作事项，请提前做好交接。</p>
  <p>生成时间：${new Date().toLocaleString('zh-CN')}</p>
</div>
</div>`
}

export interface ContractTemplateData {
  empName: string
  empId: string
  gender: string
  dept: string
  position: string
  joinDate: string
  contractEndDate: string
  salary: string
  companyName?: string
  // 员工个人信息
  idCard?: string
  address?: string
  currentAddress?: string
  phone?: string
  school?: string
  major?: string
  // 公司信息
  companyLegalRep?: string
  companyCreditCode?: string
  companyAddress?: string
  companyPhone?: string
  workLocation?: string
  payDay?: string
  // 合同信息
  probationEndDate?: string
  probationMonths?: number
}

const baseStyle = `
  font-family: SimSun, "宋体", "Times New Roman", serif;
  color: #000;
  line-height: 1.8;
  font-size: 14px;
`

const titleStyle = `
  font-family: SimHei, "黑体", "Microsoft YaHei", sans-serif;
  text-align: center;
  font-size: 26px;
  font-weight: bold;
  letter-spacing: 6px;
  margin: 0 0 30px 0;
`

const subtitleStyle = `
  font-family: SimHei, "黑体", sans-serif;
  font-size: 15px;
  font-weight: bold;
  margin: 20px 0 8px 0;
`

const pageStyle = `
  width: 210mm;
  min-height: 297mm;
  padding: 25mm 30mm;
  box-sizing: border-box;
  background: white;
`

export function generateLaborContractHTML(data: ContractTemplateData): string {
  const company = data.companyName || '本公司'
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  const genderText = data.gender === '男' ? '男' : data.gender === '女' ? '女' : '___'
  const salaryDisplay = data.salary && data.salary.includes('元') ? data.salary : (data.salary || '面议')
  const probationEnd = data.probationEndDate || '待定'
  const probationMonths = data.probationMonths || 3

  return `<div style="${pageStyle}">
<h1 style="${titleStyle}">劳动合同</h1>

<p style="text-align:center; color:#666; font-size:13px; margin-bottom:30px;">
  合同编号：HT-${Date.now().toString().slice(-8)}
</p>

<p>甲方（用人单位）：<strong>${company}</strong></p>
<p>法定代表人/负责人：<strong>${data.companyLegalRep || '_______________'}</strong></p>
<p>统一社会信用代码：<strong>${data.companyCreditCode || '_______________'}</strong></p>
<p>地址：<strong>${data.companyAddress || '_______________'}</strong></p>
<br/>
<p>乙方（劳动者）：<strong>${data.empName}</strong></p>
<p>性别：${genderText}　　身份证号：<strong>${data.idCard || '_______________'}</strong></p>
<p>户籍地址：<strong>${data.address || '_______________'}</strong></p>
<p>现居住地址：<strong>${data.currentAddress || '_______________'}</strong></p>
<p>联系电话：<strong>${data.phone || '_______________'}</strong></p>
<br/>
<p>根据《中华人民共和国劳动合同法》及相关法律法规，甲乙双方在平等自愿、协商一致的基础上，签订本劳动合同，共同遵守本合同所列条款。</p>

<h3 style="${subtitleStyle}">第一条　合同期限</h3>
<p>（一）本合同为<strong>固定期限劳动合同</strong>。</p>
<p>合同期限自 <strong>${data.joinDate}</strong> 起至 <strong>${data.contractEndDate}</strong> 止。</p>
<p>（二）试用期自 <strong>${data.joinDate}</strong> 起至 <strong>${probationEnd}</strong> 止，共计 <strong>${probationMonths}</strong> 个月。</p>

<h3 style="${subtitleStyle}">第二条　工作内容和工作地点</h3>
<p>（一）乙方同意在甲方 <strong>${data.dept || '___'}</strong> 部门，担任 <strong>${data.position || '___'}</strong> 岗位（工种）工作。</p>
<p>（二）乙方的工作地点为：<strong>${data.workLocation || '_______________'}</strong>。</p>
<p>（三）甲方根据工作需要及乙方的能力和表现，可以合理调整乙方的工作岗位和工作地点。</p>

<h3 style="${subtitleStyle}">第三条　工作时间和休息休假</h3>
<p>（一）甲方实行每日工作8小时、每周工作40小时的标准工时制度。</p>
<p>（二）甲方因生产经营需要，经与工会和乙方协商后可以延长工作时间，一般每日不得超过一小时；因特殊原因需要延长工作时间的，在保障乙方身体健康的条件下延长工作时间每日不得超过三小时，每月不得超过三十六小时。</p>
<p>（三）乙方依法享有法定节假日、年休假、婚假、产假等假期。</p>

<h3 style="${subtitleStyle}">第四条　劳动报酬</h3>
<p>（一）甲方每月 <strong>${data.payDay || '15'}</strong> 日前以货币形式支付乙方工资，月工资为人民币 <strong>${salaryDisplay}</strong>。</p>
<p>（二）试用期工资为人民币 <strong>${data.salary ? Math.round(parseInt(data.salary) * 0.8) + '元' : '面议'}</strong>，不低于本单位相同岗位最低档工资的百分之八十或者不得低于劳动合同约定工资的百分之八十，并不得低于用人单位所在地的最低工资标准。</p>
<p>（三）甲方根据生产经营状况和乙方工作表现，可以合理调整乙方工资。</p>

<h3 style="${subtitleStyle}">第五条　社会保险和福利待遇</h3>
<p>（一）甲方按照国家和地方有关规定为乙方缴纳养老保险、医疗保险、失业保险、工伤保险和生育保险等社会保险费用。</p>
<p>（二）乙方个人应当缴纳的社会保险费用，由甲方从乙方工资中代扣代缴。</p>
<p>（三）甲方为乙方缴纳住房公积金，缴存比例按国家和地方有关规定执行。</p>
<p>（四）乙方患病或非因工负伤的医疗期及医疗待遇按照国家和地方有关规定执行。</p>

<h3 style="${subtitleStyle}">第六条　劳动保护和劳动条件</h3>
<p>（一）甲方为乙方提供符合国家规定的劳动安全卫生条件和必要的劳动防护用品。</p>
<p>（二）甲方对乙方进行劳动安全卫生教育和培训。</p>
<p>（三）乙方从事有职业危害作业的，甲方应当按规定组织上岗前、在岗期间和离岗时的职业健康检查。</p>

<h3 style="${subtitleStyle}">第七条　合同的变更、解除和终止</h3>
<p>（一）经甲乙双方协商一致，可以变更本合同的内容。</p>
<p>（二）甲乙双方解除或终止劳动合同，应当按照《劳动合同法》的有关规定执行。</p>
<p>（三）本合同期满或者双方约定的合同终止条件出现，本合同即行终止。双方同意续签的，应在合同期满前三十日内协商续签事宜。</p>

<h3 style="${subtitleStyle}">第八条　违约责任</h3>
<p>（一）甲乙双方任何一方违反本合同约定，给对方造成经济损失的，应当依法承担赔偿责任。</p>
<p>（二）乙方违反本合同约定解除劳动合同或违反保密义务、竞业限制约定的，应当按照约定向甲方支付违约金。</p>

<h3 style="${subtitleStyle}">第九条　劳动争议处理</h3>
<p>因履行本合同发生的劳动争议，甲乙双方应当协商解决；协商不成的，可以向本单位劳动争议调解委员会申请调解；调解不成的，可以向劳动争议仲裁委员会申请仲裁。对仲裁裁决不服的，可以依法向人民法院提起诉讼。</p>

<h3 style="${subtitleStyle}">第十条　其他约定事项</h3>
<p>（一）乙方确认入职时已如实告知甲方与劳动合同直接相关的基本情况，如有隐瞒或提供虚假信息的，甲方有权依法解除本合同。</p>
<p>（二）本合同未尽事宜，按照国家和地方有关规定执行。</p>
<p>（三）本合同一式两份，甲乙双方各执一份，具有同等法律效力。</p>
<p>（四）本合同自双方签字（盖章）之日起生效。</p>

<br/><br/>
<table style="width:100%; margin-top:60px; border-collapse:collapse;">
  <tr>
    <td style="width:50%; vertical-align:top; padding-right:20px;">
      <p style="font-weight:bold; margin-bottom:30px;">甲方（盖章）：</p>
      <p style="margin-top:60px;">法定代表人/授权代表（签字）：</p>
      <p style="margin-top:40px;">日期：${today}</p>
    </td>
    <td style="width:50%; vertical-align:top; padding-left:20px;">
      <p style="font-weight:bold; margin-bottom:30px;">乙方（签字）：</p>
      <p style="margin-top:60px;">${data.empName}</p>
      <p style="margin-top:40px;">日期：${today}</p>
    </td>
  </tr>
</table>
</div>`
}

export function generateInternshipAgreementHTML(data: ContractTemplateData): string {
  const company = data.companyName || '本公司'
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  const genderText = data.gender === '男' ? '男' : data.gender === '女' ? '女' : '___'
  const salaryDisplay = data.salary && data.salary.includes('元') ? data.salary : (data.salary || '面议')
  // 计算实习月数
  const start = data.joinDate ? new Date(data.joinDate) : null
  const end = data.contractEndDate ? new Date(data.contractEndDate) : null
  const months = start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000))) : 0

  return `<div style="${pageStyle}">
<h1 style="${titleStyle}">实习协议</h1>

<p style="text-align:center; color:#666; font-size:13px; margin-bottom:30px;">
  协议编号：SX-${Date.now().toString().slice(-8)}
</p>

<p>甲方（实习单位）：<strong>${company}</strong></p>
<p>法定代表人/负责人：<strong>${data.companyLegalRep || '_______________'}</strong></p>
<p>地址：<strong>${data.companyAddress || '_______________'}</strong></p>
<p>联系电话：<strong>${data.companyPhone || '_______________'}</strong></p>
<br/>
<p>乙方（实习生）：<strong>${data.empName}</strong></p>
<p>性别：${genderText}　　身份证号：<strong>${data.idCard || '_______________'}</strong></p>
<p>学校：<strong>${data.school || '_______________'}</strong>　　专业：<strong>${data.major || '_______________'}</strong></p>
<p>联系电话：<strong>${data.phone || '_______________'}</strong></p>
<br/>
<p>为明确甲乙双方在实习期间的权利和义务，根据《中华人民共和国民法典》及相关法律法规，经双方协商一致，签订本实习协议。</p>

<h3 style="${subtitleStyle}">第一条　实习期限</h3>
<p>实习期限自 <strong>${data.joinDate}</strong> 起至 <strong>${data.contractEndDate}</strong> 止。</p>
<p>实习期共计 <strong>${months}</strong> 个月。实习期届满，本协议自动终止。</p>

<h3 style="${subtitleStyle}">第二条　实习内容与岗位</h3>
<p>（一）甲方安排乙方在 <strong>${data.dept || '___'}</strong> 部门，从事 <strong>${data.position || '___'}</strong> 岗位的实习工作。</p>
<p>（二）甲方根据实际情况和乙方的专业特长，可以合理调整实习内容和岗位。</p>
<p>（三）甲方应为乙方提供必要的实习条件和指导。</p>

<h3 style="${subtitleStyle}">第三条　实习时间</h3>
<p>（一）乙方每周实习时间不超过 40 小时，具体工作时间由甲方安排。</p>
<p>（二）甲方不得安排乙方从事夜间工作或加班。</p>
<p>（三）乙方享有国家法定节假日休息的权利。</p>

<h3 style="${subtitleStyle}">第四条　实习补贴</h3>
<p>（一）甲方每月向乙方支付实习补贴人民币 <strong>${salaryDisplay}</strong>。</p>
<p>（二）实习补贴于每月 <strong>${data.payDay || '15'}</strong> 日发放，通过银行转账方式支付。</p>
<p>（三）实习补贴为税前金额，个人所得税由乙方自行承担。</p>

<h3 style="${subtitleStyle}">第五条　双方权利义务</h3>
<p><strong>甲方权利义务：</strong></p>
<p>（一）为乙方提供安全、卫生的实习环境和必要的劳动保护用品。</p>
<p>（二）安排专人对乙方进行指导和管理。</p>
<p>（三）对乙方的实习表现进行考核和评价。</p>
<p>（四）为乙方购买实习期间的人身意外伤害保险。</p>
<p><strong>乙方权利义务：</strong></p>
<p>（五）遵守甲方的规章制度和实习纪律。</p>
<p>（六）服从甲方的工作安排和管理，认真完成实习任务。</p>
<p>（七）保守甲方的商业秘密和知识产权。</p>
<p>（八）实习期间注意人身安全，遵守安全操作规程。</p>

<h3 style="${subtitleStyle}">第六条　保密条款</h3>
<p>（一）乙方在实习期间知悉的甲方商业秘密、技术秘密及其他保密信息，负有保密义务。</p>
<p>（二）未经甲方书面同意，乙方不得以任何方式向第三方披露、传播或使用上述保密信息。</p>
<p>（三）本保密义务在实习协议终止后仍然有效。</p>

<h3 style="${subtitleStyle}">第七条　协议的解除</h3>
<p>（一）经甲乙双方协商一致，可以解除本协议。</p>
<p>（二）乙方因个人原因需要提前解除协议的，应提前 7 日书面通知甲方。</p>
<p>（三）甲方因乙方严重违反规章制度或不能胜任实习工作的，可以解除本协议。</p>
<p>（四）因不可抗力致使本协议无法继续履行的，本协议自动解除。</p>

<h3 style="${subtitleStyle}">第八条　争议解决</h3>
<p>因履行本协议发生的争议，双方应友好协商解决；协商不成的，任何一方均可向甲方所在地人民法院提起诉讼。</p>

<br/><br/>
<div style="display:flex; justify-content:space-between; margin-top:40px;">
<br/><br/>
<table style="width:100%; margin-top:60px; border-collapse:collapse;">
  <tr>
    <td style="width:50%; vertical-align:top; padding-right:20px;">
      <p style="font-weight:bold; margin-bottom:30px;">甲方（盖章）：</p>
      <p style="margin-top:60px;">代表人（签字）：</p>
      <p style="margin-top:40px;">日期：${today}</p>
    </td>
    <td style="width:50%; vertical-align:top; padding-left:20px;">
      <p style="font-weight:bold; margin-bottom:30px;">乙方（签字）：</p>
      <p style="margin-top:60px;">${data.empName}</p>
      <p style="margin-top:40px;">日期：${today}</p>
    </td>
  </tr>
</table>
</div>`
}

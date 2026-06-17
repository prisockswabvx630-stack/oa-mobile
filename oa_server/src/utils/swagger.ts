export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: '智能OA系统 API接口文档',
    version: '1.0.0',
    description: '智能OA系统后台管理接口文档，包括认证模块、系统管理模块、考勤管理模块和审批管理模块等。',
    contact: {
      name: '系统管理员',
      email: 'admin@oa.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: '本地开发服务器'
    }
  ],
  security: [
    {
      'X-User-Id': []
    }
  ],
  paths: {
    '/api/auth/login': {
      post: {
        summary: '用户登录',
        tags: ['认证模块'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'admin', description: '用户名' },
                  password: { type: 'string', example: '123456', description: '密码' }
                },
                required: ['username', 'password']
              }
            }
          }
        },
        responses: {
          200: {
            description: '登录成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 200 },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        username: { type: 'string', example: 'admin' },
                        real_name: { type: 'string', example: '系统管理员' },
                        emp_no: { type: 'string', example: '10001' },
                        dept_id: { type: 'integer', example: 1 },
                        position_id: { type: 'integer', example: 1 }
                      }
                    },
                    msg: { type: 'string', example: '登录成功' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        summary: '用户登出',
        tags: ['认证模块'],
        responses: {
          200: {
            description: '登出成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 200 },
                    msg: { type: 'string', example: '登出成功' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/permissions': {
      get: {
        summary: '获取当前用户权限',
        tags: ['认证模块'],
        responses: {
          200: {
            description: '成功获取权限',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 200 },
                    data: {
                      type: 'object',
                      properties: {
                        roleCode: { type: 'string', example: 'ROLE_ADMIN' },
                        roleName: { type: 'string', example: '系统管理员' },
                        permissions: {
                          type: 'array',
                          items: { type: 'string' },
                          example: ['dashboard', 'org:user', 'office:attendance', 'office:approval']
                        }
                      }
                    },
                    msg: { type: 'string', example: 'success' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/attendance/clock-in': {
      post: {
        summary: '上班打卡',
        tags: ['考勤管理'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user_id: { type: 'integer', example: 1, description: '用户ID（可选，默认使用请求头ID）' },
                  latitude: { type: 'number', example: 38.820564, description: '纬度' },
                  longitude: { type: 'number', example: 115.498772, description: '经度' },
                  device: { type: 'string', example: 'iPhone 15 Pro', description: '打卡设备标识' },
                  wifiName: { type: 'string', example: 'Office_WiFi', description: 'Wi-Fi名称' },
                  wifiMac: { type: 'string', example: '00:11:22:33:44:55', description: 'Wi-Fi MAC地址' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '打卡成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 200 },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        user_id: { type: 'integer', example: 1 },
                        attend_date: { type: 'string', example: '2026-05-29' },
                        clock_in_time: { type: 'string', example: '2026-05-29T09:00:00.000Z' },
                        status: { type: 'string', example: 'normal', description: '打卡状态: normal(正常), late(迟到)' }
                      }
                    },
                    msg: { type: 'string', example: '签到成功' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/attendance/clock-out': {
      post: {
        summary: '下班打卡',
        tags: ['考勤管理'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user_id: { type: 'integer', example: 1 },
                  latitude: { type: 'number', example: 38.820564 },
                  longitude: { type: 'number', example: 115.498772 },
                  device: { type: 'string', example: 'iPhone 15 Pro' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '打卡下班成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer', example: 200 },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        clock_out_time: { type: 'string', example: '2026-05-29T18:00:00.000Z' },
                        work_hours: { type: 'number', example: 9.0 },
                        status: { type: 'string', example: 'normal', description: '打卡状态: normal(正常), early(早退), late_early(迟到早退)' }
                      }
                    },
                    msg: { type: 'string', example: '打卡下班成功' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/attendance': {
      get: {
        summary: '获取考勤记录列表',
        tags: ['考勤管理'],
        parameters: [
          { name: 'user_id', in: 'query', required: false, schema: { type: 'integer' }, description: '用户ID' },
          { name: 'date', in: 'query', required: false, schema: { type: 'string' }, description: '日期 (YYYY-MM-DD)' }
        ],
        responses: {
          200: {
            description: '获取成功'
          }
        }
      }
    },
    '/api/attendance/stats': {
      get: {
        summary: '获取考勤统计',
        tags: ['考勤管理'],
        parameters: [
          { name: 'userId', in: 'query', required: true, schema: { type: 'integer' } },
          { name: 'startDate', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'endDate', in: 'query', required: false, schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: '获取成功'
          }
        }
      }
    },
    '/api/approvals': {
      get: {
        summary: '获取审批列表',
        tags: ['审批管理'],
        parameters: [
          { name: 'status', in: 'query', required: false, schema: { type: 'string' }, description: '状态: pending(待审批), approved(已通过), rejected(已拒绝), cancelled(已撤销)' },
          { name: 'applicant_id', in: 'query', required: false, schema: { type: 'integer' } }
        ],
        responses: {
          200: {
            description: '获取成功'
          }
        }
      },
      post: {
        summary: '发起审批申请',
        tags: ['审批管理'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', example: '请假', description: '审批类型: 请假/报销/出差/加班/采购/其他' },
                  title: { type: 'string', example: '请假申请-张强', description: '标题' },
                  applicant_name: { type: 'string', example: '张强', description: '申请人姓名' },
                  dept_name: { type: 'string', example: '技术部', description: '部门名称' },
                  content: { type: 'string', example: '年假申请3天，望批准。', description: '申请详细内容/事由' }
                },
                required: ['type', 'title', 'content']
              }
            }
          }
        },
        responses: {
          200: {
            description: '提交成功'
          }
        }
      }
    },
    '/api/approvals/{id}': {
      put: {
        summary: '处理审批（通过/拒绝）',
        tags: ['审批管理'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: '审批编号或ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: '已通过', description: '状态: 已通过/已拒绝' },
                  reject_reason: { type: 'string', example: '同意', description: '审批意见/拒绝原因' }
                },
                required: ['status']
              }
            }
          }
        },
        responses: {
          200: {
            description: '操作成功'
          }
        }
      }
    },
    '/api/approvals/{id}/approve': {
      put: {
        summary: '批准审批',
        tags: ['审批管理'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: '批准成功'
          }
        }
      }
    },
    '/api/approvals/{id}/reject': {
      put: {
        summary: '拒绝审批',
        tags: ['审批管理'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reason: { type: 'string', example: '拒绝理由' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '操作成功'
          }
        }
      }
    },
    '/api/approvals/{id}/cancel': {
      put: {
        summary: '撤回审批',
        tags: ['审批管理'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reason: { type: 'string', example: '主动撤回' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '撤回成功'
          }
        }
      }
    },
    '/api/users': {
      get: {
        summary: '获取用户列表',
        tags: ['用户管理'],
        parameters: [
          { name: 'keyword', in: 'query', required: false, schema: { type: 'string' }, description: '关键词' }
        ],
        responses: {
          200: {
            description: '获取成功'
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      'X-User-Id': {
        type: 'apiKey',
        in: 'header',
        name: 'X-User-Id',
        description: '当前登录用户的ID'
      }
    }
  }
};

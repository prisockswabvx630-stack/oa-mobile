export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const Validator = {
  validate(value: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];

    for (const rule of rules) {
      if (rule.required && this.isEmpty(value)) {
        errors.push(rule.message);
        continue;
      }

      if (this.isEmpty(value)) continue;

      if (rule.minLength !== undefined && typeof value === 'string' && value.length < rule.minLength) {
        errors.push(rule.message);
      }

      if (rule.maxLength !== undefined && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push(rule.message);
      }

      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        errors.push(rule.message);
      }

      if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
        errors.push(rule.message);
      }

      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(rule.message);
      }

      if (rule.custom && !rule.custom(value)) {
        errors.push(rule.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
  },

  validateAll(data: Record<string, any>, rules: Record<string, ValidationRule[]>): ValidationResult {
    const allErrors: string[] = [];

    for (const [field, fieldRules] of Object.entries(rules)) {
      const result = this.validate(data[field], fieldRules);
      allErrors.push(...result.errors);
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors
    };
  }
};

// 常用验证规则
export const CommonRules = {
  required: (message = '此项为必填项'): ValidationRule => ({
    required: true,
    message
  }),

  phone: (message = '请输入正确的手机号'): ValidationRule => ({
    pattern: /^1[3-9]\d{9}$/,
    message
  }),

  email: (message = '请输入正确的邮箱地址'): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    minLength: min,
    message: message || `长度不能少于${min}个字符`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    maxLength: max,
    message: message || `长度不能超过${max}个字符`
  }),

  range: (min: number, max: number, message?: string): ValidationRule => ({
    min,
    max,
    message: message || `数值必须在${min}到${max}之间`
  })
};

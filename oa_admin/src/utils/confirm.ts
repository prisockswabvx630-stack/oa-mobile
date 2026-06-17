import { Alert } from '../store/alert';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export const Confirm = {
  show(options: ConfirmOptions): void {
    const {
      title = '确认操作',
      message,
      confirmText = '确定',
      cancelText = '取消',
      type = 'info',
      onConfirm,
      onCancel
    } = options;

    Alert.alert(title, message, [
      {
        text: cancelText,
        style: 'cancel',
        onPress: onCancel
      },
      {
        text: confirmText,
        style: type === 'danger' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await onConfirm();
          } catch (error) {
            console.error('确认操作执行失败:', error);
          }
        }
      }
    ]);
  },

  confirm(message: string, onConfirm: () => void | Promise<void>): void {
    this.show({ message, onConfirm });
  },

  warning(message: string, onConfirm: () => void | Promise<void>): void {
    this.show({
      title: '警告',
      message,
      type: 'warning',
      onConfirm
    });
  },

  danger(message: string, onConfirm: () => void | Promise<void>): void {
    this.show({
      title: '危险操作',
      message,
      type: 'danger',
      confirmText: '确认删除',
      onConfirm
    });
  },

  delete(itemName: string, onConfirm: () => void | Promise<void>): void {
    this.danger(
      `确定要删除"${itemName}"吗？此操作不可撤销。`,
      onConfirm
    );
  },

  save(onConfirm: () => void | Promise<void>): void {
    this.confirm('确定要保存当前更改吗？', onConfirm);
  },

  submit(onConfirm: () => void | Promise<void>): void {
    this.confirm('确定要提交此表单吗？', onConfirm);
  }
};  
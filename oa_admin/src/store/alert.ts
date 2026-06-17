import { reactive } from 'vue';
import type { AlertButton } from './types';

export const alertState = reactive({
  visible: false,
  title: '',
  message: '',
  isPrompt: false,
  placeholder: '',
  defaultValue: '',
  inputValue: '',
  buttons: [] as AlertButton[]
});

export const Alert = {
  alert(title: string, message = '', buttons?: AlertButton[]) {
    alertState.title = title;
    alertState.message = message;
    alertState.isPrompt = false;
    alertState.placeholder = '';
    alertState.defaultValue = '';
    alertState.inputValue = '';
    if (buttons && buttons.length > 0) {
      alertState.buttons = buttons;
    } else {
      alertState.buttons = [
        { text: '确定', onPress: () => {} }
      ];
    }
    alertState.visible = true;
  },
  prompt(title: string, message = '', buttons?: AlertButton[], defaultValue = '', placeholder = '') {
    alertState.title = title;
    alertState.message = message;
    alertState.isPrompt = true;
    alertState.placeholder = placeholder;
    alertState.defaultValue = defaultValue;
    alertState.inputValue = defaultValue;
    if (buttons && buttons.length > 0) {
      alertState.buttons = buttons;
    } else {
      alertState.buttons = [
        { text: '取消', style: 'cancel' },
        { text: '确定', onPress: () => {} }
      ];
    }
    alertState.visible = true;
  }
};

// Expose to window - only override alert and prompt, keep native confirm working
if (typeof window !== 'undefined') {
  (window as any).Alert = Alert;
  (window as any).alert = (message: any) => {
    Alert.alert('提示', String(message));
  };
}

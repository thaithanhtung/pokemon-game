import { ref, h, render, type Ref } from 'vue';
import ToastNotification from '@/components/ToastNotification.vue';

interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  description?: string;
  duration?: number;
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  description: string;
  duration: number;
}

const toasts: Ref<Toast[]> = ref([]);

export function useToast() {
  const show = (message: string, options: ToastOptions = {}): void => {
    const { type = 'info', description = '', duration = 3000 } = options;

    const container = document.createElement('div');
    document.body.appendChild(container);

    const vnode = h(ToastNotification, {
      message,
      description,
      type,
      duration,
      onClose: () => {
        render(null, container);
        document.body.removeChild(container);
      },
    });

    render(vnode, container);
  };

  const success = (message, description = '') => {
    show(message, { type: 'success', description });
  };

  const error = (message, description = '') => {
    show(message, { type: 'error', description });
  };

  const warning = (message, description = '') => {
    show(message, { type: 'warning', description });
  };

  const info = (message: string, description: string = ''): void => {
    show(message, { type: 'info', description });
  };

  // Simpler version that mimics the original API
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success'): void => {
    show(message, { type });
  };

  return {
    show,
    success,
    error,
    warning,
    info,
    showToast,
  };
}

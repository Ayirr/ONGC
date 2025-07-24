export interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

class ToastManager {
  private container: HTMLElement | null = null;

  private createContainer(): HTMLElement {
    if (this.container) return this.container;
    
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(this.container);
    return this.container;
  }

  show(message: string, options: ToastOptions = { type: 'info' }): void {
    const container = this.createContainer();
    const toast = document.createElement('div');
    
    const baseClasses = 'px-4 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 translate-x-full opacity-0';
    const typeClasses = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      warning: 'bg-yellow-600',
      info: 'bg-blue-600'
    };
    
    toast.className = `${baseClasses} ${typeClasses[options.type]}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);
    
    // Auto remove
    const duration = options.duration || 4000;
    setTimeout(() => {
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  success(message: string, duration?: number): void {
    this.show(message, { type: 'success', duration });
  }

  error(message: string, duration?: number): void {
    this.show(message, { type: 'error', duration });
  }

  warning(message: string, duration?: number): void {
    this.show(message, { type: 'warning', duration });
  }

  info(message: string, duration?: number): void {
    this.show(message, { type: 'info', duration });
  }
}

export const toast = new ToastManager();
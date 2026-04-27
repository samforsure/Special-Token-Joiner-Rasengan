class ToastManager {
  constructor() {
    this.toasts = [];
    this.container = this.createContainer();
    this.injectStyles();
  }

  createContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 350px;
      }
      .toast {
        position: relative;
        background-color: var(--card-bg);
        color: var(--text);
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: space-between;
        animation: toast-slide-in 0.3s ease-out forwards;
        border-left: 4px solid var(--primary);
        min-width: 300px;
      }
      .toast.success { border-left-color: var(--success); }
      .toast.error   { border-left-color: var(--error); }
      .toast.warning { border-left-color: var(--warning); }
      .toast-content { flex: 1; }
      .toast-title   { font-weight: 500; margin-bottom: 4px; font-size: 14px; }
      .toast-message { font-size: 13px; color: var(--text-light); }
      .toast-close {
        background: none; border: none; color: var(--text-light);
        cursor: pointer; font-size: 18px; margin-left: 10px;
        transition: color 0.2s;
      }
      .toast-close:hover { color: var(--text); }
      .toast-progress {
        position: absolute; bottom: 0; left: 0;
        height: 3px; background: rgba(255,255,255,0.2);
        border-radius: 4px 4px 4px 4px;
      }
      .toast-icon { margin-right: 12px; font-size: 18px; }
      .toast.success .toast-icon { color: var(--success); }
      .toast.error   .toast-icon { color: var(--error); }
      .toast.warning .toast-icon { color: var(--warning); }
      @keyframes toast-slide-in { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
      @keyframes toast-slide-out{ from { transform: translateX(0); opacity:1; } to { transform: translateX(100%); opacity:0; } }
      @keyframes toast-progress { from { width:100%; } to { width:0%; } }
    `;
    document.head.appendChild(style);
  }

  show({ title = 'Notification', message = '', type = 'info', duration = 5000 } = {}) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: '🔔' };
    const icon = icons[type] || icons.info;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">×</button>
      <div class="toast-progress"></div>
    `;

    this.container.appendChild(toast);

    const toastId = Date.now();
    this.toasts.push({ id: toastId, element: toast });

    toast.querySelector('.toast-progress').style.animation =
      `toast-progress ${duration / 1000}s linear forwards`;

    toast.querySelector('.toast-close').addEventListener('click', () => this.dismiss(toastId));
    setTimeout(() => this.dismiss(toastId), duration);

    return toastId;
  }

  dismiss(id) {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index === -1) return;

    const { element } = this.toasts[index];
    element.style.animation = 'toast-slide-out 0.3s ease-out forwards';

    setTimeout(() => {
      element.remove();
      this.toasts.splice(index, 1);
    }, 300);
  }

  success(title, message, duration) { return this.show({ title, message, type: 'success', duration }); }
  error(title, message, duration)   { return this.show({ title, message, type: 'error', duration }); }
  warning(title, message, duration) { return this.show({ title, message, type: 'warning', duration }); }
  info(title, message, duration)    { return this.show({ title, message, type: 'info', duration }); }
}

window.toast = new ToastManager();

export interface ModalOptions {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
  onConfirm?: () => void;
}

let currentModal: HTMLDivElement | null = null;

export function showModal(options: ModalOptions): void {
  // Remove any existing modal
  if (currentModal) {
    closeModal();
  }

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in';
  modal.style.backgroundColor = 'rgba(45, 42, 38, 0.4)';
  modal.style.backdropFilter = 'blur(4px)';

  const typeStyles = {
    info: {
      background: 'hsl(210 80% 96%)',
      color: 'hsl(210 70% 35%)',
      border: 'hsl(210 70% 85%)',
    },
    success: {
      background: 'hsl(153 50% 94%)',
      color: 'hsl(153 50% 30%)',
      border: 'hsl(153 40% 80%)',
    },
    warning: {
      background: 'hsl(40 90% 94%)',
      color: 'hsl(30 80% 30%)',
      border: 'hsl(40 80% 80%)',
    },
    error: {
      background: 'hsl(0 70% 95%)',
      color: 'hsl(0 60% 35%)',
      border: 'hsl(0 60% 85%)',
    },
  };

  const iconSvg = {
    info: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>',
    success:
      '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
    warning:
      '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
    error:
      '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
  };

  const type = options.type || 'info';
  const title = options.title || type.charAt(0).toUpperCase() + type.slice(1);
  const styles = typeStyles[type];

  modal.innerHTML = `
    <div class="card max-w-md w-full animate-scale-up" style="border-radius: 20px;">
      <div class="p-7">
        <div class="flex items-start gap-4">
          <div class="shrink-0 p-2.5 rounded-xl" style="background: ${styles.background}; color: ${styles.color}; border: 1px solid ${styles.border};">
            ${iconSvg[type]}
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary); font-family: 'Fraunces', Georgia, serif;">${title}</h3>
            <p style="color: var(--text-secondary); line-height: 1.6;">${options.message}</p>
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button class="modal-confirm btn btn-primary">
            ${options.confirmText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  currentModal = modal;

  // Add event listeners
  const confirmButton = modal.querySelector('.modal-confirm');
  if (confirmButton) {
    confirmButton.addEventListener('click', () => {
      if (options.onConfirm) {
        options.onConfirm();
      }
      closeModal();
    });
  }

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
  document.addEventListener('keydown', handleEscape);
  modal.setAttribute('data-escape-handler', 'true');
}

export function closeModal(): void {
  if (currentModal) {
    currentModal.classList.add('animate-fade-out');
    setTimeout(() => {
      if (currentModal) {
        if (currentModal.getAttribute('data-escape-handler')) {
          document.removeEventListener('keydown', closeModal);
        }
        currentModal.remove();
        currentModal = null;
      }
    }, 200);
  }
}

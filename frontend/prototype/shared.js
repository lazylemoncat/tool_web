// Shared utilities for tool-web prototype
const Proto = {
  // State management
  setState(container, state) {
    const states = container.querySelectorAll('.state');
    states.forEach(s => s.classList.remove('active'));
    const target = container.querySelector(`.state-${state}`);
    if (target) target.classList.add('active');
  },

  // Toast notification
  toast(message, type = 'info') {
    const toast = document.getElementById('proto-toast');
    toast.textContent = message;
    toast.className = `proto-toast toast-${type} visible`;
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('visible'), 3000);
  },

  // Toggle password visibility
  togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('.eye-icon');
    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = '🙈';
    } else {
      input.type = 'password';
      icon.textContent = '👁';
    }
  },

  // Simulate loading → state
  simulateLoad(container, targetState, delay = 800) {
    this.setState(container, 'loading');
    return new Promise(resolve => {
      setTimeout(() => {
        this.setState(container, targetState);
        resolve();
      }, delay);
    });
  },

  // Navigate between prototype pages
  navigate(page) {
    window.location.href = page;
  },

  // Format date
  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  },

  // Get current state from container
  getState(container) {
    const active = container.querySelector('.state.active');
    if (!active) return null;
    const match = active.className.match(/state-(\w+)/);
    return match ? match[1] : null;
  },

  // Validate form field
  validateField(input, rules = {}) {
    const val = input.value.trim();
    const errorEl = input.parentElement.querySelector('.field-error');
    let error = null;

    if (rules.required && !val) {
      error = rules.requiredMsg || 'This field is required';
    } else if (rules.minLength && val.length < rules.minLength) {
      error = rules.minLengthMsg || `Minimum ${rules.minLength} characters`;
    } else if (rules.pattern && !rules.pattern.test(val)) {
      error = rules.patternMsg || 'Invalid format';
    }

    if (error) {
      input.classList.add('input-error');
      if (errorEl) { errorEl.textContent = error; errorEl.style.display = 'block'; }
      return false;
    } else {
      input.classList.remove('input-error');
      if (errorEl) { errorEl.style.display = 'none'; }
      return true;
    }
  },

  // Show error state on container
  showError(container, message) {
    const errorText = container.querySelector('.error-message');
    if (errorText) errorText.textContent = message;
    this.setState(container, 'error');
  },

  // Check password strength
  checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return score; // 0-4
  }
};

// Toast container setup
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('proto-toast')) {
    const toast = document.createElement('div');
    toast.id = 'proto-toast';
    toast.className = 'proto-toast';
    document.body.appendChild(toast);
  }
});

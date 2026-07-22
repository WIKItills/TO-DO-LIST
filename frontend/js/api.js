// Client API Helper

const API_BASE = '/api';

// Authentication Storage Helpers
const auth = {
  saveToken(token) {
    localStorage.setItem('jwt_token', token);
  },
  getToken() {
    return localStorage.getItem('jwt_token');
  },
  saveUser(user) {
    localStorage.setItem('user_profile', JSON.stringify(user));
  },
  getUser() {
    try {
      const profile = localStorage.getItem('user_profile');
      return profile ? JSON.parse(profile) : null;
    } catch (e) {
      console.warn('Corrupt user profile in localStorage. Clearing profile.');
      localStorage.removeItem('user_profile');
      return null;
    }
  },
  logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_profile');
    window.location.href = '/';
  },
  isAuthenticated() {
    return !!this.getToken();
  }
};

// API Fetch wrapper
async function apiFetch(endpoint, options = {}) {
  const token = auth.getToken();
  
  // Set headers
  const headers = options.headers || {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is an object and not FormData, stringify it and set content-type
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    body
  });

  // Handle Session Expiration/Access Denials
  if ((response.status === 401 || response.status === 403) && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    showNotification('Session expired or unauthorized. Logging out...', 'error');
    setTimeout(() => {
      auth.logout();
    }, 1500);
    throw new Error('Unauthorized');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// Premium Notification System
function showNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.querySelector('.notification-bell');
  if (existing) existing.remove();

  const colors = {
    success: 'linear-gradient(135deg, #10b981, #059669)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
    info: 'linear-gradient(135deg, #06b6d4, #0891b2)'
  };

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'notification-bell glass-panel';
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 16px 24px;
    border-radius: var(--border-radius-sm);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    min-width: 300px;
    max-width: 450px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;

  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info}" style="font-size: 1.25rem;"></i>
    <span style="flex: 1;">${message}</span>
  `;

  document.body.appendChild(toast);

  // Auto remove after 3.5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// Redirect helpers if wrong role
function redirectOnRole() {
  const user = auth.getUser();
  if (!user) {
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
      window.location.href = '/';
    }
    return;
  }

  const currentPath = window.location.pathname;
  if (user.role === 'student' && !currentPath.includes('student.html')) {
    window.location.href = '/student.html';
  } else if (user.role === 'teacher' && !currentPath.includes('teacher.html')) {
    window.location.href = '/teacher.html';
  } else if (user.role === 'admin' && !currentPath.includes('admin.html')) {
    window.location.href = '/admin.html';
  }
}

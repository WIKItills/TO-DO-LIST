// Client Authentication Scripts
console.log('auth.js script loaded.');

document.addEventListener('DOMContentLoaded', () => {
  try {
    // Check if already authenticated and redirect
    if (auth.isAuthenticated()) {
      redirectOnRole();
    }
  } catch (authError) {
    console.error('Session auto-redirect error:', authError);
  }

  // Handle Login submission
  const loginFormEl = document.getElementById('loginForm');
  if (loginFormEl) {
    loginFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        return showNotification('Please enter all fields', 'warning');
      }

      try {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: { email, password }
        });

        if (data.success) {
          auth.saveToken(data.token);
          auth.saveUser(data.user);
          showNotification('Login successful! Redirecting...', 'success');
          
          setTimeout(() => {
            redirectOnRole();
          }, 1000);
        }
      } catch (err) {
        showNotification(err.message || 'Login failed', 'error');
      }
    });
  }
});

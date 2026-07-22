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

  // Bind password toggle visibility helper
  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      const input = e.currentTarget.parentElement.querySelector('input');
      if (input.type === 'password') {
        input.type = 'text';
        e.currentTarget.classList.remove('fa-eye');
        e.currentTarget.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        e.currentTarget.classList.remove('fa-eye-slash');
        e.currentTarget.classList.add('fa-eye');
      }
    });
  });

  // --- Forgot Password Modal Handler (Security Question Workflow) ---
  const forgotModal = document.getElementById('forgotPasswordModal');
  const btnForgotTrigger = document.getElementById('btnForgotPassword');

  if (forgotModal && btnForgotTrigger) {
    const step1 = document.getElementById('forgotStep1');
    const step2 = document.getElementById('forgotStep2');
    const emailInput = document.getElementById('forgotEmail');
    const answerInput = document.getElementById('forgotAnswer');
    const newPassInput = document.getElementById('forgotNewPass');
    const questionText = document.getElementById('forgotQuestionText');

    // Open Modal
    btnForgotTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      // Reset Modal Views
      step1.style.display = 'block';
      step2.style.display = 'none';
      emailInput.value = '';
      answerInput.value = '';
      newPassInput.value = '';
      
      forgotModal.classList.add('active');
    });

    // Close Modal
    const dismissTriggers = forgotModal.querySelectorAll('[data-dismiss="modal"], .modal-close');
    dismissTriggers.forEach(btn => {
      btn.addEventListener('click', () => {
        forgotModal.classList.remove('active');
      });
    });

    // Step 1: Click "Next" -> Fetch Security Question
    const btnNext = document.getElementById('btnForgotNext');
    if (btnNext) {
      btnNext.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email) {
          return showNotification('Please enter your email address', 'warning');
        }

        try {
          const data = await apiFetch('/auth/forgot-password-question', {
            method: 'POST',
            body: { email }
          });

          if (data.success) {
            // Load question text and switch step view
            questionText.textContent = data.securityQuestion;
            step1.style.display = 'none';
            step2.style.display = 'block';
          }
        } catch (err) {
          showNotification(err.message || 'Verification failed', 'error');
        }
      });
    }

    // Step 2: Click "Back" -> Go back to email entry
    const btnBack = document.getElementById('btnForgotBack');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        step1.style.display = 'block';
        step2.style.display = 'none';
      });
    }

    // Step 2: Click "Reset Password" -> Verify and Update Password
    const btnSubmitReset = document.getElementById('btnForgotSubmit');
    if (btnSubmitReset) {
      btnSubmitReset.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const securityAnswer = answerInput.value.trim();
        const newPassword = newPassInput.value;

        if (!email || !securityAnswer || !newPassword) {
          return showNotification('Please fill in all fields', 'warning');
        }

        if (newPassword.length < 6) {
          return showNotification('Password must be at least 6 characters', 'warning');
        }

        try {
          const data = await apiFetch('/auth/reset-password-question', {
            method: 'POST',
            body: { email, securityAnswer, newPassword }
          });

          if (data.success) {
            showNotification('Password reset successful! You can now log in.', 'success');
            forgotModal.classList.remove('active');
          }
        } catch (err) {
          showNotification(err.message || 'Reset failed', 'error');
        }
      });
    }
  }
});

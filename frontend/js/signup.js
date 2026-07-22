// Separate Client Signup Controllers
console.log('signup.js script loaded.');

document.addEventListener('DOMContentLoaded', () => {
  // Check if already authenticated and redirect
  try {
    if (auth.isAuthenticated()) {
      redirectOnRole();
      return;
    }
  } catch (err) {
    console.error('Auto redirect check failed:', err);
  }

  // 1. Student Signup Form Handler
  const studentForm = document.getElementById('signupStudentForm');
  if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('studentName').value.trim();
      const email = document.getElementById('studentEmail').value.trim();
      const password = document.getElementById('studentPassword').value;
      const confirmPassword = document.getElementById('studentConfirmPassword').value;
      const securityQuestion = document.getElementById('studentSecurityQuestion').value;
      const securityAnswer = document.getElementById('studentSecurityAnswer').value.trim();

      if (!name || !email || !password || !confirmPassword || !securityQuestion || !securityAnswer) {
        return showNotification('Please fill in all fields', 'warning');
      }

      if (password !== confirmPassword) {
        return showNotification('Passwords do not match', 'warning');
      }

      try {
        const data = await apiFetch('/auth/register', {
          method: 'POST',
          body: { name, email, password, role: 'student', securityQuestion, securityAnswer }
        });

        if (data.success) {
          auth.saveToken(data.token);
          auth.saveUser(data.user);
          showNotification('Student registration successful! Redirecting...', 'success');
          setTimeout(() => {
            redirectOnRole();
          }, 1000);
        }
      } catch (err) {
        showNotification(err.message || 'Registration failed', 'error');
      }
    });
  }

  // 2. Teacher Signup Form Handler
  const teacherForm = document.getElementById('signupTeacherForm');
  if (teacherForm) {
    teacherForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('teacherName').value.trim();
      const email = document.getElementById('teacherEmail').value.trim();
      const password = document.getElementById('teacherPassword').value;
      const confirmPassword = document.getElementById('teacherConfirmPassword').value;
      const securityQuestion = document.getElementById('teacherSecurityQuestion').value;
      const securityAnswer = document.getElementById('teacherSecurityAnswer').value.trim();

      if (!name || !email || !password || !confirmPassword || !securityQuestion || !securityAnswer) {
        return showNotification('Please fill in all fields', 'warning');
      }

      if (password !== confirmPassword) {
        return showNotification('Passwords do not match', 'warning');
      }

      try {
        const data = await apiFetch('/auth/register', {
          method: 'POST',
          body: { name, email, password, role: 'teacher', securityQuestion, securityAnswer }
        });

        if (data.success) {
          auth.saveToken(data.token);
          auth.saveUser(data.user);
          showNotification('Teacher registration successful! Redirecting...', 'success');
          setTimeout(() => {
            redirectOnRole();
          }, 1000);
        }
      } catch (err) {
        showNotification(err.message || 'Registration failed', 'error');
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
});

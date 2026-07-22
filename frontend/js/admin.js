// Super-Admin Dashboard Controller
console.log('admin.js initialized.');

let usersData = [];
let tasksData = [];

document.addEventListener('DOMContentLoaded', () => {
  const user = auth.getUser();
  if (!user || user.role !== 'admin') {
    redirectOnRole();
    return;
  }

  // Display admin name
  document.getElementById('userName').textContent = user.name;

  // Load all system data
  loadAdminData();

  // Bind static dashboard events
  bindStaticEvents();
});

// Bind static filters, inputs, and modal dismiss elements
function bindStaticEvents() {
  // 1. Logout
  const logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
    });
  }

  // 2. Section tabs
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const selected = e.currentTarget.getAttribute('data-tab');
      switchAdminTab(selected);
    });
  });

  // 3. User search input
  const userSearch = document.getElementById('userSearch');
  if (userSearch) {
    userSearch.addEventListener('input', () => {
      filterUsersList();
    });
  }

  // 4. Task search input
  const taskSearch = document.getElementById('taskSearch');
  if (taskSearch) {
    taskSearch.addEventListener('input', () => {
      filterTasksList();
    });
  }

  // 5. Task status filter dropdown selector
  const taskStatusFilter = document.getElementById('taskStatusFilter');
  if (taskStatusFilter) {
    taskStatusFilter.addEventListener('change', () => {
      filterTasksList();
    });
  }

  // 6. Modal close dismiss buttons
  document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAdminProof();
      closeFullImage();
    });
  });

  // 7. Close full size image viewer modal button
  const closeFullImageBtn = document.getElementById('closeFullImageBtn');
  if (closeFullImageBtn) {
    closeFullImageBtn.addEventListener('click', closeFullImage);
  }
}

// Fetch stats, users, and tasks logs in sequence
async function loadAdminData() {
  try {
    // 1. Fetch system stats
    const statsResult = await apiFetch('/admin/stats');
    if (statsResult.success) {
      updateAnalytics(statsResult.stats);
    }

    // 2. Fetch all system users
    const usersResult = await apiFetch('/admin/users');
    if (usersResult.success) {
      usersData = usersResult.users || [];
      document.getElementById('userCountBadge').textContent = usersData.length;
      renderUsersTable();
    }

    // 3. Fetch all system tasks
    const tasksResult = await apiFetch('/admin/tasks');
    if (tasksResult.success) {
      tasksData = tasksResult.tasks || [];
      document.getElementById('taskCountBadge').textContent = tasksData.length;
      renderTasksTable();
    }
  } catch (err) {
    showNotification('Error loading administrative logs', 'error');
  }
}

// Render metrics panels
function updateAnalytics(stats) {
  document.getElementById('statTotalUsers').textContent = stats.users.total;
  document.getElementById('statRoleRatio').textContent = `${stats.users.students} / ${stats.users.teachers}`;
  document.getElementById('statTotalTasks').textContent = stats.tasks.total;
  
  // Calculate verified rate
  const rate = stats.tasks.total > 0 
    ? Math.round((stats.tasks.approved / stats.tasks.total) * 100)
    : 0;
  
  document.getElementById('statVerifyRate').textContent = `${rate}%`;
}

// Toggle active dashboard sections
function switchAdminTab(tab) {
  const tabUsers = document.getElementById('tabUsers');
  const tabTasks = document.getElementById('tabTasks');
  const usersPanel = document.getElementById('usersPanel');
  const tasksPanel = document.getElementById('tasksPanel');

  if (tab === 'users') {
    tabUsers.classList.add('active');
    tabTasks.classList.remove('active');
    usersPanel.style.display = 'block';
    tasksPanel.style.display = 'none';
  } else {
    tabUsers.classList.remove('active');
    tabTasks.classList.add('active');
    usersPanel.style.display = 'none';
    tasksPanel.style.display = 'block';
  }
}

// Render accounts grid
function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  const query = document.getElementById('userSearch').value.toLowerCase().trim();

  const filtered = usersData.filter(user => {
    return user.name.toLowerCase().includes(query) || 
           user.email.toLowerCase().includes(query) || 
           user.role.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching accounts found</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(user => {
    const joinedDate = new Date(user.createdAt).toLocaleDateString();
    const roleClass = user.role === 'admin' ? 'admin' : (user.role === 'teacher' ? 'teacher' : '');
    
    return `
      <tr>
        <td style="font-family: monospace; font-size: 0.8rem; color: var(--text-muted);">${user._id}</td>
        <td><strong>${escapeHtml(user.name)}</strong></td>
        <td>${escapeHtml(user.email)}</td>
        <td><span class="user-role-tag ${roleClass}">${user.role}</span></td>
        <td>${joinedDate}</td>
      </tr>
    `;
  }).join('');
}

// Filter triggers
function filterUsersList() {
  renderUsersTable();
}

// Render global tasks grid
function renderTasksTable() {
  const tbody = document.getElementById('tasksTableBody');
  const query = document.getElementById('taskSearch').value.toLowerCase().trim();
  const statusFilter = document.getElementById('taskStatusFilter').value;

  const filtered = tasksData.filter(task => {
    // 1. Status Filter
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }
    
    // 2. Search Text
    const matchTitle = task.title.toLowerCase().includes(query);
    const matchStudent = task.student && task.student.name.toLowerCase().includes(query);
    const matchTeacher = task.teacher && task.teacher.name.toLowerCase().includes(query);
    
    return matchTitle || matchStudent || matchTeacher;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching tasks found</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(task => {
    const updatedDate = task.reviewedAt 
      ? new Date(task.reviewedAt).toLocaleDateString()
      : (task.submittedAt ? new Date(task.submittedAt).toLocaleDateString() : new Date(task.createdAt).toLocaleDateString());
    
    const studentName = task.student ? escapeHtml(task.student.name) : '<span class="text-muted">Unknown</span>';
    const teacherName = task.teacher ? escapeHtml(task.teacher.name) : '<span class="text-muted">Unassigned</span>';

    // Proof link (removing inline onclick attributes for CSP conformity)
    const proofCount = task.proofImages ? task.proofImages.length : 0;
    const proofCell = proofCount > 0 
      ? `<button class="btn btn-secondary btn-admin-view-proof" data-id="${task._id}" style="padding: 4px 10px; font-size: 0.75rem;">
           <i class="fas fa-images"></i> View proofs (${proofCount})
         </button>`
      : '<span style="color: var(--text-muted); font-style: italic;">No proof</span>';

    return `
      <tr>
        <td>
          <div style="font-weight: 600;">${escapeHtml(task.title)}</div>
          ${task.description ? `<div style="font-size: 0.8rem; color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(task.description)}">${escapeHtml(task.description)}</div>` : ''}
        </td>
        <td>${studentName}</td>
        <td>${teacherName}</td>
        <td><span class="task-status-pill ${task.status}">${task.status}</span></td>
        <td>${proofCell}</td>
        <td>${updatedDate}</td>
      </tr>
    `;
  }).join('');

  // Dynamically attach click event handlers
  bindDynamicAdminEvents();
}

// Bind clicks on dynamically rendered tables
function bindDynamicAdminEvents() {
  const tbody = document.getElementById('tasksTableBody');
  
  tbody.querySelectorAll('.btn-admin-view-proof').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      console.log('Dynamic Click: Admin open proof viewer for task:', id);
      openAdminProofViewer(id);
    });
  });
}

// Filter task list trigger
function filterTasksList() {
  renderTasksTable();
}

// Modal view gallery
function openAdminProofViewer(taskId) {
  const task = tasksData.find(t => t._id === taskId);
  if (!task || !task.proofImages || task.proofImages.length === 0) return;

  const grid = document.getElementById('adminViewerImagesGrid');
  grid.innerHTML = task.proofImages.map(img => `
    <div style="position: relative; border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color); background: #000; height: 110px;">
      <img src="${img.url}" alt="Task verification proof" style="width: 100%; height: 100%; object-fit: cover;">
      <button class="btn-fullview-proof-img" data-url="${img.url}" style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.6); padding: 4px; border-radius: 50%; color: white; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; border: none; cursor: pointer;" title="View Fullsize">
        <i class="fas fa-expand-alt"></i>
      </button>
    </div>
  `).join('');

  // Dynamically attach click listener to gallery elements
  grid.querySelectorAll('.btn-fullview-proof-img').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = e.currentTarget.getAttribute('data-url');
      openFullImage(url);
    });
  });

  document.getElementById('adminModalTitle').textContent = `Audit Proofs: ${task.title}`;
  document.getElementById('adminProofModal').classList.add('active');
}

// Close Modal
function closeAdminProof() {
  document.getElementById('adminProofModal').classList.remove('active');
}

// Full size image popup handlers
function openFullImage(url) {
  document.getElementById('fullImageViewerImg').src = url;
  document.getElementById('fullImageModal').classList.add('active');
}

function closeFullImage() {
  document.getElementById('fullImageModal').classList.remove('active');
  document.getElementById('fullImageViewerImg').src = '';
}

// HTML escape helper
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

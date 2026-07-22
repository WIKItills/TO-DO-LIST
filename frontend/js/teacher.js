// Teacher Dashboard Controller
console.log('teacher.js initialized.');

let teacherTasks = [];
let activeTab = 'queue'; // 'queue' (submitted) or 'history' (approved/rejected)

document.addEventListener('DOMContentLoaded', () => {
  const user = auth.getUser();
  if (!user || user.role !== 'teacher') {
    redirectOnRole();
    return;
  }

  // Display user name
  document.getElementById('userName').textContent = user.name;

  // Load teacher tasks
  loadTeacherTasks();

  // Setup static event bindings
  bindStaticEvents();
});

// Bind static filters and logout events
function bindStaticEvents() {
  // 1. Logout
  const logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
    });
  }

  // 2. Tabs
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const selected = e.currentTarget.getAttribute('data-tab');
      toggleTeacherTab(selected);
    });
  });

  // 3. Modal close dismiss
  document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeProofViewer();
      closeFullImage();
    });
  });

  // 4. Close full size image viewer modal button
  const closeFullImageBtn = document.getElementById('closeFullImageBtn');
  if (closeFullImageBtn) {
    closeFullImageBtn.addEventListener('click', closeFullImage);
  }
}

// Load tasks assigned to teacher
async function loadTeacherTasks() {
  try {
    const data = await apiFetch('/tasks/teacher');
    teacherTasks = data.tasks || [];
    
    // Update metrics counts
    updateMetrics();
    
    // Render current active tab
    renderTeacherTasks();
  } catch (err) {
    showNotification('Failed to load teacher tasks', 'error');
  }
}

// Update counters
function updateMetrics() {
  const total = teacherTasks.length;
  const pending = teacherTasks.filter(t => t.status === 'pending').length;
  const queue = teacherTasks.filter(t => t.status === 'submitted').length;
  const approved = teacherTasks.filter(t => t.status === 'approved').length;
  const rejected = teacherTasks.filter(t => t.status === 'rejected').length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statQueue').textContent = queue;
  document.getElementById('statApproved').textContent = approved;
  document.getElementById('statRejected').textContent = rejected;

  // Update tab queue indicator
  document.getElementById('countQueueText').textContent = queue;
}

// Toggle tab
function toggleTeacherTab(tab) {
  activeTab = tab;
  
  const tabQueue = document.getElementById('tabQueue');
  const tabHistory = document.getElementById('tabHistory');

  if (tab === 'queue') {
    tabQueue.classList.add('active');
    tabHistory.classList.remove('active');
  } else {
    tabQueue.classList.remove('active');
    tabHistory.classList.add('active');
  }

  renderTeacherTasks();
}

// Render task list
function renderTeacherTasks() {
  const container = document.getElementById('teacherTasksContainer');
  let filtered = [];

  if (activeTab === 'queue') {
    // Review queue has ONLY submitted tasks (with photo proofs)
    filtered = teacherTasks.filter(t => t.status === 'submitted');
  } else {
    // History includes already audited tasks (approved or rejected)
    filtered = teacherTasks.filter(t => t.status === 'approved' || t.status === 'rejected');
  }

  if (filtered.length === 0) {
    const emptyTitle = activeTab === 'queue' ? 'Queue is clean!' : 'No history yet';
    const emptyDesc = activeTab === 'queue' 
      ? 'No students have submitted verification proofs to you recently.' 
      : 'You have not approved or rejected any tasks yet.';

    container.innerHTML = `
      <div class="empty-state glass-panel">
        <i class="fas fa-clipboard-check"></i>
        <h3>${emptyTitle}</h3>
        <p>${emptyDesc}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(task => {
    const dateText = task.submittedAt 
      ? new Date(task.submittedAt).toLocaleString() 
      : new Date(task.createdAt).toLocaleString();

    let actionSection = '';

    if (activeTab === 'queue') {
      actionSection = `
        <div style="margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 15px;">
          <div class="form-group" style="margin-bottom: 12px;">
            <label for="feedback-${task._id}" class="form-label" style="font-size: 0.8rem;">Review Feedback / Audit Comment (Optional)</label>
            <input type="text" id="feedback-${task._id}" class="form-input" placeholder="e.g. Great job! / Upload a clearer photo of the completion page." style="padding: 8px 12px; font-size: 0.85rem;">
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn btn-danger btn-reject-proof" data-id="${task._id}" style="padding: 6px 12px; font-size: 0.85rem;">
              <i class="fas fa-times"></i> Reject Proof
            </button>
            <button class="btn btn-success btn-approve-proof" data-id="${task._id}" style="padding: 6px 12px; font-size: 0.85rem;">
              <i class="fas fa-check"></i> Approve Task
            </button>
          </div>
        </div>
      `;
    } else {
      const feedbackClass = task.status === 'rejected' ? 'rejected' : 'approved';
      actionSection = `
        <div class="task-feedback-box ${feedbackClass}" style="margin-top: 15px;">
          <div class="feedback-label">Your audit feedback:</div>
          <div>${task.feedback ? `"${escapeHtml(task.feedback)}"` : '<em>No feedback comments provided.</em>'}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">Reviewed on ${new Date(task.reviewedAt).toLocaleString()}</div>
        </div>
      `;
    }

    const proofCount = task.proofImages ? task.proofImages.length : 0;

    return `
      <div class="task-card glass-panel">
        <div class="task-card-header">
          <div>
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-assignee">Submitted by: <strong>${escapeHtml(task.student.name)}</strong> (${escapeHtml(task.student.email)})</div>
          </div>
          <span class="task-status-pill ${task.status}">${task.status}</span>
        </div>

        ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}

        <div style="display: flex; align-items: center; gap: 15px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
          <i class="fas fa-images" style="font-size: 1.5rem; color: var(--color-primary);"></i>
          <span style="font-size: 0.85rem; flex: 1;">Verification proofs loaded (<strong>${proofCount}</strong> photo(s)).</span>
          <button class="btn btn-secondary btn-view-proof" data-id="${task._id}" style="padding: 4px 10px; font-size: 0.8rem;">
            <i class="fas fa-eye"></i> View Proofs
          </button>
        </div>

        ${actionSection}

        <div class="task-footer">
          <span>Submitted at ${dateText}</span>
        </div>
      </div>
    `;
  }).join('');

  bindDynamicTaskEvents();
}

// Bind click event listeners to review operations
function bindDynamicTaskEvents() {
  const container = document.getElementById('teacherTasksContainer');

  // 1. View Proof
  container.querySelectorAll('.btn-view-proof').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openProofViewer(id);
    });
  });

  // 2. Reject Proof
  container.querySelectorAll('.btn-reject-proof').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      submitReview(id, 'rejected');
    });
  });

  // 3. Approve Proof
  container.querySelectorAll('.btn-approve-proof').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      submitReview(id, 'approved');
    });
  });
}

// Review submit API helper
async function submitReview(taskId, status) {
  const feedbackInput = document.getElementById(`feedback-${taskId}`);
  const feedback = feedbackInput ? feedbackInput.value.trim() : '';

  try {
    const data = await apiFetch(`/tasks/${taskId}/review`, {
      method: 'PUT',
      body: { status, feedback }
    });

    if (data.success) {
      showNotification(`Task proof has been ${status === 'approved' ? 'approved' : 'rejected'} successfully!`, 'success');
      loadTeacherTasks();
    }
  } catch (err) {
    showNotification(err.message || 'Failed to submit review', 'error');
  }
}

// Image viewer Modal for multiple proofs
function openProofViewer(taskId) {
  const task = teacherTasks.find(t => t._id === taskId);
  if (!task || !task.proofImages || task.proofImages.length === 0) return;

  const grid = document.getElementById('teacherViewerImagesGrid');
  grid.innerHTML = task.proofImages.map(img => {
    // Generate clean filename: replace spaces with underscores, alphanumeric only
    const cleanTitle = task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `proof_${cleanTitle}_${img._id}.jpg`;

    return `
      <div style="position: relative; border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color); background: #000; height: 110px;">
        <img src="${img.url}" alt="Task verification proof" style="width: 100%; height: 100%; object-fit: cover;">
        
        <!-- Download button -->
        <button class="btn-download-proof-img" data-url="${img.url}" data-filename="${filename}" style="position: absolute; bottom: 4px; right: 32px; background: rgba(16, 185, 129, 0.85); padding: 4px; border-radius: 50%; color: white; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; border: none; cursor: pointer;" title="Download Photo">
          <i class="fas fa-download"></i>
        </button>

        <!-- Full View Button -->
        <button class="btn-fullview-proof-img" data-url="${img.url}" style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.6); padding: 4px; border-radius: 50%; color: white; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; border: none; cursor: pointer;" title="View Fullsize">
          <i class="fas fa-expand-alt"></i>
        </button>
      </div>
    `;
  }).join('');

  // Dynamically attach click listener to fullview elements
  grid.querySelectorAll('.btn-fullview-proof-img').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = e.currentTarget.getAttribute('data-url');
      openFullImage(url);
    });
  });

  // Dynamically attach click listener to download elements
  grid.querySelectorAll('.btn-download-proof-img').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = e.currentTarget.getAttribute('data-url');
      const filename = e.currentTarget.getAttribute('data-filename');
      handleDownloadImage(url, filename);
    });
  });

  document.getElementById('viewerTitle').textContent = `Verification Proofs: ${task.title}`;
  document.getElementById('proofViewerModal').classList.add('active');
}

function closeProofViewer() {
  document.getElementById('proofViewerModal').classList.remove('active');
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

// Robust cross-origin file downloader
async function handleDownloadImage(url, filename) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.warn('CORS restricted, opening in new tab instead:', err);
    window.open(url, '_blank');
  }
}

// Escape html helper
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

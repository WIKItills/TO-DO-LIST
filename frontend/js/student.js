// Student Dashboard Controller
console.log('student.js initialized.');

let allTasks = [];
let activeFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  const user = auth.getUser();
  if (!user || user.role !== 'student') {
    redirectOnRole();
    return;
  }

  // Display user's name
  document.getElementById('userName').textContent = user.name;

  // Initialize data
  loadTeachers();
  loadTasks();

  // Setup form submission
  document.getElementById('createTaskForm').addEventListener('submit', handleCreateTask);
  
  // Setup task edit submission
  document.getElementById('editTaskForm').addEventListener('submit', handleEditTask);

  // Setup proof upload form
  document.getElementById('proofUploadForm').addEventListener('submit', handleUploadProof);

  // Setup static event listeners
  bindStaticEvents();

  // Setup drag & drop dropzone listeners
  initDropzone();
});

// Bind static dashboard triggers
function bindStaticEvents() {
  // 1. Logout button
  const logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
    });
  }

  // 2. Filter Pills
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      const filter = e.currentTarget.getAttribute('data-filter');
      filterTasks(filter);
    });
  });

  // 3. Modal close dismiss triggers
  document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeProofModal();
      closeViewProofModal();
      closeEditModal();
      closeFullImage();
    });
  });

  // 4. File input select trigger on dropzone click
  const dropzone = document.getElementById('dropzone');
  if (dropzone) {
    dropzone.addEventListener('click', triggerFileInput);
  }

  // 5. File input value change handler
  const fileInput = document.getElementById('proofFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect);
  }

  // 6. Close full size image viewer modal button
  const closeFullImageBtn = document.getElementById('closeFullImageBtn');
  if (closeFullImageBtn) {
    closeFullImageBtn.addEventListener('click', closeFullImage);
  }
}

// Load registered teachers
async function loadTeachers() {
  try {
    const data = await apiFetch('/auth/teachers');
    const select = document.getElementById('taskTeacher');
    const editSelect = document.getElementById('editTaskTeacher');
    
    const optionsHtml = data.teachers && data.teachers.length > 0
      ? '<option value="" disabled selected>Select a registered teacher</option>' +
        data.teachers.map(t => `<option value="${t._id}">${t.name} (${t.email})</option>`).join('')
      : '<option disabled>No teachers registered yet</option>';

    select.innerHTML = optionsHtml;
    if (editSelect) {
      editSelect.innerHTML = optionsHtml;
    }
  } catch (err) {
    showNotification('Failed to load teachers list', 'error');
  }
}

// Load student tasks
async function loadTasks() {
  try {
    const data = await apiFetch('/tasks/student');
    allTasks = data.tasks || [];
    
    // Update metrics
    updateMetrics();
    
    // Render list
    renderTasks();
  } catch (err) {
    showNotification('Failed to fetch tasks', 'error');
  }
}

// Update counters
function updateMetrics() {
  const total = allTasks.length;
  const pending = allTasks.filter(t => t.status === 'pending').length;
  const submitted = allTasks.filter(t => t.status === 'submitted').length;
  const approved = allTasks.filter(t => t.status === 'approved').length;
  const rejected = allTasks.filter(t => t.status === 'rejected').length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statSubmitted').textContent = submitted;
  document.getElementById('statApproved').textContent = approved;
  document.getElementById('statRejected').textContent = rejected;
}

// Filter controller
function filterTasks(status) {
  activeFilter = status;
  
  // Toggle pill states
  document.querySelectorAll('.filter-pill').forEach(pill => {
    if (pill.getAttribute('data-filter') === status) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  renderTasks();
}

// Render list of tasks with edit/delete visibility controls
function renderTasks() {
  const container = document.getElementById('tasksContainer');
  
  const filtered = activeFilter === 'all' 
    ? allTasks 
    : allTasks.filter(t => t.status === activeFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state glass-panel">
        <i class="fas fa-tasks"></i>
        <h3>No ${activeFilter !== 'all' ? activeFilter : ''} tasks found</h3>
        <p>There are no tasks to display in this list.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(task => {
    const formattedDate = new Date(task.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    let actionButtons = '';
    
    if (task.status === 'pending' || task.status === 'submitted') {
      // Editable & Deletable state (Before Audited by Teacher)
      const uploadBtnText = task.status === 'submitted' ? 'Reselect Proof' : 'Submit Proof';
      const viewBtn = task.status === 'submitted' 
        ? `<button class="btn btn-secondary btn-view-proof" data-id="${task._id}" style="padding: 6px 12px; font-size: 0.8rem;">
            <i class="fas fa-images"></i> View Proofs (${task.proofImages ? task.proofImages.length : 0})
           </button>`
        : '';
        
      actionButtons = `
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-primary btn-submit-proof" data-id="${task._id}" style="padding: 6px 12px; font-size: 0.8rem;">
            <i class="fas fa-file-upload"></i> ${uploadBtnText}
          </button>
          ${viewBtn}
          <button class="btn btn-secondary btn-edit-task" data-id="${task._id}" style="padding: 6px 12px; font-size: 0.8rem; color: var(--color-warning); border-color: rgba(245,158,11,0.3);">
            <i class="fas fa-edit"></i> Edit Task
          </button>
          <button class="btn btn-secondary btn-delete-task" data-id="${task._id}" style="padding: 6px 12px; font-size: 0.8rem; color: var(--color-error); border-color: rgba(239,68,68,0.3);">
            <i class="fas fa-trash-alt"></i> Delete
          </button>
        </div>
      `;
    } else {
      // Locked state (After Audited: Approved or Rejected)
      if (task.status === 'approved') {
        actionButtons = `
          <button class="btn btn-secondary btn-view-proof" data-id="${task._id}" style="padding: 6px 12px; font-size: 0.8rem;">
            <i class="fas fa-images"></i> View Proofs Gallery (${task.proofImages ? task.proofImages.length : 0})
          </button>
        `;
      } else if (task.status === 'rejected') {
        // Block edits but allow uploader to re-submit proof to fix it
        actionButtons = `
          <button class="btn btn-primary btn-submit-proof" data-id="${task._id}" style="padding: 6px 12px; font-size: 0.8rem;">
            <i class="fas fa-file-upload"></i> Re-submit Proof
          </button>
        `;
      }
    }

    let feedbackSection = '';
    if (task.feedback) {
      const feedbackClass = task.status === 'rejected' ? 'rejected' : 'approved';
      feedbackSection = `
        <div class="task-feedback-box ${feedbackClass}">
          <div class="feedback-label">Teacher Feedback:</div>
          <div style="font-style: italic;">"${escapeHtml(task.feedback)}"</div>
        </div>
      `;
    }

    return `
      <div class="task-card glass-panel">
        <div class="task-card-header">
          <div>
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-assignee">Assigned to: <strong>${escapeHtml(task.teacher.name)}</strong></div>
          </div>
          <span class="task-status-pill ${task.status}">${task.status}</span>
        </div>
        
        ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
        
        ${feedbackSection}

        <div class="task-footer">
          <span>Created on ${formattedDate}</span>
          ${actionButtons}
        </div>
      </div>
    `;
  }).join('');

  // Dynamically attach event listeners to rendered buttons to bypass HTML onclick scoping
  bindDynamicTaskEvents();
}

// Bind dynamic event listeners
function bindDynamicTaskEvents() {
  const container = document.getElementById('tasksContainer');

  // Submit Proof
  container.querySelectorAll('.btn-submit-proof').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openProofModal(id);
    });
  });

  // View Proof Gallery
  container.querySelectorAll('.btn-view-proof').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openViewProofModal(id);
    });
  });

  // Edit Task Details
  container.querySelectorAll('.btn-edit-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openEditModal(id);
    });
  });

  // Delete Task
  container.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      handleDeleteTask(id);
    });
  });
}

// Handle task creation
async function handleCreateTask(e) {
  e.preventDefault();
  const title = document.getElementById('taskTitle').value.trim();
  const description = document.getElementById('taskDesc').value.trim();
  const teacher = document.getElementById('taskTeacher').value;

  if (!title || !teacher) {
    return showNotification('Title and Teacher fields are required', 'warning');
  }

  try {
    const response = await apiFetch('/tasks', {
      method: 'POST',
      body: { title, description, teacher }
    });

    if (response.success) {
      showNotification('Task created successfully!', 'success');
      document.getElementById('createTaskForm').reset();
      loadTasks();
    }
  } catch (err) {
    showNotification(err.message || 'Failed to create task', 'error');
  }
}

// Handle Task Editing
async function handleEditTask(e) {
  e.preventDefault();
  const taskId = document.getElementById('editTaskId').value;
  const title = document.getElementById('editTaskTitle').value.trim();
  const description = document.getElementById('editTaskDesc').value.trim();
  const teacher = document.getElementById('editTaskTeacher').value;

  if (!title || !teacher) {
    return showNotification('Title and Teacher are required fields', 'warning');
  }

  try {
    const response = await apiFetch(`/tasks/${taskId}`, {
      method: 'PUT',
      body: { title, description, teacher }
    });

    if (response.success) {
      showNotification('Task details updated successfully!', 'success');
      closeEditModal();
      loadTasks();
    }
  } catch (err) {
    showNotification(err.message || 'Failed to edit task', 'error');
  }
}

// Handle Task Deletion
async function handleDeleteTask(taskId) {
  const task = allTasks.find(t => t._id === taskId);
  if (!task) return;

  if (!confirm(`Are you sure you want to delete the task: "${task.title}"?\nThis action cannot be undone.`)) {
    return;
  }

  try {
    const response = await apiFetch(`/tasks/${taskId}`, {
      method: 'DELETE'
    });

    if (response.success) {
      showNotification('Task deleted successfully', 'info');
      loadTasks();
    }
  } catch (err) {
    showNotification(err.message || 'Failed to delete task', 'error');
  }
}

// Modal open/close helpers
function openProofModal(taskId) {
  const task = allTasks.find(t => t._id === taskId);
  if (!task) return;

  document.getElementById('proofTaskId').value = taskId;
  document.getElementById('modalTaskTitle').textContent = `Verification Proof: ${task.title}`;
  
  resetDropzone();
  
  const modal = document.getElementById('proofModal');
  if (modal) modal.classList.add('active');
}

function closeProofModal() {
  document.getElementById('proofModal').classList.remove('active');
  document.getElementById('proofUploadForm').reset();
}

function openEditModal(taskId) {
  const task = allTasks.find(t => t._id === taskId);
  if (!task) return;

  document.getElementById('editTaskId').value = taskId;
  document.getElementById('editTaskTitle').value = task.title;
  document.getElementById('editTaskDesc').value = task.description || '';
  document.getElementById('editTaskTeacher').value = task.teacher._id || task.teacher;

  const modal = document.getElementById('editTaskModal');
  if (modal) modal.classList.add('active');
}

function closeEditModal() {
  document.getElementById('editTaskModal').classList.remove('active');
  document.getElementById('editTaskForm').reset();
}

// Open Multi-Proof Gallery Viewer
function openViewProofModal(taskId) {
  const task = allTasks.find(t => t._id === taskId);
  if (!task || !task.proofImages || task.proofImages.length === 0) {
    showNotification('No photos uploaded for this task', 'warning');
    return;
  }

  const grid = document.getElementById('viewerImagesGrid');
  grid.innerHTML = task.proofImages.map(img => {
    const isAudited = task.status === 'approved' || task.status === 'rejected';
    const removeButtonHtml = !isAudited 
      ? `<button class="btn-remove-proof-img" data-task-id="${task._id}" data-img-id="${img._id}" style="position: absolute; bottom: 4px; left: 4px; background: rgba(239, 68, 68, 0.85); padding: 4px; border-radius: 50%; color: white; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; border: none; cursor: pointer;" title="Remove Photo">
           <i class="fas fa-trash-alt"></i>
         </button>`
      : '';

    return `
      <div style="position: relative; border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color); background: #000; height: 110px;">
        <img src="${img.url}" alt="Task verification proof" style="width: 100%; height: 100%; object-fit: cover;">
        ${removeButtonHtml}
        <button class="btn-fullview-proof-img" data-url="${img.url}" style="position: absolute; bottom: 4px; right: 4px; background: rgba(0, 0, 0, 0.6); padding: 4px; border-radius: 50%; color: white; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; border: none; cursor: pointer;" title="View Fullsize">
          <i class="fas fa-expand-alt"></i>
        </button>
      </div>
    `;
  }).join('');

  // Dynamically attach listeners to gallery elements
  grid.querySelectorAll('.btn-fullview-proof-img').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = e.currentTarget.getAttribute('data-url');
      openFullImage(url);
    });
  });

  grid.querySelectorAll('.btn-remove-proof-img').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskId = e.currentTarget.getAttribute('data-task-id');
      const imgId = e.currentTarget.getAttribute('data-img-id');
      handleRemoveProofImage(taskId, imgId);
    });
  });

  document.getElementById('viewProofModal').classList.add('active');
}

function closeViewProofModal() {
  document.getElementById('viewProofModal').classList.remove('active');
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

// Handle removing a single image from task proofs
async function handleRemoveProofImage(taskId, imgId) {
  if (!confirm('Are you sure you want to delete this photo proof?\nThis will remove it immediately.')) {
    return;
  }

  try {
    const response = await apiFetch(`/tasks/${taskId}/proof/${imgId}`, {
      method: 'DELETE'
    });

    if (response.success) {
      showNotification('Photo proof removed successfully!', 'info');
      closeViewProofModal(); // Close modal to refresh tasks state
      loadTasks();
    }
  } catch (err) {
    showNotification(err.message || 'Failed to remove proof photo', 'error');
  }
}

// File dropzone events
function triggerFileInput() {
  document.getElementById('proofFileInput').click();
}

// File selection handler
function handleFileSelect(event) {
  const files = event.target.files;
  showPreviews(files);
}

// Preview multiple uploaded files
function showPreviews(files) {
  const container = document.getElementById('imagePreviewContainer');
  container.innerHTML = ''; // Clear previous selections

  if (!files || files.length === 0) {
    resetDropzone();
    return;
  }

  const fileCount = Math.min(files.length, 5); // Limit previews to 5
  let loadedCount = 0;

  for (let i = 0; i < fileCount; i++) {
    const file = files[i];
    const reader = new FileReader();

    reader.onload = function(e) {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'file-preview-thumbnail';
      img.style.cssText = `
        width: 80px; 
        height: 80px; 
        object-fit: cover; 
        border-radius: 4px; 
        border: 1px solid var(--border-color);
        display: block;
      `;
      container.appendChild(img);

      loadedCount++;
      if (loadedCount === fileCount) {
        document.getElementById('dropzoneText').innerHTML = `<strong>${files.length} photo(s) selected</strong> <span style="font-size:0.8rem; display:block; margin-top:2px;">(Click to change selection)</span>`;
        document.getElementById('dropzone').style.borderColor = 'var(--color-success)';
      }
    };
    reader.readAsDataURL(file);
  }
}

function resetDropzone() {
  document.getElementById('imagePreviewContainer').innerHTML = '';
  document.getElementById('dropzoneText').innerHTML = 'Drag & drop your photo proofs here, or click to browse';
  document.getElementById('dropzone').style.borderColor = 'var(--border-color)';
}

function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('proofFileInput');

  if (!dropzone || !fileInput) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener('dragenter', (e) => e.preventDefault(), false);
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      fileInput.files = files;
      showPreviews(files);
    }
  }, false);
}

// Handle upload proof API action for multiple uploads
async function handleUploadProof(e) {
  e.preventDefault();
  const taskId = document.getElementById('proofTaskId').value;
  const fileInput = document.getElementById('proofFileInput');
  
  if (!fileInput.files || fileInput.files.length === 0) {
    return showNotification('Please select or drag at least one image file', 'warning');
  }

  if (fileInput.files.length > 5) {
    return showNotification('You can upload a maximum of 5 photos as proof', 'warning');
  }

  const formData = new FormData();
  // Append multiple files to the same key 'proofs'
  for (let i = 0; i < fileInput.files.length; i++) {
    formData.append('proofs', fileInput.files[i]);
  }

  const submitBtn = document.getElementById('btnUploadSubmit');
  const originalHtml = submitBtn.innerHTML;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    const response = await apiFetch(`/tasks/${taskId}/submit`, {
      method: 'POST',
      body: formData
    });

    if (response.success) {
      showNotification('Verification proof photos uploaded successfully!', 'success');
      closeProofModal();
      loadTasks();
    }
  } catch (err) {
    showNotification(err.message || 'Upload failed', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
  }
}

// HTML escape helper
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

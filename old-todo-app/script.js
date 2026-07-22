// Todo List Application JavaScript

class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.editingId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.renderTodos();
        this.updateStats();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.clearAllBtn = document.getElementById('clearAll');
        
        // Stats elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
    }

    bindEvents() {
        // Add todo
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Action buttons
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        // Input focus
        this.todoInput.addEventListener('focus', () => {
            this.todoInput.style.borderColor = '#667eea';
        });
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        this.todoInput.value = '';
        this.todoInput.focus();

        // Show success message
        this.showNotification('Task added successfully!', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        this.editingId = id;
        const todoItem = document.querySelector(`[data-id="${id}"]`);
        const todoText = todoItem.querySelector('.todo-text');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = todo.text;
        input.className = 'edit-input';
        input.style.cssText = `
            flex: 1;
            padding: 8px 12px;
            border: 2px solid #667eea;
            border-radius: 6px;
            font-size: 16px;
            margin-right: 15px;
        `;

        const saveBtn = document.createElement('button');
        saveBtn.innerHTML = '<i class="fas fa-save"></i>';
        saveBtn.className = 'action-icon save-icon';
        saveBtn.style.color = '#28a745';

        const cancelBtn = document.createElement('button');
        cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
        cancelBtn.className = 'action-icon cancel-icon';
        cancelBtn.style.color = '#dc3545';

        // Replace text with input
        todoText.replaceWith(input);
        
        // Replace edit button with save/cancel
        const editBtn = todoItem.querySelector('.edit-icon');
        editBtn.replaceWith(saveBtn);
        editBtn.replaceWith(cancelBtn);

        // Focus input
        input.focus();
        input.select();

        // Save functionality
        const saveTodo = () => {
            const newText = input.value.trim();
            if (newText && newText !== todo.text) {
                todo.text = newText;
                this.saveTodos();
                this.showNotification('Task updated successfully!', 'success');
            }
            this.cancelEdit();
        };

        // Cancel functionality
        const cancelEdit = () => {
            this.editingId = null;
            this.renderTodos();
        };

        // Bind events
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveTodo();
            if (e.key === 'Escape') cancelEdit();
        });

        saveBtn.addEventListener('click', saveTodo);
        cancelBtn.addEventListener('click', cancelEdit);
    }

    deleteTodo(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showNotification('Task deleted successfully!', 'info');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderTodos();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'pending':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear!', 'warning');
            return;
        }

        if (confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showNotification(`${completedCount} completed task(s) cleared!`, 'success');
        }
    }

    clearAll() {
        if (this.todos.length === 0) {
            this.showNotification('No tasks to clear!', 'warning');
            return;
        }

        if (confirm(`Are you sure you want to delete all ${this.todos.length} task(s)?`)) {
            this.todos = [];
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showNotification('All tasks cleared!', 'success');
        }
    }

    renderTodos() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.style.display = 'none';
            this.emptyState.style.display = 'block';
            
            // Update empty state message based on filter
            const emptyMessage = this.currentFilter === 'all' 
                ? 'No tasks yet! Add your first task to get started'
                : `No ${this.currentFilter} tasks found!`;
            
            this.emptyState.querySelector('h3').textContent = 
                this.currentFilter === 'all' ? 'No tasks yet!' : `No ${this.currentFilter} tasks!`;
            this.emptyState.querySelector('p').textContent = 
                this.currentFilter === 'all' ? 'Add your first task to get started' : `Try switching to a different filter`;
        } else {
            this.todoList.style.display = 'block';
            this.emptyState.style.display = 'none';
            
            this.todoList.innerHTML = filteredTodos.map(todo => `
                <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                    <input type="checkbox" class="todo-checkbox" 
                           ${todo.completed ? 'checked' : ''} 
                           onchange="todoApp.toggleTodo(${todo.id})">
                    <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                    <div class="todo-actions">
                        <button class="action-icon edit-icon" onclick="todoApp.editTodo(${todo.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon delete-icon" onclick="todoApp.deleteTodo(${todo.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `).join('');
        }
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        this.totalTasksEl.textContent = total;
        this.pendingTasksEl.textContent = pending;
        this.completedTasksEl.textContent = completed;

        // Update stats colors based on values
        this.totalTasksEl.style.color = total > 0 ? '#667eea' : '#6c757d';
        this.pendingTasksEl.style.color = pending > 0 ? '#ffc107' : '#6c757d';
        this.completedTasksEl.style.color = completed > 0 ? '#28a745' : '#6c757d';
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Add slide out animation
        const slideOutStyle = document.createElement('style');
        slideOutStyle.textContent = `
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(slideOutStyle);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'warning': return 'exclamation-triangle';
            case 'error': return 'times-circle';
            default: return 'info-circle';
        }
    }

    getNotificationColor(type) {
        switch (type) {
            case 'success': return '#28a745';
            case 'warning': return '#ffc107';
            case 'error': return '#dc3545';
            default: return '#17a2b8';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
    
    // Add some sample todos if none exist
    if (todoApp.todos.length === 0) {
        const sampleTodos = [
            'Complete project documentation',
            'Review code changes',
            'Plan next sprint',
            'Update dependencies'
        ];
        
        sampleTodos.forEach(text => {
            const todo = {
                id: Date.now() + Math.random(),
                text: text,
                completed: Math.random() > 0.7, // 30% chance of being completed
                createdAt: new Date().toISOString()
            };
            todoApp.todos.push(todo);
        });
        
        todoApp.saveTodos();
        todoApp.renderTodos();
        todoApp.updateStats();
    }
});

// Add some CSS for the edit input
const additionalStyles = `
    .edit-input:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .save-icon:hover {
        background: #d4edda !important;
    }
    
    .cancel-icon:hover {
        background: #f8d7da !important;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllUsers, getAllTasks } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Secure all admin routes using protect & authorize middlewares
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/tasks', getAllTasks);

module.exports = router;

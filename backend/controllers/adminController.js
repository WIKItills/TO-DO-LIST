const User = require('../models/User');
const Task = require('../models/Task');

// @desc    Get system-wide statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const studentsCount = await User.countDocuments({ role: 'student' });
    const teachersCount = await User.countDocuments({ role: 'teacher' });
    const adminsCount = await User.countDocuments({ role: 'admin' });

    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const submittedTasks = await Task.countDocuments({ status: 'submitted' });
    const approvedTasks = await Task.countDocuments({ status: 'approved' });
    const rejectedTasks = await Task.countDocuments({ status: 'rejected' });

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students: studentsCount,
          teachers: teachersCount,
          admins: adminsCount,
        },
        tasks: {
          total: totalTasks,
          pending: pendingTasks,
          submitted: submittedTasks,
          approved: approvedTasks,
          rejected: rejectedTasks,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users in the system (read-only view)
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tasks in the system (read-only view)
// @route   GET /api/admin/tasks
// @access  Private (Admin only)
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('student', 'name email')
      .populate('teacher', 'name email')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllTasks,
};

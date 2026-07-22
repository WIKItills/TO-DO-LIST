const express = require('express');
const router = express.Router();
const {
  createTask,
  getStudentTasks,
  submitTaskProof,
  editTask,
  deleteTask,
  deleteTaskProofImage,
  getTeacherTasks,
  reviewTask,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Student endpoints
router.post('/', protect, authorize('student'), createTask);
router.get('/student', protect, authorize('student'), getStudentTasks);
router.post('/:id/submit', protect, authorize('student'), upload.array('proofs', 5), submitTaskProof);
router.put('/:id', protect, authorize('student'), editTask);
router.delete('/:id', protect, authorize('student'), deleteTask);
router.delete('/:id/proof/:imgId', protect, authorize('student'), deleteTaskProofImage);

// Teacher endpoints
router.get('/teacher', protect, authorize('teacher'), getTeacherTasks);
router.put('/:id/review', protect, authorize('teacher'), reviewTask);

module.exports = router;

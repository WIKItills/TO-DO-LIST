const Task = require('../models/Task');
const User = require('../models/User');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Helper to delete associated task proof images from storage (Cloudinary or local disk)
const deleteOldProofImages = async (proofImages) => {
  if (!proofImages || proofImages.length === 0) return;

  for (const img of proofImages) {
    if (img.publicId && isCloudinaryConfigured) {
      // Cloudinary delete
      try {
        await cloudinary.uploader.destroy(img.publicId);
      } catch (err) {
        console.error('Error deleting old proof from Cloudinary:', err.message);
      }
    } else if (img.url && img.url.startsWith('/uploads/')) {
      // Local disk delete
      try {
        const filename = img.url.replace('/uploads/', '');
        const filepath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } catch (err) {
        console.error('Error deleting old proof from disk:', err.message);
      }
    }
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Student only)
const createTask = async (req, res) => {
  try {
    const { title, description, teacher } = req.body;

    if (!title || !teacher) {
      return res.status(400).json({ success: false, message: 'Please provide task title and assign a teacher' });
    }

    // Verify assigned teacher exists and is actually a teacher
    const assignedTeacher = await User.findById(teacher);
    if (!assignedTeacher || assignedTeacher.role !== 'teacher') {
      return res.status(400).json({ success: false, message: 'Assigned user is not a valid teacher' });
    }

    const task = await Task.create({
      title,
      description,
      student: req.user._id,
      teacher,
      status: 'pending',
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tasks for current student
// @route   GET /api/tasks/student
// @access  Private (Student only)
const getStudentTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ student: req.user._id })
      .populate('teacher', 'name email')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit task photo proofs (Multiple Images)
// @route   POST /api/tasks/:id/submit
// @access  Private (Student only)
const submitTaskProof = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check if the task belongs to this student
    if (task.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to submit proof for this task' });
    }

    // Check if task is already approved or rejected
    if (task.status === 'approved' || task.status === 'rejected') {
      return res.status(400).json({ success: false, message: `Task has already been ${task.status} and cannot be modified` });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one photo proof' });
    }

    // Delete old proof images if we are reselecting/resubmitting
    await deleteOldProofImages(task.proofImages);

    const uploadedImages = [];

    // Loop through uploaded files
    for (const file of req.files) {
      let imageUrl = '';
      let publicId = '';

      if (isCloudinaryConfigured) {
        try {
          const uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: 'task_tracker_proofs',
          });
          imageUrl = uploadResult.secure_url;
          publicId = uploadResult.public_id;

          // Delete local temp file
          fs.unlinkSync(file.path);
        } catch (uploadError) {
          console.error('Cloudinary upload failure, using local fallback:', uploadError);
          imageUrl = `/uploads/${file.filename}`;
        }
      } else {
        imageUrl = `/uploads/${file.filename}`;
      }

      uploadedImages.push({ url: imageUrl, publicId });
    }

    // Update task
    task.status = 'submitted';
    task.proofImages = uploadedImages;
    task.submittedAt = Date.now();

    await task.save();

    res.status(200).json({ success: true, message: 'Proofs submitted successfully', task });
  } catch (error) {
    // If error, try to delete all newly uploaded local files to keep workspace clean
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error('File cleanup error:', err);
          }
        }
      }
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit a task (details only, while pending/submitted)
// @route   PUT /api/tasks/:id
// @access  Private (Student only)
const editTask = async (req, res) => {
  try {
    const { title, description, teacher } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check ownership
    if (task.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this task' });
    }

    // Check status
    if (task.status === 'approved' || task.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Cannot edit task once it is approved or rejected' });
    }

    // Validate assigned teacher if changed
    if (teacher && teacher !== task.teacher.toString()) {
      const assignedTeacher = await User.findById(teacher);
      if (!assignedTeacher || assignedTeacher.role !== 'teacher') {
        return res.status(400).json({ success: false, message: 'Assigned user is not a valid teacher' });
      }
      task.teacher = teacher;
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;

    await task.save();

    res.status(200).json({ success: true, message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a task (while pending/submitted)
// @route   DELETE /api/tasks/:id
// @access  Private (Student only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check ownership
    if (task.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    // Check status
    if (task.status === 'approved' || task.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Cannot delete task once it is approved or rejected' });
    }

    // Clean up uploaded files (delete from disk / Cloudinary)
    await deleteOldProofImages(task.proofImages);

    // Delete task document
    await Task.deleteOne({ _id: task._id });

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete single proof image from task
// @route   DELETE /api/tasks/:id/proof/:imgId
// @access  Private (Student only)
const deleteTaskProofImage = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check ownership
    if (task.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this task' });
    }

    // Check status
    if (task.status === 'approved' || task.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Cannot edit proofs once task is audited' });
    }

    // Find the image inside proofImages
    const targetImage = task.proofImages.find(img => img._id.toString() === req.params.imgId);
    if (!targetImage) {
      return res.status(404).json({ success: false, message: 'Image not found in task proofs' });
    }

    // Delete from storage (Cloudinary or Local disk)
    await deleteOldProofImages([targetImage]);

    // Pull from mongoose array
    task.proofImages = task.proofImages.filter(img => img._id.toString() !== req.params.imgId);

    // If no proof images left, revert task status back to pending
    if (task.proofImages.length === 0) {
      task.status = 'pending';
    }

    await task.save();

    res.status(200).json({ success: true, message: 'Image deleted successfully', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tasks assigned to current teacher
// @route   GET /api/tasks/teacher
// @access  Private (Teacher only)
const getTeacherTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ teacher: req.user._id })
      .populate('student', 'name email')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review (Approve/Reject) task proof
// @route   PUT /api/tasks/:id/review
// @access  Private (Teacher only)
const reviewTask = async (req, res) => {
  try {
    const { status, feedback } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Please provide valid review status (approved or rejected)' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check if this task is assigned to the current teacher
    if (task.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this task' });
    }

    // Check if task has actually been submitted
    if (task.status === 'pending') {
      return res.status(400).json({ success: false, message: 'Cannot review task without submitted photo proof' });
    }

    task.status = status;
    task.feedback = feedback || '';
    task.reviewedAt = Date.now();

    await task.save();

    res.status(200).json({ success: true, message: `Task status updated to ${status}`, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTask,
  getStudentTasks,
  submitTaskProof,
  editTask,
  deleteTask,
  deleteTaskProofImage,
  getTeacherTasks,
  reviewTask,
};

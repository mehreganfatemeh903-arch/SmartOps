const express = require('express');
const Task = require('../models/Task');
const {
  validateCreateTask,
  validateUpdateTask
} = require('../validators/taskValidator');

const router = express.Router();

// ---------------------- GET /api/tasks ----------------------
// Filters: status, priority, q, projectId
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, q, projectId } = req.query;

    const filter = {
      userId: req.user.id
    };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (projectId) {
      filter.projectId = projectId;
    }

    if (q) {
      filter.title = {
        $regex: q,
        $options: 'i'
      };
    }

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// ---------------------- GET /api/tasks/stats ----------------------
router.get('/stats', async (req, res, next) => {
  try {
    const tasks = await Task.find({
      userId: req.user.id
    });

    const now = new Date();

    const total = tasks.length;

    const done = tasks.filter(
      task => task.status === 'done'
    ).length;

    const pending = tasks.filter(
      task => task.status === 'pending'
    ).length;

    const byPriority = {
      low: tasks.filter(
        task => task.priority === 'low'
      ).length,

      medium: tasks.filter(
        task => task.priority === 'medium'
      ).length,

      high: tasks.filter(
        task => task.priority === 'high'
      ).length
    };

    const nearDeadline = tasks.filter(task => {
      if (!task.dueDate) {
        return false;
      }

      if (task.status !== 'pending') {
        return false;
      }

      const dueDate = new Date(task.dueDate);
      const diff = dueDate - now;

      return (
        diff <= 3 * 24 * 60 * 60 * 1000 &&
        diff > 0
      );
    }).length;

    const overdue = tasks.filter(task => {
      if (!task.dueDate) {
        return false;
      }

      if (task.status !== 'pending') {
        return false;
      }

      return new Date(task.dueDate) < now;
    }).length;

    res.json({
      total,
      done,
      pending,
      byPriority,
      nearDeadline,
      overdue
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------- POST /api/tasks ----------------------
router.post(
  '/',
  validateCreateTask,
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        priority,
        dueDate,
        projectId
      } = req.body;

      const newTask = await Task.create({
        userId: req.user.id,
        projectId: projectId || null,
        title,
        description,
        priority,
        dueDate: dueDate || null
      });

      res.status(201).json(newTask);
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------- PUT /api/tasks/:id ----------------------
router.put(
  '/:id',
  validateUpdateTask,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const updated = await Task.findOneAndUpdate(
        {
          _id: id,
          userId: req.user.id
        },
        req.body,
        {
          new: true
        }
      );

      if (!updated) {
        return res.status(404).json({
          error: 'Task not found'
        });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------- DELETE /api/tasks/:id ----------------------
router.delete(
  '/:id',
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const deleted = await Task.findOneAndDelete({
        _id: id,
        userId: req.user.id
      });

      if (!deleted) {
        return res.status(404).json({
          error: 'Task not found'
        });
      }

      res.json({
        success: true
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
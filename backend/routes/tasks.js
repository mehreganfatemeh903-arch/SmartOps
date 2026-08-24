const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');

const {
  validateCreateTask,
  validateUpdateTask
} = require('../validators/taskValidator');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function escapeRegex(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

/*
|--------------------------------------------------------------------------
| Build task filter
|--------------------------------------------------------------------------
|
| User:
|   فقط Taskهای خودش
|
| Admin:
|   تمام Taskها
|
*/

function buildTaskFilter(req, query = {}) {
  const {
    status,
    priority,
    q,
    search,
    projectId,
    project
  } = query;

  const filter = {};

  // کاربران عادی فقط Taskهای خودشان را می‌بینند
  // Admin تمام Taskها را می‌بیند
  if (req.user.role !== 'admin') {
    filter.userId = req.user.id;
  }

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  const selectedProject = projectId || project;

  if (selectedProject) {
    if (!mongoose.Types.ObjectId.isValid(selectedProject)) {
      return {
        error: {
          status: 400,
          message: 'شناسه پروژه نامعتبر است'
        }
      };
    }

    filter.projectId = selectedProject;
  }

  const searchValue = search || q;

  if (searchValue && searchValue.trim()) {
    const safeSearch = escapeRegex(
      searchValue.trim()
    );

    filter.$or = [
      {
        title: {
          $regex: safeSearch,
          $options: 'i'
        }
      },
      {
        description: {
          $regex: safeSearch,
          $options: 'i'
        }
      }
    ];
  }

  return { filter };
}

/*
|--------------------------------------------------------------------------
| GET /api/tasks
|--------------------------------------------------------------------------
*/

router.get('/', async (req, res, next) => {
  try {
    const result = buildTaskFilter(
      req,
      req.query
    );

    if (result.error) {
      return res.status(result.error.status).json({
        error: result.error.message
      });
    }

    const tasks = await Task.find(result.filter)
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/tasks/stats
|--------------------------------------------------------------------------
*/

router.get('/stats', async (req, res, next) => {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : { userId: req.user.id };

    const tasks = await Task.find(filter);

    const now = new Date();

    const total = tasks.length;

    const done = tasks.filter(
      task => task.status === 'done'
    ).length;

    const pending = tasks.filter(
      task => task.status === 'pending'
    ).length;

    const completionPercentage =
      total > 0
        ? Math.round((done / total) * 100)
        : 0;

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

      if (Number.isNaN(dueDate.getTime())) {
        return false;
      }

      const diff = dueDate - now;

      return (
        diff > 0 &&
        diff <= 3 * 24 * 60 * 60 * 1000
      );
    }).length;

    const overdue = tasks.filter(task => {
      if (!task.dueDate) {
        return false;
      }

      if (task.status !== 'pending') {
        return false;
      }

      const dueDate = new Date(task.dueDate);

      if (Number.isNaN(dueDate.getTime())) {
        return false;
      }

      return dueDate < now;
    }).length;

    res.json({
      total,
      done,
      pending,
      completionPercentage,
      byPriority,
      nearDeadline,
      overdue
    });
  } catch (err) {
    next(err);
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/tasks
|--------------------------------------------------------------------------
*/

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

      if (
        projectId &&
        !mongoose.Types.ObjectId.isValid(projectId)
      ) {
        return res.status(400).json({
          error: 'شناسه پروژه نامعتبر است'
        });
      }

      const newTask = await Task.create({
        userId: req.user.id,
        projectId: projectId || null,
        title,
        description: description || '',
        priority: priority || 'medium',
        dueDate: dueDate || null
      });

      const populatedTask =
        await Task.findById(newTask._id)
          .populate('projectId', 'name');

      res.status(201).json(populatedTask);
    } catch (err) {
      next(err);
    }
  }
);

/*
|--------------------------------------------------------------------------
| PUT /api/tasks/:id
|--------------------------------------------------------------------------
*/

router.put(
  '/:id',
  validateUpdateTask,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: 'شناسه تسک نامعتبر است'
        });
      }

      if (
        req.body.projectId &&
        !mongoose.Types.ObjectId.isValid(
          req.body.projectId
        )
      ) {
        return res.status(400).json({
          error: 'شناسه پروژه نامعتبر است'
        });
      }

      const filter = {
        _id: id
      };

      // کاربر عادی فقط Task خودش را ویرایش کند
      // Admin می‌تواند تمام Taskها را ویرایش کند
      if (req.user.role !== 'admin') {
        filter.userId = req.user.id;
      }

      const updated = await Task.findOneAndUpdate(
        filter,
        req.body,
        {
          new: true,
          runValidators: true
        }
      ).populate('projectId', 'name');

      if (!updated) {
        return res.status(404).json({
          error: 'تسک پیدا نشد'
        });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE /api/tasks/:id
|--------------------------------------------------------------------------
*/

router.delete(
  '/:id',
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: 'شناسه تسک نامعتبر است'
        });
      }

      const filter = {
        _id: id
      };

      // کاربر عادی فقط Task خودش را حذف کند
      // Admin می‌تواند تمام Taskها را حذف کند
      if (req.user.role !== 'admin') {
        filter.userId = req.user.id;
      }

      const deleted =
        await Task.findOneAndDelete(filter);

      if (!deleted) {
        return res.status(404).json({
          error: 'تسک پیدا نشد'
        });
      }

      res.json({
        success: true,
        message: 'تسک با موفقیت حذف شد'
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
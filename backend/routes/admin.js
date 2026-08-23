const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

const {
  listUsersQuerySchema,
  taskStatsQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  objectIdParamValidation,
  validateQuery,
  validateBody,
} = require('../validators/adminValidators');

const router = express.Router();

// --------------------------------------------------
// GET /api/admin/overview
// --------------------------------------------------
router.get('/overview', async (req, res, next) => {
  try {
    const [
      usersCount,
      projectsCount,
      tasksCount,
      doneTasksCount,
    ] = await Promise.all([
      User.countDocuments({}),
      Project.countDocuments({}),
      Task.countDocuments({}),
      Task.countDocuments({ status: 'done' }),
    ]);

    const pendingTasksCount = tasksCount - doneTasksCount;

    res.json({
      usersCount,
      projectsCount,
      tasksCount,
      doneTasksCount,
      pendingTasksCount,
    });
  } catch (err) {
    next(err);
  }
});

// --------------------------------------------------
// GET /api/admin/tasks-by-priority
// --------------------------------------------------
router.get(
  '/tasks-by-priority',
  validateQuery(taskStatsQuerySchema),
  async (req, res, next) => {
    try {
      const { from, to } = req.query;

      const match = {};

      if (from || to) {
        match.createdAt = {};

        if (from) {
          match.createdAt.$gte = new Date(from);
        }

        if (to) {
          match.createdAt.$lte = new Date(to);
        }
      }

      const pipeline = [];

      if (Object.keys(match).length > 0) {
        pipeline.push({
          $match: match,
        });
      }

      pipeline.push({
        $group: {
          _id: '$priority',
          count: {
            $sum: 1,
          },
        },
      });

      const result = await Task.aggregate(pipeline);

      const byPriority = {
        low: 0,
        medium: 0,
        high: 0,
      };

      result.forEach((item) => {
        if (item._id) {
          byPriority[item._id] = item.count;
        }
      });

      res.json(byPriority);
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------
// GET /api/admin/users
// --------------------------------------------------
router.get(
  '/users',
  validateQuery(listUsersQuerySchema),
  async (req, res, next) => {
    try {
      const {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      } = req.query;

      const filter = {};

      if (search) {
        filter.$or = [
          {
            name: {
              $regex: search,
              $options: 'i',
            },
          },
          {
            email: {
              $regex: search,
              $options: 'i',
            },
          },
        ];
      }

      const sort = {
        [sortBy]: sortOrder === 'asc' ? 1 : -1,
      };

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(filter, {
          passwordHash: 0,
        })
          .sort(sort)
          .skip(skip)
          .limit(limit),

        User.countDocuments(filter),
      ]);

      res.json({
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------
// PATCH /api/admin/users/:id/role
// --------------------------------------------------
router.patch(
  '/users/:id/role',
  objectIdParamValidation,
  validateBody(updateUserRoleSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await User.findByIdAndUpdate(
        id,
        { role },
        {
          new: true,
          fields: {
            passwordHash: 0,
          },
        }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------
// PATCH /api/admin/users/:id/status
// --------------------------------------------------
router.patch(
  '/users/:id/status',
  objectIdParamValidation,
  validateBody(updateUserStatusSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const user = await User.findByIdAndUpdate(
        id,
        { status },
        {
          new: true,
          fields: {
            passwordHash: 0,
          },
        }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

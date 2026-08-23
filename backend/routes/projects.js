const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const {
  createProjectSchema,
  updateProjectSchema,
  validateObjectIdParam,
  validateBody
} = require('../validators/projectValidator');

const router = express.Router();

// ---------------------- GET /api/projects ----------------------
router.get('/', async (req, res, next) => {
  try {
    const projects = await Project.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// ---------------------- POST /api/projects ----------------------
router.post('/', validateBody(createProjectSchema), async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      userId: req.user.id,
      name,
      description
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// ---------------------- PUT /api/projects/:id ----------------------
router.put(
  '/:id',
  validateObjectIdParam('id'),
  validateBody(updateProjectSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const updated = await Project.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        req.body,
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------- DELETE /api/projects/:id ----------------------
router.delete('/:id', validateObjectIdParam('id'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // حذف تمام تسک‌های مربوط به این پروژه
    await Task.deleteMany({ projectId: id, userId: req.user.id });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
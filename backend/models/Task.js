const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },

    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Project', 
      default: null 
    },

    title: { 
      type: String, 
      required: true, 
      trim: true 
    },

    description: { 
      type: String, 
      default: '' 
    },

    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'medium' 
    },

    status: { 
      type: String, 
      enum: ['pending', 'done'], 
      default: 'pending' 
    },

    dueDate: { 
      type: Date, 
      default: null 
    },

    tags: {
      type: [String],
      default: []
    },

    attachments: {
      type: [String], // مسیر فایل‌ها
      default: []
    }
  },
  { timestamps: true }
);

// ایندکس‌ها برای سرعت جستجو
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ priority: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);

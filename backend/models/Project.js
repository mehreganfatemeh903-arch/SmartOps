const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },

    name: { 
      type: String, 
      required: true,
      trim: true 
    },

    description: { 
      type: String, 
      default: '' 
    }
  },
  { timestamps: true }
);

// ایندکس برای جستجو و سرعت
projectSchema.index({ userId: 1 });
projectSchema.index({ name: 1 });

module.exports = mongoose.model('Project', projectSchema);

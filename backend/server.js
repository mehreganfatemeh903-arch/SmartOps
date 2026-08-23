require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const auth = require('./middleware/auth');
const requireAdmin = require('./middleware/requireAdmin');
const authRouter = require('./routes/auth');
const tasksRouter = require('./routes/tasks');
const projectsRouter = require('./routes/projects');
const adminRouter = require('./routes/admin');
const exportRouter = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';
const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true';

// امنیت پایه HTTP
app.use(helmet());

// محدودیت تلاش برای جلوگیری از حمله brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ۱۵ دقیقه
  max: 20, // حداکثر ۲۰ تلاش در این بازه
  message: { error: 'تعداد تلاش‌های شما بیش از حد مجاز است. لطفاً بعداً دوباره امتحان کنید.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware عمومی
app.use(cors());
app.use(express.json());
app.use(logger);
app.use(express.static(path.join(__dirname, 'public')));

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/projects', auth(), projectsRouter);
app.use('/api/tasks', auth(), tasksRouter);
app.use('/api/admin', auth(), requireAdmin, adminRouter);
app.use('/api/admin/export', auth(), requireAdmin, exportRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SmartOps',
    db: USE_MEMORY_DB ? 'MongoDB (in-memory, temporary)' : 'MongoDB'
  });
});

// Error handler (همیشه آخرین middleware)
app.use(errorHandler);

// نگه‌داشتن reference به سرور memory (برای جلوگیری از garbage collection و خاموش کردن تمیز)
let memoryServer = null;

async function connectDatabase() {
  if (USE_MEMORY_DB) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log('Connected to MongoDB (in-memory, TEMPORARY - data will NOT persist after restart)');
    console.log(`Memory DB URI: ${memoryUri}`);
  } else {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB (SmartOps)');
  }
}

async function startServer() {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`SmartOps server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server due to DB connection error:', err);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
  console.log('Server shut down cleanly');
  process.exit(0);
});

// فقط وقتی فایل مستقیم اجرا بشه سرور واقعی بالا میاد
// (وقتی از تست require میشه، این اجرا نمیشه)
if (require.main === module) {
  startServer();
}

module.exports = { app, connectDatabase, startServer };
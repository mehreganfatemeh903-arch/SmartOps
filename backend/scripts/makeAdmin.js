require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const EMAIL = process.argv[2];

if (!EMAIL) {
  console.error('استفاده: node scripts/makeAdmin.js <email>');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate(
    { email: EMAIL },
    { role: 'admin' },
    { new: true }
  );
  if (!user) {
    console.error('کاربری با این ایمیل پیدا نشد:', EMAIL);
  } else {
    console.log('نقش کاربر به admin تغییر کرد:', user.email, '->', user.role);
  }
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

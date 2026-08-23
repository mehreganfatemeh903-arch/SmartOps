# SmartOps
## سیستم مدیریت و تحلیل عملیات
### Smart Operations Management System

---

## معرفی پروژه

SmartOps یک سیستم Full Stack تحت وب برای مدیریت عملیات، وظایف، پروژه‌ها، کاربران و تحلیل عملکرد سازمانی است.

این پروژه با هدف ایجاد یک محیط یکپارچه برای مدیریت کارها، کنترل پروژه‌ها، گزارش‌گیری مدیریتی و تحلیل وضعیت عملیات طراحی و توسعه داده شده است.

---

# امکانات اصلی سیستم

## مدیریت کاربران

- ثبت نام و ورود کاربران
- احراز هویت امن با JWT
- رمزنگاری رمز عبور با bcrypt
- مدیریت نقش‌ها:
  - Admin
  - User
- کنترل سطح دسترسی کاربران

---

## مدیریت وظایف (Task Management)

- ایجاد Task جدید
- ویرایش و حذف Task
- تغییر وضعیت کارها
- تعیین اولویت وظایف:
  - کم
  - متوسط
  - زیاد
- اتصال Task به Project
- نمایش وضعیت تکمیل عملیات

---

## مدیریت پروژه‌ها

- ایجاد پروژه جدید
- مدیریت پروژه‌ها
- اتصال وظایف به پروژه‌ها
- سازمان‌دهی عملیات بر اساس پروژه

---

# داشبورد تحلیلی

Dashboard شامل:

- تعداد کل کارها
- تعداد کارهای انجام شده
- تعداد کارهای در انتظار
- درصد تکمیل عملیات
- نمودار وضعیت کارها
- نمودار اولویت وظایف

---

# پنل مدیریت (Admin Panel)

امکانات مدیر:

- مشاهده کاربران
- مدیریت نقش کاربران
- مشاهده آمار سیستم
- مدیریت وضعیت کاربران
- مشاهده پروژه‌ها
- گزارش‌گیری مدیریتی

---

# سیستم گزارش‌گیری

## خروجی PDF

- پشتیبانی کامل از زبان فارسی
- راست به چپ RTL
- فونت Vazirmatn
- گزارش جدول‌بندی شده مدیریتی

## خروجی Excel

- خروجی استاندارد Excel
- مناسب تحلیل داده‌ها
- گزارش وظایف و اطلاعات سیستم

---

# معماری پروژه

SmartOps

Frontend:

- React
- Vite
- Axios
- React Router

Backend:

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication

---

# تکنولوژی‌های استفاده شده

## Frontend

- React
- Vite
- Axios
- React Router
- Recharts
- Lucide React


## Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- bcrypt


## Reporting

- PDFKit
- ExcelJS
- Vazirmatn Font
- Persian RTL Rendering

---

# ساختار پروژه

SmartOps

backend:

- routes
- models
- middleware
- config
- validators
- tests
- fonts
- server.js


frontend:

- src


Files:

- README.md
- PROGRESS.md

---

# نصب و اجرا

## Backend

cd backend

npm install

npm start


Backend Server:

http://localhost:5000


## Frontend

cd frontend

npm install

npm run dev


Frontend:

http://localhost:5173

---

# تست‌های انجام شده

- Authentication
- JWT Security
- User/Admin Roles
- Task Management
- Project Management
- Dashboard Analytics
- Admin Panel
- PDF Export
- Excel Export
- Persian RTL PDF
- Permission Control

---

# امنیت سیستم

پیاده‌سازی شده:

- JWT Token Authentication
- Password Hashing
- Role Based Access Control
- Protected Admin Routes
- Secure API Access

---

# وضعیت پروژه

Production Ready

قابلیت‌های اصلی سیستم پیاده‌سازی و تست شده‌اند.

---

# توسعه‌دهنده

SmartOps Project

Full Stack Web Application

Node.js + React + MongoDB
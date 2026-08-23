const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');

const Task = require('../models/Task');

const reshaper = require('arabic-persian-reshaper');
const bidiFactory = require('bidi-js');

const router = express.Router();

// ======================================================
// تنظیمات
// ======================================================

const FONT_PATH = path.join(
  __dirname,
  '..',
  'fonts',
  'Vazirmatn-Regular.ttf'
);

const bidi = bidiFactory();


// ======================================================
// Persian / Arabic RTL Helper
// ======================================================

function prepareRTL(text) {
  if (text === null || text === undefined) {
    return '-';
  }

  text = String(text);

  if (!text.trim()) {
    return '-';
  }

  try {
    // شکل‌دهی حروف فارسی و عربی
    let shaped = reshaper.PersianShaper.convertArabic(text);

    // تعیین ترتیب RTL/LTR
    const embeddingLevels = bidi.getEmbeddingLevels(
      shaped,
      'rtl'
    );

    // پیدا کردن بخش‌هایی که باید برعکس شوند
    const reorderSegments = bidi.getReorderSegments(
      shaped,
      embeddingLevels
    );

    // تبدیل به آرایش بصری مناسب PDFKit
    const chars = Array.from(shaped);

    for (const segment of reorderSegments) {
      const [start, end] = segment;

      let left = start;
      let right = end;

      while (left < right) {
        const temp = chars[left];
        chars[left] = chars[right];
        chars[right] = temp;

        left++;
        right--;
      }
    }

    return chars.join('');
  } catch (error) {
    console.error('RTL text processing error:', error);
    return text;
  }
}


// ======================================================
// PDF Export
// ======================================================

router.get('/pdf', async (req, res, next) => {
  try {
    const tasks = await Task.find({})
      .populate('userId', 'email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    const doc = new PDFDocument({
      margin: 40,
      size: 'A4'
    });

    // -----------------------------------------------
    // Headers
    // -----------------------------------------------

    res.setHeader(
      'Content-Type',
      'application/pdf'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="smartops-report.pdf"'
    );

    // -----------------------------------------------
    // Register Persian font
    // -----------------------------------------------

    doc.registerFont(
      'Vazirmatn',
      FONT_PATH
    );

    doc.font('Vazirmatn');

    // شروع خروجی
    doc.pipe(res);

    // -----------------------------------------------
    // عنوان گزارش
    // -----------------------------------------------

    doc
      .fontSize(22)
      .text(
        prepareRTL('گزارش سیستم SmartOps'),
        {
          align: 'right'
        }
      );

    doc.moveDown();

    // -----------------------------------------------
    // تاریخ تولید
    // -----------------------------------------------

    doc
      .fontSize(11)
      .text(
        prepareRTL(
          `تاریخ تولید گزارش: ${new Date().toLocaleString('fa-IR')}`
        ),
        {
          align: 'right'
        }
      );

    doc.moveDown(2);

    // -----------------------------------------------
    // تعداد تسک‌ها
    // -----------------------------------------------

    doc
      .fontSize(13)
      .text(
        prepareRTL(`تعداد کل کارها: ${tasks.length}`),
        {
          align: 'right'
        }
      );

    doc.moveDown();

    // -----------------------------------------------
    // Tasks
    // -----------------------------------------------

    tasks.forEach((task, index) => {

      // جلوگیری از خارج شدن محتوا از صفحه
      if (doc.y > 700) {
        doc.addPage();
        doc.font('Vazirmatn');
      }

      doc
        .fontSize(15)
        .text(
          prepareRTL(
            `${index + 1}. ${task.title || '-'}`
          ),
          {
            align: 'right'
          }
        );

      doc
        .fontSize(11)
        .text(
          prepareRTL(
            `کاربر: ${task.userId?.email || '-'}`
          ),
          {
            align: 'right'
          }
        );

      doc.text(
        prepareRTL(
          `پروژه: ${task.projectId?.name || '-'}`
        ),
        {
          align: 'right'
        }
      );

      doc.text(
        prepareRTL(
          `اولویت: ${task.priority || '-'}`
        ),
        {
          align: 'right'
        }
      );

      doc.text(
        prepareRTL(
          `وضعیت: ${task.status || '-'}`
        ),
        {
          align: 'right'
        }
      );

      doc.text(
        prepareRTL(
          `تاریخ ایجاد: ${
            task.createdAt
              ? new Date(task.createdAt).toLocaleString('fa-IR')
              : '-'
          }`
        ),
        {
          align: 'right'
        }
      );

      doc.moveDown(1.5);

      // خط جداکننده
      doc
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .stroke();

      doc.moveDown(1);
    });

    // -----------------------------------------------
    // پایان PDF
    // -----------------------------------------------

    doc.end();

  } catch (err) {
    console.error('PDF export error:', err);
    next(err);
  }
});


// ======================================================
// Excel Export
// ======================================================

router.get('/excel', async (req, res, next) => {
  try {

    const tasks = await Task.find({})
      .populate('userId', 'email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'SmartOps';
    workbook.lastModifiedBy = 'SmartOps';
    workbook.created = new Date();
    workbook.modified = new Date();

    // -----------------------------------------------
    // Worksheet
    // -----------------------------------------------

    const sheet = workbook.addWorksheet(
      'گزارش SmartOps',
      {
        views: [
          {
            rightToLeft: true,
            showGridLines: false,
            zoomScale: 90
          }
        ]
      }
    );

    // -----------------------------------------------
    // Columns
    // -----------------------------------------------

    sheet.columns = [
      {
        header: 'عنوان',
        key: 'title',
        width: 35
      },
      {
        header: 'کاربر',
        key: 'user',
        width: 30
      },
      {
        header: 'پروژه',
        key: 'project',
        width: 30
      },
      {
        header: 'اولویت',
        key: 'priority',
        width: 15
      },
      {
        header: 'وضعیت',
        key: 'status',
        width: 18
      },
      {
        header: 'تاریخ ایجاد',
        key: 'date',
        width: 25
      }
    ];

    // -----------------------------------------------
    // Header Style
    // -----------------------------------------------

    const headerRow = sheet.getRow(1);

    headerRow.height = 28;

    headerRow.eachCell((cell) => {

      cell.font = {
        name: 'Arial',
        size: 12,
        bold: true
      };

      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        readingOrder: 'rtl'
      };

      cell.border = {
        top: {
          style: 'thin'
        },
        left: {
          style: 'thin'
        },
        bottom: {
          style: 'thin'
        },
        right: {
          style: 'thin'
        }
      };
    });

    // -----------------------------------------------
    // Data
    // -----------------------------------------------

    tasks.forEach((task) => {

      const row = sheet.addRow({
        title: task.title || '-',

        user:
          task.userId?.email ||
          '-',

        project:
          task.projectId?.name ||
          '-',

        priority:
          task.priority ||
          '-',

        status:
          task.status ||
          '-',

        date:
          task.createdAt
            ? new Date(task.createdAt)
            : null
      });

      row.height = 24;

      row.eachCell((cell) => {

        cell.alignment = {
          horizontal: 'right',
          vertical: 'middle',
          wrapText: true,
          readingOrder: 'rtl'
        };

        cell.font = {
          name: 'Arial',
          size: 11
        };

        cell.border = {
          top: {
            style: 'thin'
          },
          left: {
            style: 'thin'
          },
          bottom: {
            style: 'thin'
          },
          right: {
            style: 'thin'
          }
        };
      });

      // تاریخ به صورت واقعی Excel
      const dateCell = row.getCell('date');

      if (task.createdAt) {
        dateCell.numFmt = 'yyyy-mm-dd hh:mm';
      }
    });

    // -----------------------------------------------
    // Freeze Header
    // -----------------------------------------------

    sheet.views = [
      {
        state: 'frozen',
        ySplit: 1,
        rightToLeft: true,
        showGridLines: false,
        zoomScale: 90
      }
    ];

    // -----------------------------------------------
    // Auto Filter
    // -----------------------------------------------

    sheet.autoFilter = {
      from: 'A1',
      to: 'F1'
    };

    // -----------------------------------------------
    // Page Setup
    // -----------------------------------------------

    sheet.pageSetup = {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };

    // -----------------------------------------------
    // Excel Headers
    // -----------------------------------------------

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="smartops-report.xlsx"'
    );

    // -----------------------------------------------
    // Write
    // -----------------------------------------------

    await workbook.xlsx.write(res);

    res.end();

  } catch (err) {
    console.error('Excel export error:', err);
    next(err);
  }
});


module.exports = router;
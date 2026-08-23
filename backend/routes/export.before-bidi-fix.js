const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');

const Task = require('../models/Task');

const reshaper = require('arabic-persian-reshaper');

const router = express.Router();

// ======================================================
// Configuration
// ======================================================

const FONT_PATH = path.join(
  __dirname,
  '..',
  'fonts',
  'Vazirmatn-Regular.ttf'
);

// ======================================================
// Persian / RTL Helpers
// ======================================================

function isPersianLetter(ch) {
  const code = ch.codePointAt(0);
  if (!code) return false;
  // Arabic-Indic digits (٠-٩) و Persian digits (۰-۹) را حروف حساب نکن
  if (code >= 0x0660 && code <= 0x0669) return false;
  if (code >= 0x06f0 && code <= 0x06f9) return false;
  // علائم نگارشی رایج فارسی (، ؛ ؟) را هم حرف حساب نکن
  if (code === 0x060c || code === 0x061b || code === 0x061f) return false;
  return code >= 0x0600 && code <= 0x06ff;
}

function containsPersian(text) {
  return /[\u0600-\u06FF]/.test(String(text));
}

/**
 * متن را به run های همگن (فارسی / غیر فارسی) می‌شکند.
 * غیر فارسی شامل: اعداد، لاتین، ایمیل، فاصله، علائم نگارشی
 */
function splitIntoRuns(text) {
  const runs = [];
  let current = '';
  let currentIsPersian = null;

  for (const ch of text) {
    const isPersian = isPersianLetter(ch);
    const isSpace = /\s/.test(ch);
    const isAttachChar = isSpace || ch === ':';

    if (currentIsPersian === null) {
      current = ch;
      currentIsPersian = isAttachChar ? null : isPersian;
      continue;
    }

    if (isAttachChar) {
      // فاصله و دونقطه را به run فعلی می‌چسبانیم تا مثلاً "کاربر:"
      // از کلمه‌ی فارسی قبل از خودش جدا نیفتد
      current += ch;
      continue;
    }

    if (isPersian === currentIsPersian) {
      current += ch;
    } else {
      runs.push({ text: current, isPersian: currentIsPersian });
      current = ch;
      currentIsPersian = isPersian;
    }
  }

  if (current) {
    runs.push({ text: current, isPersian: currentIsPersian });
  }

  return runs;
}

function reshapeToken(token) {
  try {
    return reshaper.PersianShaper.convertArabic(token);
  } catch (error) {
    console.error('Persian shaping error:', error);
    return token;
  }
}

/**
 * کتابخانه‌ی reshaper وقتی کل یک جمله‌ی چند کلمه‌ای (با فاصله) یکجا
 * بهش داده بشه، فاصله‌ی بین کلمات را درست حفظ نمی‌کند و کلمات به‌هم
 * می‌چسبند. برای رفع این مشکل، هر run فارسی را ابتدا به کلمات
 * می‌شکنیم، هر کلمه را جداگانه reshape+reverse می‌کنیم و بعد با
 * فاصله دوباره کنار هم می‌گذاریم (ترتیب کلمات هم برعکس می‌شود چون
 * جهت خواندن RTL است).
 */
function reshapeAndReversePersianRun(run) {
  const words = run.split(' ');

  const processedWords = words.map((word) => {
    if (!word) {
      return word;
    }

    const reshaped = reshapeToken(word);
    return reshaped.split('').reverse().join('');
  });

  return processedWords.reverse().join(' ');
}

/**
 * PDFKit به صورت Native موتور RTL کامل ندارد.
 *
 * برای متن فارسی (خالص یا ترکیبی با انگلیسی/اعداد):
 * 1. متن را به run های همگن (فارسی / غیرفارسی) می‌شکنیم.
 * 2. run های فارسی را reshape کرده و ترتیب کاراکترهایشان را
 *    از logical order به visual order برمی‌گردانیم (reverse).
 * 3. run های غیرفارسی (اعداد، ایمیل، لاتین) دست‌نخورده می‌مانند
 *    چون ترتیب طبیعی خودشان باید حفظ شود.
 * 4. ترتیب کلی run ها را برعکس می‌کنیم تا در PDFKit که فقط
 *    چپ‌به‌راست رسم می‌کند، جریان بصری RTL درست نمایش داده شود.
 *
 * این تابع جایگزین توابع قدیمی preparePersian و prepareMixedText
 * شده و برای هر دو حالت (متن خالص فارسی و متن ترکیبی) استفاده می‌شود.
 */
function prepareBidiText(text) {
  if (text === null || text === undefined) {
    return '-';
  }

  const value = String(text);

  if (!value.trim()) {
    return '-';
  }

  if (!containsPersian(value)) {
    return value;
  }

  try {
    const runs = splitIntoRuns(value);

    const processedRuns = runs.map((run) => {
      if (run.isPersian) {
        return reshapeAndReversePersianRun(run.text);
      }

      return run.text;
    });

    return processedRuns.reverse().join('');
  } catch (error) {
    console.error('Bidi processing error:', error);
    return value;
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
      .sort({
        createdAt: -1
      });

    // --------------------------------------------------
    // PDF
    // --------------------------------------------------

    const doc = new PDFDocument({
      size: 'A4',
      margin: 45,
      autoFirstPage: true
    });

    // --------------------------------------------------
    // HTTP Headers
    // --------------------------------------------------

    res.setHeader(
      'Content-Type',
      'application/pdf'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="smartops-report.pdf"'
    );

    // --------------------------------------------------
    // Font
    // --------------------------------------------------

    doc.registerFont(
      'Vazirmatn',
      FONT_PATH
    );

    doc.font('Vazirmatn');

    doc.pipe(res);

    // ==================================================
    // Header
    // ==================================================

    doc
      .font('Vazirmatn')
      .fontSize(21)
      .text(
        prepareBidiText(
          'گزارش سیستم'
        ),
        45,
        50,
        {
          width: 505,
          align: 'right',
          lineGap: 4
        }
      );

    // SmartOps جداگانه تا LTR خراب نشود
    doc
      .font('Vazirmatn')
      .fontSize(21)
      .text(
        'SmartOps',
        45,
        78,
        {
          width: 505,
          align: 'right'
        }
      );

    doc.moveDown(1.5);

    // ==================================================
    // Report Date
    // ==================================================

    const reportDate =
      new Date().toLocaleString(
        'fa-IR'
      );

    doc
      .font('Vazirmatn')
      .fontSize(11)
      .text(
        prepareBidiText(
          `تاریخ تولید گزارش: ${reportDate}`
        ),
        {
          width: 505,
          align: 'right',
          lineGap: 3
        }
      );

    doc.moveDown(1.2);

    // ==================================================
    // Total Tasks
    // ==================================================

    doc
      .font('Vazirmatn')
      .fontSize(13)
      .text(
        prepareBidiText(
          `تعداد کل کارها: ${tasks.length}`
        ),
        {
          width: 505,
          align: 'right',
          lineGap: 3
        }
      );

    doc.moveDown(1);

    // ==================================================
    // Separator
    // ==================================================

    doc
      .moveTo(45, doc.y)
      .lineTo(550, doc.y)
      .lineWidth(0.7)
      .stroke();

    doc.moveDown(1);

    // ==================================================
    // Tasks
    // ==================================================

    tasks.forEach(
      (task, index) => {

        // ------------------------------------------------
        // New page
        // ------------------------------------------------

        if (doc.y > 680) {

          doc.addPage();

          doc.font(
            'Vazirmatn'
          );
        }

        // ------------------------------------------------
        // Task title
        // ------------------------------------------------

        const title =
          task.title || '-';

        doc
          .font('Vazirmatn')
          .fontSize(15)
          .text(
            containsPersian(title)
              ? `${prepareBidiText(title)} .${index + 1}`
              : `${index + 1}. ${title}`,
            {
              width: 505,
              align: 'right',
              lineGap: 4
            }
          );

        doc.moveDown(0.35);

        // ------------------------------------------------
        // User
        // ------------------------------------------------

        const email =
          task.userId?.email || '-';

        doc
          .font('Vazirmatn')
          .fontSize(11)
          .text(
            prepareBidiText(
              `کاربر: ${email}`
            ),
            {
              width: 505,
              align: 'right',
              lineGap: 3
            }
          );

        // ------------------------------------------------
        // Project
        // ------------------------------------------------

        const project =
          task.projectId?.name || '-';

        doc.text(
          prepareBidiText(
            `پروژه: ${project}`
          ),
          {
            width: 505,
            align: 'right',
            lineGap: 3
          }
        );

        // ------------------------------------------------
        // Priority
        // ------------------------------------------------

        const priority =
          task.priority || '-';

        doc.text(
          prepareBidiText(
            `اولویت: ${priority}`
          ),
          {
            width: 505,
            align: 'right',
            lineGap: 3
          }
        );

        // ------------------------------------------------
        // Status
        // ------------------------------------------------

        const status =
          task.status || '-';

        doc.text(
          prepareBidiText(
            `وضعیت: ${status}`
          ),
          {
            width: 505,
            align: 'right',
            lineGap: 3
          }
        );

        // ------------------------------------------------
        // Created Date
        // ------------------------------------------------

        const createdDate =
          task.createdAt
            ? new Date(
                task.createdAt
              ).toLocaleString(
                'fa-IR'
              )
            : '-';

        doc.text(
          prepareBidiText(
            `تاریخ ایجاد: ${createdDate}`
          ),
          {
            width: 505,
            align: 'right',
            lineGap: 3
          }
        );

        doc.moveDown(1);

        // ------------------------------------------------
        // Separator
        // ------------------------------------------------

        doc
          .moveTo(45, doc.y)
          .lineTo(550, doc.y)
          .lineWidth(0.5)
          .stroke();

        doc.moveDown(1);
      }
    );

    // ==================================================
    // End PDF
    // ==================================================

    doc.end();

  } catch (error) {

    console.error(
      'PDF export error:',
      error
    );

    next(error);
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
      .sort({
        createdAt: -1
      });

    const workbook =
      new ExcelJS.Workbook();

    workbook.creator =
      'SmartOps';

    workbook.lastModifiedBy =
      'SmartOps';

    workbook.created =
      new Date();

    workbook.modified =
      new Date();

    // --------------------------------------------------
    // Worksheet
    // --------------------------------------------------

    const sheet =
      workbook.addWorksheet(
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

    // --------------------------------------------------
    // Columns
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Header
    // --------------------------------------------------

    const headerRow =
      sheet.getRow(1);

    headerRow.height = 28;

    headerRow.eachCell(
      (cell) => {

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
      }
    );

    // --------------------------------------------------
    // Data
    // --------------------------------------------------

    tasks.forEach(
      (task) => {

        const row =
          sheet.addRow({

            title:
              task.title || '-',

            user:
              task.userId?.email || '-',

            project:
              task.projectId?.name || '-',

            priority:
              task.priority || '-',

            status:
              task.status || '-',

            date:
              task.createdAt
                ? new Date(
                    task.createdAt
                  )
                : null
          });

        row.height = 24;

        row.eachCell(
          (cell) => {

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
          }
        );

        const dateCell =
          row.getCell('date');

        if (task.createdAt) {

          dateCell.numFmt =
            'yyyy-mm-dd hh:mm';
        }
      }
    );

    // --------------------------------------------------
    // Freeze header
    // --------------------------------------------------

    sheet.views = [
      {
        state: 'frozen',
        ySplit: 1,
        rightToLeft: true,
        showGridLines: false,
        zoomScale: 90
      }
    ];

    // --------------------------------------------------
    // Auto filter
    // --------------------------------------------------

    sheet.autoFilter = {
      from: 'A1',
      to: 'F1'
    };

    // --------------------------------------------------
    // Page setup
    // --------------------------------------------------

    sheet.pageSetup = {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };

    // --------------------------------------------------
    // HTTP headers
    // --------------------------------------------------

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="smartops-report.xlsx"'
    );

    // --------------------------------------------------
    // Write
    // --------------------------------------------------

    await workbook.xlsx.write(res);

    res.end();

  } catch (error) {

    console.error(
      'Excel export error:',
      error
    );

    next(error);
  }
});

// ======================================================
// Export Router
// ======================================================

module.exports = router;
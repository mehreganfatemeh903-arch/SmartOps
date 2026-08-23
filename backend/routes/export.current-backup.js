const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');

const Task = require('../models/Task');

const reshaper = require('arabic-persian-reshaper');
const bidiFactory = require('bidi-js');


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

const bidi = bidiFactory();

// ======================================================
// Text Helpers
// ======================================================

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '-';
  }

  const text = String(value);

  return text.trim() ? text : '-';
}

function containsArabicPersian(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(
    String(text)
  );
}

/**
 * آماده‌سازی متن فارسی برای PDFKit
 *
 * ترتیب صحیح:
 *
 * 1. متن اصلی
 * 2. BiDi
 * 3. Arabic/Persian shaping
 *
 * PDFKit خودش موتور RTL کامل ندارد،
 * بنابراین ابتدا ترتیب بصری متن توسط bidi-js
 * محاسبه می‌شود و سپس حروف فارسی شکل‌دهی می‌شوند.
 */
function prepareBidiText(value) {
  const text = normalizeText(value);

  if (text === '-' || !containsArabicPersian(text)) {
    return text;
  }

  try {
    // 1. اول BiDi روی متن خام
    const embeddingLevels = bidi.getEmbeddingLevels(
      text,
      'rtl'
    );

    const reordered = bidi.getReorderedString(
      text,
      embeddingLevels
    );

    // 2. بعد shaping حروف فارسی
    return reshaper.PersianShaper.convertArabic(
      reordered
    );

  } catch (error) {
    console.error(
      'Persian RTL processing error:',
      error
    );

    return text;
  }
}

// ======================================================
// PDF Text Helper
// ======================================================

function pdfText(
  doc,
  text,
  options = {}
) {
  return doc.text(
    prepareBidiText(text),
    {
      width: 505,
      align: 'right',
      lineGap: 3,
      ...options
    }
  );
}

// ======================================================
// PDF Export
// ======================================================

router.get(
  '/pdf',
  async (req, res, next) => {

    try {

      const tasks =
        await Task.find({})
          .populate(
            'userId',
            'email'
          )
          .populate(
            'projectId',
            'name'
          )
          .sort({
            createdAt: -1
          });

      // --------------------------------------------------
      // PDF Document
      // --------------------------------------------------

      const doc =
        new PDFDocument({
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

      // --------------------------------------------------
      // Pipe PDF to HTTP response
      // --------------------------------------------------

      doc.pipe(res);

      // ==================================================
      // Header
      // ==================================================

      doc
        .font('Vazirmatn')
        .fontSize(21);

      pdfText(
        doc,
        'گزارش سیستم SmartOps',
        {
          lineGap: 4
        }
      );

      doc.moveDown(0.8);

      // ==================================================
      // Report Date
      // ==================================================

      const reportDate =
        new Date().toLocaleString(
          'fa-IR'
        );

      pdfText(
        doc,
        `تاریخ تولید گزارش: ${reportDate}`
      );

      doc.moveDown(1);

      // ==================================================
      // Total Tasks
      // ==================================================

      pdfText(
        doc,
        `تعداد کل کارها: ${tasks.length}`,
        {
          lineGap: 4
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
          // New Page
          // ------------------------------------------------

          if (doc.y > 680) {

            doc.addPage();

            doc
              .font('Vazirmatn')
              .fontSize(11);
          }

          // ------------------------------------------------
          // Task Title
          // ------------------------------------------------

          const title =
            normalizeText(
              task.title
            );

          doc
            .font('Vazirmatn')
            .fontSize(15);

          pdfText(
            doc,
            `${index + 1}. ${title}`,
            {
              lineGap: 4
            }
          );

          doc.moveDown(0.35);

          // ------------------------------------------------
          // User
          // ------------------------------------------------

          const email =
            normalizeText(
              task.userId?.email
            );

          doc.fontSize(11);

          pdfText(
            doc,
            `کاربر: ${email}`
          );

          // ------------------------------------------------
          // Project
          // ------------------------------------------------

          const project =
            normalizeText(
              task.projectId?.name
            );

          pdfText(
            doc,
            `پروژه: ${project}`
          );

          // ------------------------------------------------
          // Priority
          // ------------------------------------------------

          const priority =
            normalizeText(
              task.priority
            );

          pdfText(
            doc,
            `اولویت: ${priority}`
          );

          // ------------------------------------------------
          // Status
          // ------------------------------------------------

          const status =
            normalizeText(
              task.status
            );

          pdfText(
            doc,
            `وضعیت: ${status}`
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

          pdfText(
            doc,
            `تاریخ ایجاد: ${createdDate}`
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
  }
);

// ======================================================
// Excel Export
// ======================================================

router.get(
  '/excel',
  async (req, res, next) => {

    try {

      const tasks =
        await Task.find({})
          .populate(
            'userId',
            'email'
          )
          .populate(
            'projectId',
            'name'
          )
          .sort({
            createdAt: -1
          });

      // --------------------------------------------------
      // Workbook
      // --------------------------------------------------

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
      // Header Style
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
                task.title ||
                '-',

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
      // Freeze Header
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
      // Auto Filter
      // --------------------------------------------------

      sheet.autoFilter = {
        from: 'A1',
        to: 'F1'
      };

      // --------------------------------------------------
      // Page Setup
      // --------------------------------------------------

      sheet.pageSetup = {

        paperSize: 9,

        orientation:
          'landscape',

        fitToPage:
          true,

        fitToWidth:
          1,

        fitToHeight:
          0
      };

      // --------------------------------------------------
      // HTTP Headers
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

      await workbook.xlsx.write(
        res
      );

    } catch (error) {

      console.error(
        'Excel export error:',
        error
      );

      next(error);
    }
  }
);

// ======================================================
// Export Router
// ======================================================

module.exports = router;
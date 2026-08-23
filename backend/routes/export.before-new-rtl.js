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
// Text Helpers
// ======================================================

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '-';
  }

  const text = String(value);

  return text.trim() ? text : '-';
}

// ------------------------------------------------------
// Persian / Arabic character detection
// ------------------------------------------------------

const PERSIAN_REGEX =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB8A-\uFBFF]+/gu;

// ------------------------------------------------------
// Check Persian text
// ------------------------------------------------------

function containsPersian(text) {
  return PERSIAN_REGEX.test(String(text));
}

// ------------------------------------------------------
// Reset regex state
// ------------------------------------------------------

function hasPersian(text) {
  PERSIAN_REGEX.lastIndex = 0;

  return PERSIAN_REGEX.test(
    String(text)
  );
}

// ------------------------------------------------------
// Prepare Persian text for PDFKit
//
// IMPORTANT:
// Do NOT use bidi-js here.
//
// PDFKit does not provide full RTL layout.
// We shape Persian characters and reverse
// only Persian runs.
//
// English / numbers / email / punctuation
// remain untouched.
// ------------------------------------------------------

function preparePersianText(value) {
  const text = normalizeText(value);

  if (
    text === '-' ||
    !hasPersian(text)
  ) {
    return text;
  }

  try {
    // --------------------------------------------------
    // First: Persian / Arabic shaping
    // --------------------------------------------------

    const shaped =
      reshaper.PersianShaper.convertArabic(
        text
      );

    // --------------------------------------------------
    // Second: reverse ONLY Persian/Arabic parts
    //
    // English, numbers, email and punctuation
    // are not modified.
    // --------------------------------------------------

    const result =
      shaped.replace(
        PERSIAN_REGEX,
        (match) => {
          return Array.from(match)
            .reverse()
            .join('');
        }
      );

    return result;

  } catch (error) {
    console.error(
      'Persian PDF text processing error:',
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
    preparePersianText(text),
    {
      width: 505,
      align: 'left',
      lineGap: 3,
      ...options
    }
  );
}

// ======================================================
// Get Tasks
// ======================================================

async function getTasks() {
  return Task.find({})
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
}

// ======================================================
// Draw Separator
// ======================================================

function drawSeparator(doc) {
  doc
    .moveTo(45, doc.y)
    .lineTo(550, doc.y)
    .lineWidth(0.7)
    .stroke();
}

// ======================================================
// PDF Export
// ======================================================

router.get(
  '/pdf',
  async (req, res, next) => {

    try {

      const tasks =
        await getTasks();

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

      doc.font(
        'Vazirmatn'
      );

      // --------------------------------------------------
      // Pipe
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
          lineGap: 5
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

      doc.fontSize(11);

      pdfText(
        doc,
        `تاریخ تولید گزارش: ${reportDate}`
      );

      doc.moveDown(0.8);

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

      drawSeparator(doc);

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

          doc.moveDown(0.4);

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

          drawSeparator(doc);

          doc.moveDown(1);
        }
      );

      // ==================================================
      // Empty State
      // ==================================================

      if (tasks.length === 0) {

        doc.fontSize(12);

        pdfText(
          doc,
          'هیچ کاری برای نمایش وجود ندارد.'
        );
      }

      // ==================================================
      // Finish PDF
      // ==================================================

      doc.end();

    } catch (error) {

      console.error(
        'PDF export error:',
        error
      );

      if (!res.headersSent) {
        return next(error);
      }

      res.end();
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
        await getTasks();

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
      // Write Excel
      // --------------------------------------------------

      await workbook.xlsx.write(
        res
      );

      return res.end();

    } catch (error) {

      console.error(
        'Excel export error:',
        error
      );

      return next(error);
    }
  }
);

// ======================================================
// Export Router
// ======================================================

module.exports = router;
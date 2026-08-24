const express = require('express');
const path = require('path');
const fs = require('fs');

const ExcelJS = require('exceljs');

const Task = require('../models/Task');

const router = express.Router();

const FONT_PATH = path.join(
  __dirname,
  '..',
  'fonts',
  'Vazirmatn-Regular.ttf'
);

const CHROME_PATH =
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';


function normalizeText(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}


function escapeHtml(value) {
  return normalizeText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function formatDate(value) {
  if (!value) {
    return '-';
  }

  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(value));
  } catch (error) {
    return '-';
  }
}


function getFontBase64() {
  if (!fs.existsSync(FONT_PATH)) {
    throw new Error(
      `Vazirmatn font not found: ${FONT_PATH}`
    );
  }

  return fs.readFileSync(FONT_PATH).toString('base64');
}


async function getTasks() {
  return Task.find({})
    .populate('userId', 'email')
    .populate('projectId', 'name')
    .sort({ createdAt: -1 })
    .lean();
}


function buildHtml(tasks, fontBase64) {

  const rows = tasks.map((task, index) => {

    const title = escapeHtml(task.title);

    const user =
      escapeHtml(task.userId?.email || '-');

    const project =
      escapeHtml(task.projectId?.name || '-');

    const priority =
      escapeHtml(task.priority || '-');

    const status =
      escapeHtml(task.status || '-');

    const createdAt =
      escapeHtml(formatDate(task.createdAt));

    return `
      <tr>

        <td class="number-cell">
          ${index + 1}
        </td>

        <td class="title-cell">
          ${title}
        </td>

        <td>
          ${user}
        </td>

        <td>
          ${project}
        </td>

        <td class="english-cell">
          ${priority}
        </td>

        <td class="english-cell">
          ${status}
        </td>

        <td class="date-cell">
          ${createdAt}
        </td>

      </tr>
    `;
  }).join('');


  return `<!DOCTYPE html>

<html lang="fa" dir="rtl">

<head>

<meta charset="UTF-8">

<meta http-equiv="Content-Type"
      content="text/html; charset=UTF-8">

<style>

@font-face {

  font-family: "Vazirmatn";

  src: url(data:font/ttf;base64,${fontBase64})
       format("truetype");

  font-weight: 400;

  font-style: normal;

}


* {
  box-sizing: border-box;
}


html {
  direction: rtl;
}


body {

  margin: 0;

  padding: 0;

  direction: rtl;

  unicode-bidi: plaintext;

  font-family: "Vazirmatn", sans-serif;

  font-size: 11px;

  color: #222;

  background: white;

}


.page {

  width: 100%;

  direction: rtl;

}


.header {

  text-align: center;

  margin-bottom: 25px;

}


.header h1 {

  margin: 0 0 10px 0;

  font-size: 22px;

  font-weight: 700;

  direction: rtl;

}


.header .count {

  font-size: 13px;

  direction: rtl;

}


table {

  width: 100%;

  border-collapse: collapse;

  table-layout: fixed;

  direction: rtl;

  unicode-bidi: isolate;

}


thead {

  display: table-header-group;

}


thead th {

  background: #eeeeee;

  border: 1px solid #999;

  padding: 8px 5px;

  text-align: center;

  vertical-align: middle;

  font-weight: 700;

  direction: rtl;

  unicode-bidi: plaintext;

}


tbody td {

  border: 1px solid #aaa;

  padding: 8px 5px;

  text-align: right;

  vertical-align: middle;

  direction: rtl;

  unicode-bidi: plaintext;

  word-wrap: break-word;

  overflow-wrap: anywhere;

}


.number-cell {

  width: 6%;

  text-align: center !important;

  direction: ltr !important;

  unicode-bidi: isolate !important;

}


.title-cell {

  width: 22%;

  text-align: right !important;

}


.english-cell {

  direction: ltr !important;

  unicode-bidi: isolate !important;

  text-align: center !important;

}


.date-cell {

  width: 17%;

  text-align: center !important;

  direction: rtl;

}


thead th:nth-child(2) {
  width: 22%;
}


thead th:nth-child(3) {
  width: 18%;
}


thead th:nth-child(4) {
  width: 15%;
}


thead th:nth-child(5) {
  width: 9%;
}


thead th:nth-child(6) {
  width: 9%;
}


tr {

  page-break-inside: avoid;

}


.footer {

  margin-top: 20px;

  text-align: center;

  font-size: 9px;

  color: #666;

  direction: rtl;

}


</style>

</head>


<body>

<div class="page">


  <div class="header">

    <h1>
      گزارش سیستم SmartOps
    </h1>

    <div class="count">
      تعداد کل کارها: ${tasks.length}
    </div>

  </div>


  <table>

    <thead>

      <tr>

        <th>
          ردیف
        </th>

        <th>
          عنوان کار
        </th>

        <th>
          کاربر
        </th>

        <th>
          پروژه
        </th>

        <th>
          اولویت
        </th>

        <th>
          وضعیت
        </th>

        <th>
          تاریخ ایجاد
        </th>

      </tr>

    </thead>


    <tbody>

      ${rows}

    </tbody>

  </table>


  <div class="footer">
    SmartOps
  </div>


</div>

</body>

</html>`;
}


router.get('/pdf', async (req, res) => {

  let browser = null;

  try {

    if (!fs.existsSync(CHROME_PATH)) {

      throw new Error(
        `Chrome not found at: ${CHROME_PATH}`
      );

    }


    const tasks = await getTasks();

    const fontBase64 = getFontBase64();

    const html = buildHtml(
      tasks,
      fontBase64
    );
    const puppeteer = await import('puppeteer-core');

    browser = await puppeteer.launch({

      executablePath: CHROME_PATH,

      headless: true,

      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=medium'
      ]

    });


    const page = await browser.newPage();


    await page.setViewport({
      width: 1240,
      height: 1754,
      deviceScaleFactor: 1
    });


    await page.setContent(
      html,
      {
        waitUntil: 'networkidle0'
      }
    );


    await page.evaluate(async () => {

      await document.fonts.ready;

    });


    const pdfBuffer = await page.pdf({

      format: 'A4',

      printBackground: true,

      preferCSSPageSize: true,

      margin: {
        top: '18mm',
        bottom: '18mm',
        left: '12mm',
        right: '12mm'
      }

    });


    res.status(200);

    res.setHeader(
      'Content-Type',
      'application/pdf'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="smartops-report.pdf"'
    );

    res.setHeader(
      'Content-Length',
      pdfBuffer.length
    );

    res.end(pdfBuffer);

  }

  catch (error) {

    console.error(
      'PDF EXPORT ERROR:',
      error
    );


    if (!res.headersSent) {

      res.status(500).json({
        error: error.message
      });

    }

  }

  finally {

    if (browser) {

      try {

        await browser.close();

      }

      catch (closeError) {

        console.error(
          'Chrome close error:',
          closeError
        );

      }

    }

  }

});

router.get('/excel', async (req, res) => {

  try {

    const tasks = await getTasks();

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet('SmartOps Report');

    sheet.views = [
      { rightToLeft: true }
    ];

    sheet.columns = [
      {
        header: 'ردیف',
        key: 'index',
        width: 10
      },
      {
        header: 'عنوان کار',
        key: 'title',
        width: 30
      },
      {
        header: 'کاربر',
        key: 'user',
        width: 25
      },
      {
        header: 'پروژه',
        key: 'project',
        width: 25
      },
      {
        header: 'اولویت',
        key: 'priority',
        width: 15
      },
      {
        header: 'وضعیت',
        key: 'status',
        width: 15
      },
      {
        header: 'تاریخ ایجاد',
        key: 'createdAt',
        width: 25
      }
    ];


    tasks.forEach((task, index) => {

      sheet.addRow({

        index: index + 1,

        title: task.title || '-',

        user:
          task.userId?.email || '-',

        project:
          task.projectId?.name || '-',

        priority:
          task.priority || '-',

        status:
          task.status || '-',

        createdAt:
          formatDate(task.createdAt)

      });

    });


    sheet.getRow(1).font = {
      bold: true
    };


    const buffer =
      await workbook.xlsx.writeBuffer();


    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );


    res.setHeader(
      'Content-Disposition',
      'attachment; filename="smartops-report.xlsx"'
    );


    res.send(buffer);


  }

  catch(error){

    console.error(
      'EXCEL EXPORT ERROR:',
      error
    );

    res.status(500).json({
      error:error.message
    });

  }

});
module.exports = router;
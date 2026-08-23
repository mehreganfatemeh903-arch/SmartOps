const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');

const Task = require('../models/Task');
const reshaper = require('arabic-persian-reshaper');

const router = express.Router();

const FONT_PATH = path.join(
    __dirname,
    '..',
    'fonts',
    'Vazirmatn-Regular.ttf'
);


// -------------------------------
// Text Helpers
// -------------------------------

function normalizeText(value) {

    if (value === null || value === undefined || value === '') {
        return '-';
    }

    return String(value);
}


function containsPersian(text) {

    return /[\u0600-\u06FF]/.test(text);

}


function preparePersianText(text) {

  text = normalizeText(text);

  try {

    const hasPersian = /[\u0600-\u06FF]/.test(text);

    if (!hasPersian) {
      return text;
    }


    const shaped =
      reshaper.PersianShaper.convertArabic(text);


    return shaped
      .split('')
      .reverse()
      .join('');


  } catch(e){

    console.log(e);

    return text;

  }
}



function pdfText(doc, text, size = 11) {

    doc
        .fontSize(size)
        .text(
            preparePersianText(text),
            {
                width: 500,
                align: 'right'
            }
        );

}



async function getTasks() {

    return Task.find({})
        .populate('userId', 'email')
        .populate('projectId', 'name')
        .sort({
            createdAt: -1
        });

}



// -------------------------------
// PDF Export
// -------------------------------

router.get('/pdf', async (req, res) => {

    try {


        const tasks = await getTasks();


        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });



        res.setHeader(
            'Content-Type',
            'application/pdf'
        );


        res.setHeader(
            'Content-Disposition',
            'attachment; filename=smartops-report.pdf'
        );



        doc.registerFont(
            'Vazir',
            FONT_PATH
        );


        doc.font('Vazir');


        doc.pipe(res);



        pdfText(
            doc,
            'گزارش سیستم SmartOps',
            18
        );


        pdfText(
            doc,
            `تعداد کل کارها: ${tasks.length}`,
            12
        );



        tasks.forEach((task, index) => {


            doc.moveDown();


            pdfText(
                doc,
                `${index + 1}. ${task.title}`,
                14
            );


            pdfText(
                doc,
                `کاربر: ${task.userId?.email || '-'}`,
                11
            );


            pdfText(
                doc,
                `پروژه: ${task.projectId?.name || '-'}`,
                11
            );


            pdfText(
                doc,
                `اولویت: ${task.priority || '-'}`,
                11
            );


            pdfText(
                doc,
                `وضعیت: ${task.status || '-'}`,
                11
            );


            pdfText(
                doc,
                `تاریخ ایجاد: ${
                    task.createdAt
                    ? new Date(task.createdAt)
                    .toLocaleString('fa-IR')
                    : '-'
                }`,
                11
            );


            doc.moveDown();


            doc.text(
                '--------------------------------'
            );


        });



        doc.end();


    }
    catch(error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });

    }


});



// -------------------------------
// Excel Export
// -------------------------------

router.get('/excel', async(req,res)=>{

    try {

        const tasks = await getTasks();


        const workbook =
            new ExcelJS.Workbook();


        const sheet =
            workbook.addWorksheet(
                'SmartOps',
                {
                    views:[
                        {
                            rightToLeft:true
                        }
                    ]
                }
            );



        sheet.columns = [

            {
                header:'عنوان',
                key:'title',
                width:30
            },

            {
                header:'کاربر',
                key:'user',
                width:30
            },

            {
                header:'پروژه',
                key:'project',
                width:25
            },

            {
                header:'اولویت',
                key:'priority',
                width:15
            },

            {
                header:'وضعیت',
                key:'status',
                width:15
            }

        ];



        tasks.forEach(task=>{

            sheet.addRow({

                title: task.title || '-',

                user:
                task.userId?.email || '-',

                project:
                task.projectId?.name || '-',

                priority:
                task.priority || '-',

                status:
                task.status || '-'

            });

        });



        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );


        res.setHeader(
            'Content-Disposition',
            'attachment; filename=smartops-report.xlsx'
        );


        await workbook.xlsx.write(res);


        res.end();


    }
    catch(error){

        res.status(500).json({
            error:error.message
        });

    }

});



module.exports = router;
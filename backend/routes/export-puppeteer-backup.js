const express = require("express");
const path = require("path");
const puppeteer = require("puppeteer");

const Task = require("../models/Task");

const router = express.Router();


// ===============================
// Get Tasks
// ===============================

async function getTasks() {

    return Task.find({})
        .populate("userId", "email")
        .populate("projectId", "name")
        .sort({
            createdAt: -1
        });

}



// ===============================
// Persian Date
// ===============================

function formatDate(date) {

    if (!date) return "-";

    return new Date(date)
        .toLocaleString("fa-IR");

}



// ===============================
// PDF Export
// ===============================

router.get("/pdf", async (req, res) => {


    try {


        const tasks = await getTasks();



        let rows = "";


        tasks.forEach((task, index) => {


            rows += `

            <tr>

                <td>${index + 1}</td>

                <td>${task.title || "-"}</td>

                <td>${task.userId?.email || "-"}</td>

                <td>${task.projectId?.name || "-"}</td>

                <td>${task.priority || "-"}</td>

                <td>${task.status || "-"}</td>

                <td>${formatDate(task.createdAt)}</td>

            </tr>

            `;


        });




        const html = `

<!DOCTYPE html>

<html lang="fa" dir="rtl">

<head>

<meta charset="UTF-8">


<style>


@font-face {

font-family: Vazir;

src: url("file://${path.join(
    __dirname,
    "..",
    "fonts",
    "Vazirmatn-Regular.ttf"
)}");

}



body {

font-family: Vazir;

direction: rtl;

text-align: right;

padding:40px;

}



h1 {

text-align:center;

font-size:24px;

}



.info {

margin-bottom:25px;

font-size:14px;

}



table {

width:100%;

border-collapse:collapse;

margin-top:20px;

}



th {

background:#eeeeee;

}



td, th {

border:1px solid #999;

padding:10px;

text-align:center;

}



tr {

page-break-inside:avoid;

}



</style>


</head>



<body>


<h1>
گزارش سیستم SmartOps
</h1>



<div class="info">

تعداد کل کارها:
${tasks.length}

<br>

تاریخ تولید گزارش:
${new Date().toLocaleString("fa-IR")}

</div>



<table>


<thead>

<tr>

<th>ردیف</th>

<th>عنوان</th>

<th>کاربر</th>

<th>پروژه</th>

<th>اولویت</th>

<th>وضعیت</th>

<th>تاریخ ایجاد</th>


</tr>


</thead>


<tbody>


${rows}


</tbody>



</table>


</body>


</html>

`;




        const browser = await puppeteer.launch({

            headless: true,

            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox"
            ]

        });



        const page = await browser.newPage();



        await page.setContent(html, {

            waitUntil: "networkidle0"

        });



        const pdfBuffer = await page.pdf({

            format: "A4",

            printBackground:true,

            margin:{

                top:"30px",

                bottom:"30px",

                left:"30px",

                right:"30px"

            }

        });



        await browser.close();




        res.setHeader(
            "Content-Type",
            "application/pdf"
        );


        res.setHeader(
            "Content-Disposition",
            'attachment; filename="smartops-report.pdf"'
        );


        res.send(pdfBuffer);



    }
    catch(error) {


        console.log("PDF ERROR:", error);


        res.status(500).json({

            error:error.message

        });


    }



});




// ===============================
// Export
// ===============================

module.exports = router;
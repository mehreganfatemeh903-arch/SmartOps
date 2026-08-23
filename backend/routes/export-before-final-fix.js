const express = require("express");
const path = require("path");
const puppeteer = require("puppeteer-core");

const Task = require("../models/Task");

const router = express.Router();


const CHROME_PATH =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";


async function getTasks() {

  return Task.find({})
    .populate("userId", "email")
    .populate("projectId", "name")
    .sort({ createdAt: -1 });

}



function escapeHtml(text) {

  if (!text) return "-";

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}



function createHtml(tasks) {


let rows = "";


tasks.forEach((task,index)=>{


rows += `

<tr>

<td>${index + 1}</td>

<td>${escapeHtml(task.title)}</td>

<td>${escapeHtml(task.userId?.email)}</td>

<td>${escapeHtml(task.projectId?.name)}</td>

<td>${escapeHtml(task.priority)}</td>

<td>${escapeHtml(task.status)}</td>

<td>
${
task.createdAt
?
new Date(task.createdAt)
.toLocaleString("fa-IR")
:
"-"
}
</td>

</tr>

`;

});



return `

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
* {
box-sizing: border-box;
}

html, body {
direction: rtl;
unicode-bidi: plaintext;
}

table {
direction: rtl;
}

td, th {
unicode-bidi: plaintext;
}


* {
box-sizing: border-box;
}


html, body {

direction: rtl;
unicode-bidi: plaintext;

}


table {

direction: rtl;

}


td, th {

unicode-bidi: plaintext;

}


body {

font-family: Vazir, Tahoma;

direction: rtl;

text-align: right;

padding:40px;

}


h1 {

text-align:center;

}


table {

width:100%;

border-collapse:collapse;

margin-top:30px;

}


th {

background:#eeeeee;

}


td,th {

border:1px solid #555;

padding:8px;

text-align:right;

font-size:12px;

}


</style>


</head>


<body>


<h1>
گزارش سیستم SmartOps
</h1>


<h3>
تعداد کل کارها: ${tasks.length}
</h3>


<table>


<thead>

<tr>

<th>ردیف</th>

<th>عنوان کار</th>

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

}




router.get("/pdf", async(req,res)=>{


try {


const tasks = await getTasks();


const html = createHtml(tasks);



const browser = await puppeteer.launch({

headless:true,

executablePath: CHROME_PATH,

args:[

"--no-sandbox",

"--disable-setuid-sandbox"

]

});


const page = await browser.newPage();

await page.setContent(
html,
{
  waitUntil:"networkidle0"
}
);

await page.evaluate(async () => {
  await document.fonts.ready;
});



const pdf = await page.pdf({

format:"A4",

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
"attachment; filename=smartops-report.pdf"
);



res.end(pdf);



}

catch(err){

console.log(err);

res.status(500).json({

error:err.message

});

}



});



module.exports = router;
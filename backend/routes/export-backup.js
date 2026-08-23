const express = require("express");
const PDFDocument = require("pdfkit");
const path = require("path");

const Task = require("../models/Task");
const reshaper = require("arabic-persian-reshaper");

const router = express.Router();


const FONT_PATH = path.join(
  __dirname,
  "..",
  "fonts",
  "Vazirmatn-Regular.ttf"
);



function normalizeText(value){

    if(value === null || value === undefined){
        return "-";
    }

    return String(value);
}



function hasPersian(text){

    return /[\u0600-\u06FF]/.test(text);

}




function preparePersianText(value){

    let text = normalizeText(value);


    if(!hasPersian(text)){
        return text;
    }


    try{


        let words = text.split(" ");


        words = words.map(word=>{

            if(hasPersian(word)){

                let shaped =
                reshaper.PersianShaper.convertArabic(word);


                return shaped
                .split("")
                .reverse()
                .join("");

            }


            return word;

        });



        return words.reverse().join(" ");


    }
    catch(e){

        console.log(e);

        return text;
    }

}




function pdfText(doc,text,size=11){

    doc
    .font("Vazir")
    .fontSize(size)
    .text(
        preparePersianText(text),
        {
            width:500,
            align:"right"
        }
    );

}




async function getTasks(){

    return Task.find({})
    .populate("userId","email")
    .populate("projectId","name")
    .sort({
        createdAt:-1
    });

}




router.get("/pdf",async(req,res)=>{


try{


const tasks = await getTasks();



const doc = new PDFDocument({

    size:"A4",
    margin:50

});



res.setHeader(
"Content-Type",
"application/pdf"
);



res.setHeader(
"Content-Disposition",
"attachment; filename=smartops-report.pdf"
);



doc.registerFont(
"Vazir",
FONT_PATH
);


doc.font("Vazir");


doc.pipe(res);



pdfText(
doc,
"گزارش سیستم SmartOps",
18
);



pdfText(
doc,
`تعداد کل کارها: ${tasks.length}`,
12
);



doc.moveDown();



tasks.forEach((task,index)=>{


pdfText(
doc,
`${index+1}. ${task.title}`,
14
);



pdfText(
doc,
`کاربر: ${task.userId?.email || "-"}`,
11
);



pdfText(
doc,
`پروژه: ${task.projectId?.name || "-"}`,
11
);



pdfText(
doc,
`اولویت: ${task.priority || "-"}`,
11
);



pdfText(
doc,
`وضعیت: ${task.status || "-"}`,
11
);



pdfText(
doc,
`تاریخ ایجاد: ${
task.createdAt ?
new Date(task.createdAt)
.toLocaleString("fa-IR")
:
"-"
}`,
11
);



doc.moveDown();



pdfText(
doc,
"--------------------------------",
10
);



});



doc.end();



}
catch(error){


console.log(error);


res.status(500).json({

error:error.message

});


}



});




module.exports = router;
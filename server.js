const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer");
const XLSX = require("xlsx");
const axios = require("axios");
const path = require("path");
const startReminderEngine = require("./reminderEngine");

const db = require("./database");

const app = express();

/* ================= BASIC CONFIG ================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use(session({
  secret: "notify_secret",
  resave: false,
  saveUninitialized: true
}));

/* ================= FILE UPLOAD ================= */

const upload = multer({ dest: "uploads/" });

/* ================= AUTH MIDDLEWARE ================= */

function auth(req,res,next){
  if(!req.session.user){
    return res.redirect("/login");
  }
  next();
}

/* ================= LOGIN ================= */

app.get("/login",(req,res)=>{
  res.sendFile(path.join(__dirname,"public/login.html"));
});

app.post("/login",async (req,res)=>{

  const { username,password } = req.body;
const admin = await db.getAdmin(username);

  if(!admin){
    return res.send("Invalid login");
  }

  const match = await bcrypt.compare(password,admin.password);

  if(!match){
    return res.send("Invalid password");
  }

  req.session.user = admin;

  res.redirect("/dashboard");

});

/* ================= LOGOUT ================= */

app.get("/logout",(req,res)=>{
  req.session.destroy(()=>{
    res.redirect("/login");
  });
});

/* ================= DASHBOARD ================= */

app.get("/dashboard",auth,(req,res)=>{
  res.sendFile(path.join(__dirname,"public/dashboard.html"));
});

/* ================= STUDENT EXCEL UPLOAD ================= */

app.post("/upload-students",auth,upload.single("file"),(req,res)=>{

  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const data = XLSX.utils.sheet_to_json(sheet);

  data.forEach(row => {

    const name = row.Name || row.name;
    let phone = row.Phone || row.phone;

    if(!phone) return;

    phone = phone.toString().replace(/\D/g,"");

    if(phone.length === 10){
      phone = "91" + phone;
    }

    db.addStudent(name,phone,1);

  });

  res.send("Students uploaded successfully");

});

/* ================= CREATE TASK ================= */

app.post("/create-task",auth,(req,res)=>{

  const { title,description,deadline,priority } = req.body;

  const teacher = req.session.user.id;

  const result = db.createTask(
    title,
    description,
    deadline,
    priority,
    1,
    teacher
  );

  res.json({ success:true, taskId:result.lastInsertRowid });

});

/* ================= TASK LIST ================= */

app.get("/tasks",auth,(req,res)=>{

  const tasks = db.db.prepare(
    "SELECT * FROM tasks ORDER BY deadline ASC"
  ).all();

  res.json(tasks);

});

/* ================= WHATSAPP CONFIG ================= */

const VERIFY_TOKEN = "notify_verify";

const ACCESS_TOKEN = "YOUR_WHATSAPP_TOKEN";

const PHONE_NUMBER_ID = "YOUR_PHONE_ID";

/* ================= SEND WHATSAPP MESSAGE ================= */

async function sendMessage(to,text){

  try{

    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product:"whatsapp",
        to:to,
        type:"text",
        text:{ body:text }
      },
      {
        headers:{
          Authorization:`Bearer ${ACCESS_TOKEN}`,
          "Content-Type":"application/json"
        }
      }
    );

    console.log("Message sent to",to);

  }catch(err){

    console.log("WhatsApp error",err.response?.data);

  }

}

/* ================= WEBHOOK VERIFY ================= */

app.get("/webhook",(req,res)=>{

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if(mode && token === VERIFY_TOKEN){
    res.status(200).send(challenge);
  }
  else{
    res.sendStatus(403);
  }

});

/* ================= RECEIVE WHATSAPP MESSAGE ================= */

app.post("/webhook",async (req,res)=>{

  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if(message){

    const from = message.from;
    const text = message.text?.body?.toLowerCase() || "";

    console.log("User:",from);
    console.log("Message:",text);

    /* find student */

    const student = db.db.prepare(
      "SELECT * FROM students WHERE phone=?"
    ).get(from);

    if(!student){

      await sendMessage(
        from,
        "⚠ You are not registered in Notify system."
      );

      return res.sendStatus(200);

    }

    /* COMMANDS */

    if(text === "hi"){

      await sendMessage(
        from,
`🔔 Notify – Campus Alert

Hello ${student.name}

Type:
MY TASKS
to see pending tasks.`
      );

    }

    else if(text === "my tasks"){

      const tasks = db.getTasksForStudent(student.id);

      if(tasks.length === 0){

        await sendMessage(from,"🎉 No pending tasks");

      }else{

        let msg = "📚 Pending Tasks\n\n";

        tasks.forEach(t=>{
          msg += `${t.id}. ${t.title}\nDeadline: ${t.deadline}\n\n`;
        });

        msg += "Reply DONE <taskid> to mark completed.";

        await sendMessage(from,msg);

      }

    }

    else if(text.startsWith("done")){

      const id = parseInt(text.split(" ")[1]);

      db.markTaskDone(id,student.id);

      await sendMessage(from,"✅ Task marked completed.");

    }

    else{

      await sendMessage(from,"Unknown command.\nType HI");

    }

  }

  res.sendStatus(200);

});

/* ================= SERVER START ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Notify server running on port", PORT);
  startReminderEngine(sendMessage);
});




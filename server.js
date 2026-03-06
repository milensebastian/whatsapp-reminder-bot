const express = require("express");
const session = require("express-session");
const axios = require("axios");
const path = require("path");

const { addReminder, getReminders } = require("./database");
const db = require("./database").db;
const startReminders = require("./reminders");

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "college_secret_key",
  resave: false,
  saveUninitialized: true
}));

/* ================= DASHBOARD ================= */

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public/dashboard.html"));
});

app.post("/add-reminder", (req, res) => {

  const { message, schedule_type, schedule_time } = req.body;

  addReminder(message, schedule_type, schedule_time);

  res.send("Reminder saved!");
});

app.get("/reminders", (req, res) => {
  getReminders((err, rows) => {
    res.json(rows);
  });
});

/* ================= CONFIG ================= */

const VERIFY_TOKEN = "college_bot";

const ACCESS_TOKEN = "EAAsBFZCTSPdkBQ2MXFjbZAYgIPdyArcp6PMvuLEwNplhhvWJmZBOOxjRiL93OB4OhZCZBVMN8qPzU6ImhDRkKlyPyMjERlCjal2gq26P9aZBOg0F2GXnr3DRMAc7OzQsOuKAjhtvAsGxbc4q5qeY9kGWbIL4zqrAKdO8ywEnyryJXrqGmCjZClKqnreefAQhAZDZD";

const PHONE_NUMBER_ID = "1061868540335382";

/* ================= SEND MESSAGE ================= */

async function sendMessage(to, text) {

  try {

    await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: text }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Message sent to", to);

  } catch (err) {

    console.log("Send error:", err.response?.data || err.message);

  }
}

/* ================= VERIFY WEBHOOK ================= */

app.get("/webhook", (req, res) => {

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {

    console.log("Webhook verified");

    res.status(200).send(challenge);

  } else {

    res.sendStatus(403);

  }

});

/* ================= RECEIVE MESSAGES ================= */

app.post("/webhook", async (req, res) => {

  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (message) {

    const from = message.from;
    const text = message.text?.body?.toLowerCase() || "";

    console.log("User:", from);
    console.log("Message:", text);

    /* create default tasks if user new */

    db.get("SELECT phone FROM users WHERE phone=?", [from], (err, row) => {

      if (!row) {

        db.run("INSERT INTO users (phone) VALUES (?)", [from]);

        db.run(
          "INSERT INTO tasks (phone,title,status) VALUES (?,?,?)",
          [from, "DB Assignment", "pending"]
        );

        db.run(
          "INSERT INTO tasks (phone,title,status) VALUES (?,?,?)",
          [from, "Cybersecurity Lab", "pending"]
        );

      }

    });

    /* COMMANDS */

    if (text === "hi") {

      await sendMessage(
        from,
        "Hello 👋 I'm your assignment reminder bot.\nType HELP for commands."
      );

    }

    else if (text === "help") {

      await sendMessage(
        from,
        "Commands:\nTASKS - view tasks\nDONE <id> - mark complete"
      );

    }

    else if (text === "tasks") {

      db.all(
        "SELECT * FROM tasks WHERE phone=? AND status='pending'",
        [from],
        async (err, rows) => {

          let msg = "📚 Your Tasks\n\n";

          rows.forEach(t => {
            msg += `${t.id}. ${t.title}\n`;
          });

          if (rows.length === 0) {
            msg = "All tasks completed 🎉";
          }

          await sendMessage(from, msg);

        }
      );

    }

    else if (text.startsWith("done")) {

      const id = parseInt(text.split(" ")[1]);

      db.run(
        "UPDATE tasks SET status='done' WHERE id=? AND phone=?",
        [id, from],
        async function () {

          if (this.changes > 0) {
            await sendMessage(from, "✅ Task marked completed.");
          } else {
            await sendMessage(from, "Task not found.");
          }

        }
      );

    }

    else {

      await sendMessage(from, "Unknown command. Type HELP.");

    }

  }

  res.sendStatus(200);

});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("Server running on port", PORT);

});
app.get("/logout", (req,res)=>{
req.session.destroy(()=>{
res.redirect("/login");
});
});

/* ================= START REMINDERS ================= */

startReminders(sendMessage);



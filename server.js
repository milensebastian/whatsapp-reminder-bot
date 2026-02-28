const express = require("express");
const axios = require("axios");
const db = require("./database");
const startReminders = require("./reminders");

const app = express();
app.use(express.json());

/* ================= CONFIG ================= */

const VERIFY_TOKEN = "college_bot";
constACCESS_TOKEN = "EAAsBFZCTSPdkBQ85qrAMgYLziuIVCw0CE4yvtWF9rZCZAILfCh32exqs3jZA7BZAd4cXYsNnrcUlyZBJtRU10gsDiBwqf5lWMZBustHrGw2dRBWuOTBKc73wWAN80FuryGbMqgagQqus4RI3GYlUcMrkbcXO1Wj5SQKNdhJ50j6NBSNt3KPDozxvZBxXn0YkZAiMgzPZBZAP7ZBZAVW6GyZBZAySJXpmJPvlrTtHTwe2gc2FUyAE56h9YY39PIxIoxdW06buBZC5Qwh7yvvSZB7sBWT0ke2t4";
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

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

/* ================= START REMINDERS ================= */

startReminders(sendMessage);
const express = require("express");
const axios = require("axios");

const db = require("./database");
const startReminders = require("./reminders");

const app = express();
app.use(express.json());

const ACCESS_TOKEN = process.env.EAAsBFZCTSPdkBQ85qrAMgYLziuIVCw0CE4yvtWF9rZCZAILfCh32exqs3jZA7BZAd4cXYsNnrcUlyZBJtRU10gsDiBwqf5lWMZBustHrGw2dRBWuOTBKc73wWAN80FuryGbMqgagQqus4RI3GYlUcMrkbcXO1Wj5SQKNdhJ50j6NBSNt3KPDozxvZBxXn0YkZAiMgzPZBZAP7ZBZAVW6GyZBZAySJXpmJPvlrTtHTwe2gc2FUyAE56h9YY39PIxIoxdW06buBZC5Qwh7yvvSZB7sBWT0ke2t4;
const PHONE_NUMBER_ID = process.env.1061868540335382;
const VERIFY_TOKEN = "college_bot";

/* health route */

app.get("/", (req, res) => {
  res.send("Bot running");
});

/* webhook verify */

app.get("/webhook", (req, res) => {

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }

});

/* receive events */

app.post("/webhook", (req, res) => {

  console.log("Webhook event received");

  res.sendStatus(200);

});

/* send message */

async function sendMessage(phone, text) {

  try {

    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        text: { body: text }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Message sent to", phone);

  } catch (err) {

    console.log("Send error:", err.response?.data || err.message);

  }

}

/* start server */

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});

/* start reminders */

startReminders(sendMessage);

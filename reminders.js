const db = require("./database");

/*
Start the reminder engine
sendMessage is passed from server.js
*/

function startReminders(sendMessage) {

  console.log("Reminder system started");

  setInterval(() => {

    console.log("Checking pending tasks...");

    db.all(
      "SELECT * FROM tasks WHERE status='pending'",
      [],
      async (err, rows) => {

        if (err) {
          console.error("Database error:", err);
          return;
        }

        if (rows.length === 0) {
          console.log("No pending tasks");
          return;
        }

        for (const task of rows) {

          try {

            console.log("Sending reminder to", task.phone);

            await sendMessage(
              task.phone,
              `⏰ Reminder\n${task.title}`
            );

          } catch (error) {
            console.error("Reminder failed:", error.message);
          }

        }

      }
    );

  }, 60000); // every 2 hours


}

module.exports = startReminders;

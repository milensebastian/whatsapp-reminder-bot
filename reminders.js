const database = require("./database");

function startReminders(sendMessage) {

  console.log("Reminder system started");

  setInterval(() => {

    console.log("Checking pending tasks...");

    database.getPendingTasks(async (err, rows) => {

      if (err) {
        console.error("Database error:", err);
        return;
      }

      if (!rows || rows.length === 0) {
        console.log("No pending tasks");
        return;
      }

      for (const task of rows) {

        try {

          await sendMessage(
            task.phone,
            `⏰ Reminder\n${task.title}`
          );

          console.log("Reminder sent to", task.phone);

        } catch (error) {
          console.log("Send error:", error.message);
        }

      }

    });

  }, 700000); // 1 minute test

}

module.exports = startReminders;


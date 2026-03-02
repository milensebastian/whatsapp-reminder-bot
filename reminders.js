const database = require("./database");

function startReminders(sendMessage) {

  console.log("Reminder system started");

  setInterval(() => {

    console.log("Checking pending tasks...");

    database.getPendingTasks(async (err, rows) => {

      if (err) {
        console.log(err);
        return;
      }

      if (!rows.length) {
        console.log("No pending tasks");
        return;
      }

      for (const task of rows) {

        await sendMessage(
          task.phone,
          `⏰ Reminder\n${task.title}`
        );

        console.log("Reminder sent to", task.phone);

      }

    });

  }, 60000); // 1 minute for testing

}

module.exports = startReminders;

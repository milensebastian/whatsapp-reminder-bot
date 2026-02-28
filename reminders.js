const db = require("./database");

function startReminders(sendMessage) {

  setInterval(() => {

    db.all(
      "SELECT * FROM tasks WHERE status='pending'",
      [],
      async (err, rows) => {

        for (const task of rows) {

          await sendMessage(
            task.phone,
            `⏰ Reminder\n${task.title}`
          );
        }

      }
    );

  }, 7200000); // every 2 hours

}

module.exports = startReminders;
const { getReminders } = require("./database");

function startReminders(sendMessage) {

  console.log("Reminder system started");

  setInterval(() => {

    const now = new Date();

    const currentTime =
      now.getHours().toString().padStart(2,"0") + ":" +
      now.getMinutes().toString().padStart(2,"0");

    getReminders(async (err, rows) => {

      if (err) return;

      rows.forEach(async r => {

        if (r.schedule_time === currentTime) {

          await sendMessage(
            "919645997520",   // student number
            "⏰ Reminder\n" + r.message
          );

          console.log("Reminder sent:", r.message);

        }

      });

    });

  }, 60000); // check every minute
}

module.exports = startReminders;

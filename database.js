const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("tasks.db", (err) => {
  if (err) console.error(err.message);
  else console.log("SQLite database connected");
});

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT,
      schedule_type TEXT,
      schedule_time TEXT
    )
  `);

});

function addReminder(message, type, time) {
  db.run(
    "INSERT INTO reminders (message, schedule_type, schedule_time) VALUES (?, ?, ?)",
    [message, type, time]
  );
}

function getReminders(callback) {
  db.all("SELECT * FROM reminders", [], callback);
}

module.exports = {
  db,
  addReminder,
  getReminders
};
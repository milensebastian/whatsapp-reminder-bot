const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./tasks.db", (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log("SQLite database connected");
  }
});

/* create tables */

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      title TEXT,
      status TEXT
    )
  `);

});

function addTask(phone, title) {

  db.run(
    "INSERT INTO tasks (phone,title,status) VALUES (?,?,?)",
    [phone, title, "pending"]
  );

}

function getPendingTasks(callback) {

  db.all(
    "SELECT * FROM tasks WHERE status='pending'",
    [],
    callback
  );

}

function completeTask(id) {

  db.run(
    "UPDATE tasks SET status='done' WHERE id=?",
    [id]
  );

}

module.exports = {
  addTask,
  getPendingTasks,
  completeTask
};

const sqlite3 = require("sqlite3").verbose();

/*
Create or open database file
*/
const db = new sqlite3.Database("tasks.db", (err) => {
  if (err) {
    console.error("Database error:", err.message);
  } else {
    console.log("SQLite database connected");
  }
});

/*
Create tables
*/
db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      title TEXT,
      status TEXT DEFAULT 'pending'
    )
  `);

});

/*
Add user if not exists
*/
function addUser(phone) {
  db.run(
    "INSERT OR IGNORE INTO users (phone) VALUES (?)",
    [phone]
  );
}

/*
Add task
*/
function addTask(phone, title) {
  db.run(
    "INSERT INTO tasks (phone, title, status) VALUES (?, ?, 'pending')",
    [phone, title]
  );
}

/*
Get pending tasks
*/
function getTasks(phone, callback) {
  db.all(
    "SELECT * FROM tasks WHERE phone=? AND status='pending'",
    [phone],
    callback
  );
}

/*
Mark task completed
*/
function completeTask(id, phone, callback) {
  db.run(
    "UPDATE tasks SET status='done' WHERE id=? AND phone=?",
    [id, phone],
    callback
  );
}

/*
Get all pending tasks for reminders
*/
function getAllPending(callback) {
  db.all(
    "SELECT * FROM tasks WHERE status='pending'",
    [],
    callback
  );
}

module.exports = {
  db,
  addUser,
  addTask,
  getTasks,
  completeTask,
  getAllPending
};
const Database = require("better-sqlite3");

const db = new Database("tasks.db");

/* ================= DATABASE TABLES ================= */

db.exec(`

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT
);

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT
);

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_id INTEGER,
  name TEXT,
  year INTEGER,
  section TEXT
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  phone TEXT UNIQUE,
  class_id INTEGER
);

CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id INTEGER,
  student_id INTEGER
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  deadline TEXT,
  priority TEXT,
  created_by INTEGER,
  class_id INTEGER
);

CREATE TABLE IF NOT EXISTS task_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  student_id INTEGER,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  message TEXT,
  schedule_time TEXT
);

`);

/* ================= ADMIN ================= */

function createAdmin(username,password,role){
  const stmt = db.prepare(
    "INSERT INTO admins (username,password,role) VALUES (?,?,?)"
  );
  stmt.run(username,password,role);
}

function getAdmin(username){
  return db.prepare(
    "SELECT * FROM admins WHERE username=?"
  ).get(username);
}

/* ================= STUDENTS ================= */

function addStudent(name,phone,class_id){
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO students (name,phone,class_id) VALUES (?,?,?)"
  );
  stmt.run(name,phone,class_id);
}

function getStudents(class_id){
  return db.prepare(
    "SELECT * FROM students WHERE class_id=?"
  ).all(class_id);
}

/* ================= TASKS ================= */

function createTask(title,description,deadline,priority,class_id,teacher){
  const stmt = db.prepare(
    "INSERT INTO tasks (title,description,deadline,priority,class_id,created_by) VALUES (?,?,?,?,?,?)"
  );
  return stmt.run(title,description,deadline,priority,class_id,teacher);
}

function getTasksForStudent(student_id){
  return db.prepare(`
    SELECT t.*
    FROM tasks t
    JOIN task_status ts ON t.id = ts.task_id
    WHERE ts.student_id=? AND ts.status='pending'
  `).all(student_id);
}

function markTaskDone(task_id,student_id){
  db.prepare(`
    UPDATE task_status
    SET status='done'
    WHERE task_id=? AND student_id=?
  `).run(task_id,student_id);
}

/* ================= REMINDERS ================= */

function addReminder(task_id,message,time){
  db.prepare(
    "INSERT INTO reminders (task_id,message,schedule_time) VALUES (?,?,?)"
  ).run(task_id,message,time);
}

function getReminders(){
  return db.prepare("SELECT * FROM reminders").all();
}

module.exports = {
  db,
  createAdmin,
  getAdmin,
  addStudent,
  getStudents,
  createTask,
  getTasksForStudent,
  markTaskDone,
  addReminder,
  getReminders
};

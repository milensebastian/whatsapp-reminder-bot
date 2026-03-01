const db = require("./database");

const students = [
  "919645997520"
];

students.forEach(phone => {

  db.run(
    "INSERT INTO tasks (phone,title,status) VALUES (?,?,?)",
    [phone, "Cyber Security Assignment", "pending"]
  );

});

console.log("Tasks added");
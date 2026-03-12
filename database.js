const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./tasks.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("SQLite database connected");
  }
});

/* CREATE TABLES */

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

});

/* GET ADMIN */

function getAdmin(username){
  return new Promise((resolve,reject)=>{

    db.get(
      "SELECT * FROM admins WHERE username=?",
      [username],
      (err,row)=>{
        if(err) reject(err);
        else resolve(row);
      }
    );

  });
}

/* CREATE ADMIN */

function createAdmin(username,password,role){
  db.run(
    "INSERT INTO admins (username,password,role) VALUES (?,?,?)",
    [username,password,role]
  );
}

module.exports = {
  db,
  getAdmin,
  createAdmin
};

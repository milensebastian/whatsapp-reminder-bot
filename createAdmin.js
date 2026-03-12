const bcrypt = require("bcrypt");
const db = require("./database");

async function create(){

const password = await bcrypt.hash("admin123",10);

db.createAdmin("admin",password,"admin");

console.log("Admin created");

}

create();

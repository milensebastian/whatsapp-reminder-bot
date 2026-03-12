const db = require("./database");

function startReminderEngine(sendMessage){

console.log("Notify reminder engine started");

setInterval(()=>{

const now = new Date();
const nowTime = now.getTime();

/* GET ALL TASKS */

const tasks = db.db.prepare(
"SELECT * FROM tasks"
).all();

/* CHECK EACH TASK */

tasks.forEach(task => {

const deadline = new Date(task.deadline).getTime();

const diff = deadline - nowTime;

/* reminder checkpoints */

const hours = Math.floor(diff / (1000*60*60));

let reminderText = null;

if(hours === 48){
reminderText = "⏳ 2 days remaining";
}

else if(hours === 24){
reminderText = "⚠ 24 hours remaining";
}

else if(hours === 6){
reminderText = "⚠ 6 hours remaining";
}

else if(hours === 1){
reminderText = "🚨 1 hour remaining";
}

if(!reminderText) return;

/* get students in class */

const students = db.db.prepare(
"SELECT * FROM students WHERE class_id=?"
).all(task.class_id);

/* send reminder */

students.forEach(async student => {

const status = db.db.prepare(
"SELECT * FROM task_status WHERE task_id=? AND student_id=?"
).get(task.id,student.id);

/* skip completed tasks */

if(status && status.status === "done") return;

const message = `🔔 Notify – Campus Alert

Hello ${student.name}

📚 Task: ${task.title}

${reminderText}

Deadline: ${task.deadline}

Reply DONE ${task.id} after completing the task.`;

await sendMessage(student.phone,message);

console.log("Reminder sent to",student.phone);

});

});

},60000); // check every minute

}

module.exports = startReminderEngine;

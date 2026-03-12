const { Readable } = require("stream");
const csv = require("csv-parser");
const User = require("../models/User");

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

function sanitizeStudent(payload = {}) {
  return {
    name: String(payload.name || "").trim(),
    phone: normalizePhone(payload.phone),
    department: String(payload.department || "").trim(),
    year: payload.year ? Number(payload.year) : null,
    role: "student",
    status: "active",
  };
}

function validateStudent(student) {
  if (!student.name) throw new Error("Student name is required");
  if (!student.phone) throw new Error("Student phone is required");
  return student;
}

async function createStudent(payload) {
  const student = validateStudent(sanitizeStudent(payload));

  return User.findOneAndUpdate(
    { phone: student.phone },
    {
      $set: {
        name: student.name,
        department: student.department,
        year: student.year,
        role: "student",
        status: "active",
      },
      $setOnInsert: {
        phone: student.phone,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );
}

async function parseCsvBuffer(buffer) {
  if (!buffer || !buffer.length) throw new Error("CSV file is empty or missing");

  return new Promise((resolve, reject) => {
    const rows = [];

    Readable.from([buffer])
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function importStudentsFromCsv(fileBuffer) {
  const rows = await parseCsvBuffer(fileBuffer);
  const imported = [];
  const skipped = [];

  for (const row of rows) {
    try {
      const student = await createStudent({
        name: row.name,
        phone: row.phone,
        department: row.department,
        year: row.year,
      });

      imported.push(student);
    } catch (error) {
      skipped.push({ row, reason: error.message });
    }
  }

  return {
    importedCount: imported.length,
    skippedCount: skipped.length,
    imported,
    skipped,
  };
}

module.exports = {
  createStudent,
  parseCsvBuffer,
  importStudentsFromCsv,
};

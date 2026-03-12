const userImportService = require("../services/userImportService");

async function createUser(req, res, next) {
  try {
    const user = await userImportService.createStudent(req.body);

    return res.status(201).json({
      success: true,
      message: "Student saved successfully",
      data: user,
    });
  } catch (error) {
    return next(error);
  }
}

async function uploadUsers(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required",
      });
    }

    const result = await userImportService.importStudentsFromCsv(req.file.buffer);

    return res.status(200).json({
      success: true,
      message: "CSV import completed",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createUser,
  uploadUsers,
};

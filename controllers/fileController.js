const fileService = require("../services/fileService");

function buildBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

async function uploadFile(req, res, next) {
  try {
    const fileResource = await fileService.uploadFile(req.file, {
      title: req.body.title,
      uploadedBy: req.body.uploadedBy || null,
      targetClass: req.body.targetClass,
    });

    const result = await fileService.sendFileToClass(fileResource._id, buildBaseUrl(req));

    return res.status(201).json({
      success: true,
      message: "File uploaded and sent successfully",
      data: result.fileResource,
      sentTo: result.sentTo,
    });
  } catch (error) {
    return next(error);
  }
}

async function getFiles(req, res, next) {
  try {
    const files = await fileService.listFiles();
    return res.status(200).json({ success: true, data: files });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  uploadFile,
  getFiles,
};

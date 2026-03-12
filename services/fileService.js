const path = require("path");
const FileResource = require("../models/FileResource");
const ClassModel = require("../models/Class");
const whatsappService = require("./whatsappService");

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

function buildPublicFileUrl(filePath) {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  const relative = normalized.split("uploads/").pop();
  return `/uploads/${relative}`;
}

async function uploadFile(file, payload) {
  if (!file) {
    throw new Error("File upload is required");
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error("Unsupported file type. Allowed types: PDF, DOCX, Images");
  }

  const fileResource = await FileResource.create({
    title: payload.title,
    fileUrl: buildPublicFileUrl(file.path),
    uploadedBy: payload.uploadedBy || null,
    targetClass: payload.targetClass,
  });

  return FileResource.findById(fileResource._id).populate("targetClass", "name department year").lean();
}

async function sendFileToClass(fileResourceId, baseUrl = "") {
  const fileResource = await FileResource.findById(fileResourceId).populate({
    path: "targetClass",
    populate: {
      path: "members",
      select: "name phone",
    },
  });

  if (!fileResource) {
    throw new Error("File resource not found");
  }

  const classDoc = fileResource.targetClass;
  if (!classDoc) {
    throw new Error("Target class not found");
  }

  const fileUrl = baseUrl ? `${baseUrl}${fileResource.fileUrl}` : fileResource.fileUrl;
  const body = [
    "New Study Material",
    "",
    fileResource.title,
    "",
    "Download:",
    fileUrl,
  ].join("\n");

  for (const member of classDoc.members || []) {
    if (!member.phone) continue;
    await whatsappService.sendTextMessage(member.phone, body, {
      messageType: "file",
      fileResourceId: fileResource._id,
    });
  }

  return {
    success: true,
    sentTo: (classDoc.members || []).length,
    fileResource,
  };
}

async function listFiles() {
  return FileResource.find({})
    .populate("targetClass", "name department year")
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = {
  uploadFile,
  sendFileToClass,
  listFiles,
};

